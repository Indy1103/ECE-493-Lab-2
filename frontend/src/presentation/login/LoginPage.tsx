import { type FormEvent, useState } from "react";

import { submitLogin, type LoginSubmissionState } from "../../business/login/login.service.js";

type LoginPageState = { status: "IDLE" } | { status: "SUBMITTING" } | LoginSubmissionState;

export function LoginPage(): JSX.Element {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginPageState>({ status: "IDLE" });

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setState({ status: "SUBMITTING" });

    const outcome = await submitLogin({ username, password });
    setState(outcome);

    if (outcome.status === "AUTHENTICATED") {
      window.location.assign(outcome.roleHomePath);
    }
  }

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" disabled={state.status === "SUBMITTING"}>
          Log In
        </button>
      </form>
      {state.status === "SUBMITTING" ? <p>Signing in...</p> : null}
      {state.status === "AUTHENTICATED" ? <p>{state.message}</p> : null}
      {state.status === "INVALID_CREDENTIALS" ? <p>{state.message}</p> : null}
      {state.status === "ROLE_MAPPING_UNAVAILABLE" ? <p>{state.message}</p> : null}
      {state.status === "UNAVAILABLE" ? <p>{state.message}</p> : null}
      {state.status === "THROTTLED" ? (
        <p>
          {state.message}
          {typeof state.retryAfterSeconds === "number"
            ? ` Retry after ${state.retryAfterSeconds} seconds.`
            : ""}
        </p>
      ) : null}
    </main>
  );
}
