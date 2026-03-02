import { useState, type FormEvent } from "react";

import { saveDraftAction, type SaveDraftActionState } from "../../business/submission-drafts/saveDraftAction.js";

interface SubmissionDraftSavePanelProps {
  submissionId: string;
  initialTitle?: string;
  initialPayload?: Record<string, unknown>;
  onSaved?: (state: Extract<SaveDraftActionState, { state: "SUCCESS" }>) => void;
}

export function SubmissionDraftSavePanel(props: SubmissionDraftSavePanelProps): JSX.Element {
  const [title, setTitle] = useState(props.initialTitle ?? "");
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(props.initialPayload ?? {}, null, 2)
  );
  const [state, setState] = useState<SaveDraftActionState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);

    let draftPayload: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(payloadText);
      if (typeof parsed === "object" && parsed !== null) {
        draftPayload = parsed as Record<string, unknown>;
      }
    } catch {
      setSubmitting(false);
      setState({
        state: "VALIDATION_FAILED",
        message: "Draft payload must be valid JSON.",
        violations: [
          {
            field: "draftPayload",
            rule: "json",
            message: "Draft payload must be valid JSON."
          }
        ]
      });
      return;
    }

    const next = await saveDraftAction(props.submissionId, {
      title,
      draftPayload
    });

    setState(next);
    setSubmitting(false);

    if (next.state === "SUCCESS") {
      props.onSaved?.(next);
    }
  }

  return (
    <section>
      <h2>Save Submission Draft</h2>

      <form onSubmit={onSubmit}>
        <label>
          Draft Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <label>
          Draft Payload JSON
          <textarea
            value={payloadText}
            onChange={(event) => setPayloadText(event.target.value)}
            rows={8}
          />
        </label>

        <button type="submit" disabled={submitting}>
          Save Draft
        </button>
      </form>

      {submitting ? <p>Saving draft...</p> : null}
      {state?.state === "SUCCESS" ? <p>{state.message}</p> : null}

      {state?.state === "VALIDATION_FAILED" ? (
        <ul>
          <li>{state.message}</li>
          {state.violations.map((violation) => (
            <li key={`${violation.field}:${violation.rule}`}>{violation.message}</li>
          ))}
        </ul>
      ) : null}

      {state && state.state !== "SUCCESS" && state.state !== "VALIDATION_FAILED" ? (
        <p>{state.message}</p>
      ) : null}
    </section>
  );
}
