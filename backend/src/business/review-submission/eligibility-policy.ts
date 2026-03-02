import { REVIEW_SUBMISSION_REASON_CODES } from "./submission-outcome.js";
import type { AssignmentEligibilityRecord } from "./ports.js";

export type FormAccessDecision =
  | {
      allowed: true;
      eligibility: AssignmentEligibilityRecord;
    }
  | {
      allowed: false;
      statusCode: 404;
      reasonCode: "non-owned-or-non-assigned";
    };

export type SubmissionEligibilityDecision =
  | {
      allowed: true;
      eligibility: AssignmentEligibilityRecord;
    }
  | {
      allowed: false;
      statusCode: 404 | 409;
      reasonCode: "non-owned-or-non-assigned" | "submit-time-ineligible";
    };

export class ReviewSubmissionEligibilityPolicy {
  evaluateFormAccess(
    eligibility: AssignmentEligibilityRecord | null,
    refereeUserId: string
  ): FormAccessDecision {
    if (!eligibility || eligibility.refereeUserId !== refereeUserId) {
      return {
        allowed: false,
        statusCode: 404,
        reasonCode: REVIEW_SUBMISSION_REASON_CODES.NON_OWNED_OR_NON_ASSIGNED
      };
    }

    return {
      allowed: true,
      eligibility
    };
  }

  evaluateSubmissionEligibility(
    eligibility: AssignmentEligibilityRecord | null,
    refereeUserId: string
  ): SubmissionEligibilityDecision {
    if (!eligibility || eligibility.refereeUserId !== refereeUserId) {
      return {
        allowed: false,
        statusCode: 404,
        reasonCode: REVIEW_SUBMISSION_REASON_CODES.NON_OWNED_OR_NON_ASSIGNED
      };
    }

    if (
      eligibility.invitationStatus !== "ACCEPTED" ||
      eligibility.submissionEligibility !== "ELIGIBLE"
    ) {
      return {
        allowed: false,
        statusCode: 409,
        reasonCode: REVIEW_SUBMISSION_REASON_CODES.SUBMIT_TIME_INELIGIBLE
      };
    }

    return {
      allowed: true,
      eligibility
    };
  }
}
