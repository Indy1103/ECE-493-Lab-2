export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface LoginSuccessPayload {
  state: "AUTHENTICATED";
  message: string;
  roleHomePath: string;
  requestId: string;
}

export type LoginFailureCode =
  | "INVALID_CREDENTIALS"
  | "ROLE_MAPPING_UNAVAILABLE"
  | "LOGIN_THROTTLED"
  | "AUTHENTICATION_UNAVAILABLE"
  | "TLS_REQUIRED";

export interface LoginFailurePayload {
  code: LoginFailureCode;
  message: string;
  requestId: string;
  retryAfterSeconds?: number;
}

export interface LoginApiResponse {
  status: number;
  payload: LoginSuccessPayload | LoginFailurePayload;
}

export async function postLoginRequest(
  input: LoginRequestBody,
  baseUrl = ""
): Promise<LoginApiResponse> {
  const response = await fetch(`${baseUrl}/api/public/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as LoginSuccessPayload | LoginFailurePayload;
  return { status: response.status, payload };
}
