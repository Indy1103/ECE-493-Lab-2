import type { AssignmentViolation } from "./refereeAssignmentSchemas.js";
import type { PaperAssignmentCandidateRecord } from "../../data/referee-assignments/RefereeAssignmentRepository.js";

function violation(rule: AssignmentViolation["rule"], message: string): AssignmentViolation {
  return { rule, message };
}

export class PaperCapacityPolicyEvaluator {
  evaluate(input: {
    paper: PaperAssignmentCandidateRecord;
    currentAssignedCount: number;
    requestedCount: number;
  }): AssignmentViolation[] {
    if (input.paper.workflowState !== "AWAITING_ASSIGNMENT") {
      return [
        violation(
          "PAPER_NOT_AWAITING_ASSIGNMENT",
          "Paper is not in an assignment-eligible workflow state."
        )
      ];
    }

    const remaining = input.paper.maxRefereesPerPaper - input.currentAssignedCount;
    if (remaining < input.requestedCount) {
      return [
        violation(
          "PAPER_REFEREE_CAPACITY_REACHED",
          "Paper has reached the maximum allowed referees."
        )
      ];
    }

    return [];
  }
}
