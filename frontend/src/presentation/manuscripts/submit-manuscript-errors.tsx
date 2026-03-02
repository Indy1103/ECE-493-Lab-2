import type {
  SubmitManuscriptResult,
  SubmissionRequirementsResult
} from "../../business/manuscripts/manuscript-submission.client.js";

type SubmissionErrorState = Exclude<SubmitManuscriptResult, { status: "SUCCESS" }> | null;
type RequirementsErrorState = Exclude<
  SubmissionRequirementsResult,
  { status: "REQUIREMENTS" }
> | null;

export function ManuscriptSubmissionErrors(props: {
  requirementsError: RequirementsErrorState;
  submissionError: SubmissionErrorState;
}): JSX.Element | null {
  const { requirementsError, submissionError } = props;

  if (requirementsError?.status === "UNAVAILABLE") {
    return <p>{requirementsError.message}</p>;
  }

  if (!submissionError) {
    return null;
  }

  if (submissionError.status === "VALIDATION_FAILED") {
    return (
      <ul>
        <li>{submissionError.message}</li>
        {submissionError.violations.map((violation) => (
          <li key={`${violation.field}:${violation.rule}`}>{violation.message}</li>
        ))}
      </ul>
    );
  }

  return <p>{submissionError.message}</p>;
}
