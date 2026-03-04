import { type FormEvent, useState } from "react";

import {
  submitPasswordChange,
  type PasswordChangeResult
} from "../../business/account/password-change.client.js";
import { PasswordChangeErrors } from "./change-password-errors.js";

type ViewState = { status: "IDLE" } | { status: "SUBMITTING" } | PasswordChangeResult;

interface ChangePasswordFormProps {
  onRequireReauthentication?: () => void;
}

export function ChangePasswordForm(props: ChangePasswordFormProps = {}): JSX.Element {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [state, setState] = useState<ViewState>({ status: "IDLE" });

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setState({ status: "SUBMITTING" });

    const result = await submitPasswordChange({
      currentPassword,
      newPassword,
      confirmNewPassword
    });

    setState(result);

    if (result.status === "SUCCESS" && result.reauthenticationRequired) {
      if (props.onRequireReauthentication) {
        props.onRequireReauthentication();
        return;
      }
      window.location.assign("/login");
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        Current Password
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>
      <label>
        New Password
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>
      <label>
        Confirm New Password
        <input
          type="password"
          value={confirmNewPassword}
          onChange={(event) => setConfirmNewPassword(event.target.value)}
        />
      </label>
      <button type="submit" disabled={state.status === "SUBMITTING"}>
        Change Password
      </button>
      {state.status === "SUBMITTING" ? <p>Updating password...</p> : null}
      {state.status === "SUCCESS" ? <p>{state.message}</p> : null}
      {state.status !== "IDLE" && state.status !== "SUBMITTING" && state.status !== "SUCCESS" ? (
        <PasswordChangeErrors result={state} />
      ) : null}
    </form>
  );
}
