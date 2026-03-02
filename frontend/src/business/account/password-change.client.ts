export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export type PasswordChangeResult =
  | { status: "SUCCESS"; message: string; reauthenticationRequired: true }
  | {
      status: "VALIDATION_FAILED";
      code: "VALIDATION_FAILED";
      message: string;
      violations: Array<{ field: string; rule: string; message: string }>;
    }
  | {
      status: "UNAUTHORIZED" | "CONFLICT" | "THROTTLED" | "UNAVAILABLE";
      code: string;
      message: string;
      retryAfterSeconds?: number;
    };

export async function submitPasswordChange(
  payload: PasswordChangeRequest,
  baseUrl = ""
): Promise<PasswordChangeResult> {
  const response = await fetch(`${baseUrl}/api/v1/account/password-change`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "SUCCESS",
      message: String(body.message ?? "Password changed successfully. Please sign in again."),
      reauthenticationRequired: true
    };
  }

  if (response.status === 400) {
    return {
      status: "VALIDATION_FAILED",
      code: "VALIDATION_FAILED",
      message: String(body.message ?? "Password change validation failed."),
      violations: Array.isArray(body.violations)
        ? (body.violations as Array<{ field: string; rule: string; message: string }>)
        : []
    };
  }

  if (response.status === 401) {
    return {
      status: "UNAUTHORIZED",
      code: String(body.code ?? "SESSION_INVALID"),
      message: String(body.message ?? "Session is invalid or expired.")
    };
  }

  if (response.status === 409) {
    return {
      status: "CONFLICT",
      code: String(body.code ?? "CREDENTIAL_VERSION_CONFLICT"),
      message: String(body.message ?? "Password change conflicted with another update. Please retry.")
    };
  }

  if (response.status === 429) {
    return {
      status: "THROTTLED",
      code: String(body.code ?? "PASSWORD_CHANGE_THROTTLED"),
      message: String(body.message ?? "Too many failed password change attempts. Please try again later."),
      retryAfterSeconds:
        typeof body.retryAfterSeconds === "number" ? body.retryAfterSeconds : undefined
    };
  }

  return {
    status: "UNAVAILABLE",
    code: String(body.code ?? "PASSWORD_CHANGE_UNAVAILABLE"),
    message: String(body.message ?? "Password change is temporarily unavailable. Please try again.")
  };
}
