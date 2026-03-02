import { type FormEvent, useMemo, useState } from "react";

import {
  fetchManuscriptSubmissionRequirements,
  submitManuscript,
  type SubmitManuscriptResult,
  type SubmissionRequirementsResult
} from "../../business/manuscripts/manuscript-submission.client.js";
import { ManuscriptSubmissionErrors } from "./submit-manuscript-errors.js";

type SubmissionViewState = { status: "IDLE" } | { status: "SUBMITTING" } | SubmitManuscriptResult;

export function SubmitManuscriptForm(): JSX.Element {
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [correspondingAuthorEmail, setCorrespondingAuthorEmail] = useState("");
  const [primarySubjectArea, setPrimarySubjectArea] = useState("");
  const [fileName, setFileName] = useState("paper.pdf");
  const [fileMediaType, setFileMediaType] = useState("application/pdf");
  const [fileBytes, setFileBytes] = useState("1024");
  const [fileDigest, setFileDigest] = useState("a".repeat(64));
  const [requirementsState, setRequirementsState] = useState<SubmissionRequirementsResult | null>(null);
  const [submitState, setSubmitState] = useState<SubmissionViewState>({ status: "IDLE" });

  const metadataPolicyLabel = useMemo(() => {
    if (requirementsState?.status !== "REQUIREMENTS") {
      return "Requirements unavailable";
    }
    return requirementsState.requirements.metadataPolicyVersion;
  }, [requirementsState]);

  async function onLoadRequirements(): Promise<void> {
    setRequirementsState(await fetchManuscriptSubmissionRequirements());
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitState({ status: "SUBMITTING" });

    const keywordsList = keywords
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    const response = await submitManuscript({
      metadata: {
        title,
        abstract,
        keywords: keywordsList,
        fullAuthorList: [{ name: authorName }],
        correspondingAuthorEmail,
        primarySubjectArea
      },
      manuscriptFile: {
        filename: fileName,
        mediaType: fileMediaType,
        byteSize: Number(fileBytes),
        sha256Digest: fileDigest
      }
    });

    setSubmitState(response);
  }

  return (
    <main>
      <h1>Submit Manuscript</h1>
      <button type="button" onClick={onLoadRequirements}>
        Load Submission Requirements
      </button>
      <p>Policy: {metadataPolicyLabel}</p>

      <form onSubmit={onSubmit}>
        <label>
          Manuscript Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Abstract
          <textarea value={abstract} onChange={(event) => setAbstract(event.target.value)} />
        </label>
        <label>
          Keywords
          <input
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="comma-separated"
          />
        </label>
        <label>
          Author Name
          <input value={authorName} onChange={(event) => setAuthorName(event.target.value)} />
        </label>
        <label>
          Corresponding Author Email
          <input
            type="email"
            value={correspondingAuthorEmail}
            onChange={(event) => setCorrespondingAuthorEmail(event.target.value)}
          />
        </label>
        <label>
          Primary Subject Area
          <input
            value={primarySubjectArea}
            onChange={(event) => setPrimarySubjectArea(event.target.value)}
          />
        </label>
        <label>
          Manuscript Filename
          <input value={fileName} onChange={(event) => setFileName(event.target.value)} />
        </label>
        <label>
          Manuscript Media Type
          <input value={fileMediaType} onChange={(event) => setFileMediaType(event.target.value)} />
        </label>
        <label>
          Manuscript Size Bytes
          <input value={fileBytes} onChange={(event) => setFileBytes(event.target.value)} />
        </label>
        <label>
          Manuscript SHA256 Digest
          <input value={fileDigest} onChange={(event) => setFileDigest(event.target.value)} />
        </label>

        <button type="submit" disabled={submitState.status === "SUBMITTING"}>
          Submit Manuscript
        </button>
      </form>

      {submitState.status === "SUBMITTING" ? <p>Submitting manuscript...</p> : null}
      {submitState.status === "SUCCESS" ? <p>{submitState.message}</p> : null}
      <ManuscriptSubmissionErrors
        requirementsError={requirementsState?.status === "UNAVAILABLE" ? requirementsState : null}
        submissionError={
          submitState.status !== "IDLE" &&
          submitState.status !== "SUBMITTING" &&
          submitState.status !== "SUCCESS"
            ? submitState
            : null
        }
      />
    </main>
  );
}
