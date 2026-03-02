import type {
  RefereeAssignmentRecord,
  RefereeAssignmentRepository,
  ReviewInvitationRecord
} from "../../data/referee-assignments/RefereeAssignmentRepository.js";

interface InvitationDispatchAdapter {
  sendInvitation(input: {
    assignmentId: string;
    paperId: string;
    refereeId: string;
  }): Promise<void>;
}

interface InvitationDispatchServiceDeps {
  repository: Pick<
    RefereeAssignmentRepository,
    | "createInvitationIntent"
    | "updateInvitationStatus"
    | "listRetryableInvitations"
  >;
  dispatchAdapter: InvitationDispatchAdapter;
  maxRetryAttempts?: number;
  baseBackoffMs?: number;
}

export interface InvitationDispatchStatus {
  refereeId: string;
  status: "SENT" | "PENDING_RETRY";
}

export class InvitationDispatchService {
  private readonly maxRetryAttempts: number;
  private readonly baseBackoffMs: number;

  constructor(private readonly deps: InvitationDispatchServiceDeps) {
    this.maxRetryAttempts = deps.maxRetryAttempts ?? 3;
    this.baseBackoffMs = deps.baseBackoffMs ?? 100;
  }

  async dispatchForAssignments(
    assignments: RefereeAssignmentRecord[]
  ): Promise<InvitationDispatchStatus[]> {
    const statuses: InvitationDispatchStatus[] = [];

    for (const assignment of assignments) {
      const invitation = await this.deps.repository.createInvitationIntent({
        assignmentId: assignment.id,
        paperId: assignment.paperId,
        refereeId: assignment.refereeId
      });

      try {
        await this.deps.dispatchAdapter.sendInvitation({
          assignmentId: assignment.id,
          paperId: assignment.paperId,
          refereeId: assignment.refereeId
        });

        await this.deps.repository.updateInvitationStatus({
          invitationId: invitation.id,
          status: "SENT",
          failureReasonCode: null,
          incrementAttempt: true
        });

        statuses.push({
          refereeId: assignment.refereeId,
          status: "SENT"
        });
      } catch {
        await this.deps.repository.updateInvitationStatus({
          invitationId: invitation.id,
          status: "FAILED_RETRYABLE",
          failureReasonCode: "INVITATION_DELIVERY_FAILED",
          incrementAttempt: true
        });

        statuses.push({
          refereeId: assignment.refereeId,
          status: "PENDING_RETRY"
        });
      }
    }

    return statuses;
  }

  async retryFailedInvitations(): Promise<void> {
    const retryableInvitations = await this.deps.repository.listRetryableInvitations();

    for (const invitation of retryableInvitations) {
      const nextBackoffMs = this.calculateBackoffMs(invitation.attemptCount);
      if (nextBackoffMs < 0) {
        continue;
      }

      try {
        await this.deps.dispatchAdapter.sendInvitation({
          assignmentId: invitation.assignmentId,
          paperId: invitation.paperId,
          refereeId: invitation.refereeId
        });

        await this.deps.repository.updateInvitationStatus({
          invitationId: invitation.id,
          status: "SENT",
          failureReasonCode: null,
          incrementAttempt: true
        });
      } catch {
        const terminal = invitation.attemptCount + 1 >= this.maxRetryAttempts;

        await this.deps.repository.updateInvitationStatus({
          invitationId: invitation.id,
          status: terminal ? "FAILED_FINAL" : "FAILED_RETRYABLE",
          failureReasonCode: terminal ? "RETRY_BUDGET_EXHAUSTED" : "INVITATION_DELIVERY_FAILED",
          incrementAttempt: true
        });
      }
    }
  }

  private calculateBackoffMs(currentAttempt: number): number {
    if (currentAttempt >= this.maxRetryAttempts) {
      return -1;
    }

    return this.baseBackoffMs * 2 ** Math.max(currentAttempt - 1, 0);
  }
}

export class InMemoryInvitationDispatchAdapter implements InvitationDispatchAdapter {
  private readonly remainingFailureBudget = new Map<string, number>();

  constructor(failureBudgetByReferee: Record<string, number> = {}) {
    for (const [refereeId, budget] of Object.entries(failureBudgetByReferee)) {
      this.remainingFailureBudget.set(refereeId, budget);
    }
  }

  setFailureBudget(refereeId: string, attemptsToFail: number): void {
    this.remainingFailureBudget.set(refereeId, attemptsToFail);
  }

  async sendInvitation(input: {
    assignmentId: string;
    paperId: string;
    refereeId: string;
  }): Promise<void> {
    const remaining = this.remainingFailureBudget.get(input.refereeId) ?? 0;

    if (remaining <= 0) {
      return;
    }

    this.remainingFailureBudget.set(input.refereeId, remaining - 1);
    throw new Error("invitation-delivery-failed");
  }
}
