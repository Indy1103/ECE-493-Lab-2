import { useState } from "react";

import {
  loadAssignedPapers,
  requestAssignedPaperAccess,
  type AssignedPaperAccessState,
  type AssignedPaperPageState
} from "../../business/referee-access/assignedPaperAccessController.js";
import { AssignedPaperAccessAlert } from "./AssignedPaperAccessAlert.js";
import { AssignedPapersEmptyState } from "./AssignedPapersEmptyState.js";

export function AssignedPapersPage(): JSX.Element {
  const [listState, setListState] = useState<AssignedPaperPageState | null>(null);
  const [accessState, setAccessState] = useState<AssignedPaperAccessState | null>(null);
  const [loading, setLoading] = useState(false);

  async function refreshList(): Promise<void> {
    setLoading(true);
    const result = await loadAssignedPapers();
    setListState(result);
    setLoading(false);
  }

  async function onAccess(assignmentId: string): Promise<void> {
    setLoading(true);
    const result = await requestAssignedPaperAccess(assignmentId);
    setAccessState(result);

    if (result.state === "UNAVAILABLE") {
      setListState({
        state: result.items.length === 0 ? "NO_ASSIGNMENTS" : "ASSIGNMENTS_AVAILABLE",
        items: result.items
      });
    }

    setLoading(false);
  }

  return (
    <section>
      <h1>Assigned Papers</h1>
      <button type="button" onClick={() => void refreshList()} disabled={loading}>
        Refresh Assigned Papers
      </button>

      {listState?.state === "NO_ASSIGNMENTS" ? <AssignedPapersEmptyState /> : null}

      {listState?.state === "ASSIGNMENTS_AVAILABLE" ? (
        <ul>
          {listState.items.map((item) => (
            <li key={item.assignmentId}>
              <strong>{item.title}</strong> ({item.availability})
              <button
                type="button"
                onClick={() => void onAccess(item.assignmentId)}
                disabled={loading || item.availability === "UNAVAILABLE"}
              >
                Access Paper
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {listState?.state === "ERROR" ? (
        <AssignedPaperAccessAlert tone="error" message={listState.message} />
      ) : null}

      {accessState?.state === "ACCESS_GRANTED" ? (
        <article>
          <h2>{accessState.paper.title}</h2>
          <p>Paper URL: {accessState.paper.contentUrl}</p>
          <p>Review Form URL: {accessState.reviewForm.formUrl}</p>
          <p>Schema Version: {accessState.reviewForm.schemaVersion}</p>
        </article>
      ) : null}

      {accessState?.state === "UNAVAILABLE" ? (
        <AssignedPaperAccessAlert tone="warning" message={accessState.message} />
      ) : null}

      {accessState?.state === "ERROR" ? (
        <AssignedPaperAccessAlert tone="error" message={accessState.message} />
      ) : null}
    </section>
  );
}
