import {
  postLoginRequest,
  type LoginFailurePayload,
  type LoginRequestBody,
  type LoginSuccessPayload
} from "../../data/login/login.api.js";
import { mapLoginErrorState, type LoginErrorState } from "./login-error-state.js";

export interface LoginSuccessState {
  status: "AUTHENTICATED";
  message: string;
  roleHomePath: string;
}

export type LoginSubmissionState = LoginSuccessState | LoginErrorState;

export function mapLoginSuccessState(
  response: Pick<LoginSuccessPayload, "state" | "roleHomePath" | "message">
): LoginSuccessState {
  return {
    status: response.state,
    message: response.message,
    roleHomePath: response.roleHomePath
  };
}

export async function submitLogin(
  input: LoginRequestBody,
  baseUrl = ""
): Promise<LoginSubmissionState> {
  const response = await postLoginRequest(input, baseUrl);

  if (response.status === 200) {
    return mapLoginSuccessState(response.payload as LoginSuccessPayload);
  }

  const failurePayload = response.payload as LoginFailurePayload;
  const errorState = mapLoginErrorState(
    response.status,
    typeof failurePayload.retryAfterSeconds === "number"
      ? failurePayload.retryAfterSeconds
      : undefined
  );

  return {
    ...errorState,
    message:
      typeof failurePayload.message === "string"
        ? failurePayload.message
        : errorState.message
  };
}
