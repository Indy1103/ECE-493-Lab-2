interface DecisionAuthorNotifierDeps {
  forceFailure?: boolean;
}

export interface AuthorDecisionNotification {
  authorUserId: string;
  paperId: string;
  decision: "ACCEPT" | "REJECT";
  decidedAt: string;
}

export class DecisionAuthorNotifier {
  private forceFailure: boolean;
  private readonly dispatches: AuthorDecisionNotification[] = [];

  constructor(deps: DecisionAuthorNotifierDeps = {}) {
    this.forceFailure = deps.forceFailure ?? false;
  }

  setForceFailure(value: boolean): void {
    this.forceFailure = value;
  }

  async notifyAuthor(input: AuthorDecisionNotification): Promise<"NOTIFIED" | "NOTIFICATION_FAILED"> {
    this.dispatches.push({ ...input });

    if (this.forceFailure) {
      return "NOTIFICATION_FAILED";
    }

    return "NOTIFIED";
  }

  getDispatches(): AuthorDecisionNotification[] {
    return this.dispatches.map((dispatch) => ({ ...dispatch }));
  }
}

export const FINAL_DECISION_AUTHOR_NOTIFIER_MARKER = "final_decision_author_notifier_marker" as const;
