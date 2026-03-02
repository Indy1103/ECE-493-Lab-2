import type { PasswordChangeResult } from "../../business/account/password-change.client.js";

export function PasswordChangeErrors(props: {
  result: Exclude<PasswordChangeResult, { status: "SUCCESS" }> | null;
}): JSX.Element | null {
  const { result } = props;
  if (!result) {
    return null;
  }

  if (result.status === "VALIDATION_FAILED") {
    return (
      <ul>
        <li>{result.message}</li>
        {result.violations.map((violation) => (
          <li key={`${violation.field}:${violation.rule}`}>{violation.message}</li>
        ))}
      </ul>
    );
  }

  if (result.status === "THROTTLED") {
    return (
      <p>
        {result.message}
        {typeof result.retryAfterSeconds === "number"
          ? ` Retry after ${result.retryAfterSeconds} seconds.`
          : ""}
      </p>
    );
  }

  return <p>{result.message}</p>;
}
