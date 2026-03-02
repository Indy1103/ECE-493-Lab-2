import { useState } from "react";

import {
  resumeDraftAction,
  type ResumeDraftActionState
} from "../../business/submission-drafts/resumeDraftAction.js";
import { SubmissionDraftSavePanel } from "./SubmissionDraftSavePanel.js";

interface SubmissionDraftEditorProps {
  submissionId: string;
}

export function SubmissionDraftEditor(props: SubmissionDraftEditorProps): JSX.Element {
  const [resumeState, setResumeState] = useState<ResumeDraftActionState | null>(null);
  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState<Record<string, unknown>>({});

  async function onResume(): Promise<void> {
    const result = await resumeDraftAction(props.submissionId);
    setResumeState(result);

    if (result.state === "SUCCESS") {
      setTitle(result.title);
      setPayload(result.draftPayload);
    }
  }

  return (
    <main>
      <h1>Submission Draft Editor</h1>
      <button type="button" onClick={onResume}>
        Resume Saved Draft
      </button>

      {resumeState?.state === "SUCCESS" ? <p>Draft loaded successfully.</p> : null}
      {resumeState && resumeState.state !== "SUCCESS" ? <p>{resumeState.message}</p> : null}

      <SubmissionDraftSavePanel
        submissionId={props.submissionId}
        initialTitle={title}
        initialPayload={payload}
      />
    </main>
  );
}
