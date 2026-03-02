import { useState } from "react";

import {
  getAuthorDecisionUseCase,
  type AuthorDecisionViewState
} from "../../business/author-decision/get-author-decision.use-case.js";

interface AuthorDecisionPageProps {
  paperId: string;
}

export function AuthorDecisionPage(props: AuthorDecisionPageProps): JSX.Element {
  const [state, setState] = useState<AuthorDecisionViewState | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLoadDecision(): Promise<void> {
    setLoading(true);
    setState(await getAuthorDecisionUseCase(props.paperId));
    setLoading(false);
  }

  return (
    <section>
      <h2>Final Decision</h2>
      <button type="button" disabled={loading} onClick={() => void onLoadDecision()}>
        Load Decision
      </button>

      {state?.state === "AVAILABLE" ? (
        <article>
          <p>Paper: {state.paperId}</p>
          <p role="status">Decision: {state.decision}</p>
        </article>
      ) : null}

      {state?.state === "NOTIFICATION_FAILED" ? (
        <p role="status">{state.message}</p>
      ) : null}

      {state?.state === "ERROR" ? <p role="status">{state.message}</p> : null}
    </section>
  );
}

export const AUTHOR_DECISION_PAGE_MARKER = "author_decision_page_marker" as const;
