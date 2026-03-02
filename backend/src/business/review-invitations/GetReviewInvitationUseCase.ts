import type { ReviewInvitationRepository } from "../../data/review-invitations/ReviewInvitationRepository.js";

export type GetReviewInvitationOutcome =
  | {
      outcome: "SUCCESS";
      invitationId: string;
      paperId: string;
      paperTitle: string;
      paperSummary: string;
      reviewDueAt: string;
      responseDeadlineAt: string;
      status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    }
  | {
      outcome: "AUTHORIZATION_FAILED";
      code: "AUTHORIZATION_FAILED";
      message: string;
    }
  | {
      outcome: "INVITATION_NOT_FOUND";
      code: "INVITATION_NOT_FOUND";
      message: string;
    }
  | {
      outcome: "INTERNAL_ERROR";
      code: "INTERNAL_ERROR";
      message: string;
    };

interface GetReviewInvitationUseCaseDeps {
  repository: Pick<ReviewInvitationRepository, "getInvitationById">;
}

export class GetReviewInvitationUseCase {
  constructor(private readonly deps: GetReviewInvitationUseCaseDeps) {}

  async execute(input: {
    invitationId: string;
    refereeId: string;
  }): Promise<GetReviewInvitationOutcome> {
    try {
      const invitation = await this.deps.repository.getInvitationById(input.invitationId);

      if (!invitation) {
        return {
          outcome: "INVITATION_NOT_FOUND",
          code: "INVITATION_NOT_FOUND",
          message: "Review invitation was not found."
        };
      }

      if (invitation.refereeId !== input.refereeId) {
        return {
          outcome: "AUTHORIZATION_FAILED",
          code: "AUTHORIZATION_FAILED",
          message: "Invitation does not belong to the authenticated referee."
        };
      }

      return {
        outcome: "SUCCESS",
        invitationId: invitation.invitationId,
        paperId: invitation.paperId,
        paperTitle: invitation.paperTitle,
        paperSummary: invitation.paperSummary,
        reviewDueAt: invitation.reviewDueAt.toISOString(),
        responseDeadlineAt: invitation.responseDeadlineAt.toISOString(),
        status: invitation.invitationStatus
      };
    } catch {
      return {
        outcome: "INTERNAL_ERROR",
        code: "INTERNAL_ERROR",
        message: "Review invitation details are currently unavailable."
      };
    }
  }
}
