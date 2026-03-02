import { type FormEvent, useState } from "react";

type SubmitState =
  | { type: "IDLE" }
  | { type: "REGISTERED"; message: string }
  | { type: "VALIDATION_FAILED"; message: string }
  | { type: "DUPLICATE_EMAIL"; message: string }
  | { type: "THROTTLED"; message: string }
  | { type: "PROCESSING_FAILURE"; message: string };

export function RegisterPage(): JSX.Element {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ type: "IDLE" });

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const response = await fetch("/api/public/registrations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fullName, email, password })
    });

    const payload = (await response.json()) as Record<string, unknown>;

    if (response.status === 201) {
      setSubmitState({
        type: "REGISTERED",
        message: String(payload.message ?? "Account created successfully. You can now log in.")
      });
      return;
    }

    if (response.status === 400) {
      setSubmitState({
        type: "VALIDATION_FAILED",
        message: String(payload.message ?? "Some registration information is invalid or missing.")
      });
      return;
    }

    if (response.status === 409) {
      setSubmitState({
        type: "DUPLICATE_EMAIL",
        message: String(
          payload.message ??
            "This email is already registered. Please use a different email address."
        )
      });
      return;
    }

    if (response.status === 429) {
      setSubmitState({
        type: "THROTTLED",
        message: String(payload.message ?? "Too many failed registration attempts. Please try again later.")
      });
      return;
    }

    setSubmitState({
      type: "PROCESSING_FAILURE",
      message: String(payload.message ?? "Registration is temporarily unavailable. Please try again.")
    });
  }

  return (
    <main>
      <h1>Create Account</h1>
      <form onSubmit={onSubmit}>
        <label>
          Full Name
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit">Register</button>
      </form>
      {submitState.type !== "IDLE" ? <p>{submitState.message}</p> : null}
    </main>
  );
}
