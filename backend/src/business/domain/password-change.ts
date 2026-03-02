export type PasswordChangeOutcome =
  | {
      outcome: "SUCCESS";
      message: string;
      reauthenticationRequired: true;
    }
  | {
      outcome: "VALIDATION_FAILED";
      message: string;
      violations: Array<{ field: string; rule: string; message: string }>;
    }
  | {
      outcome: "THROTTLED";
      code: "PASSWORD_CHANGE_THROTTLED";
      message: string;
      retryAfterSeconds: number;
    }
  | {
      outcome: "CONFLICT";
      code: "CREDENTIAL_VERSION_CONFLICT";
      message: string;
    }
  | {
      outcome: "OPERATIONAL_FAILURE";
      code: "PASSWORD_CHANGE_UNAVAILABLE";
      message: string;
    };

export interface PasswordChangeRequestInput {
  accountId: string;
  sessionId: string;
  sourceIp: string;
  requestId: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
