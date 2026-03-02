import type { AssignmentViolation } from "./refereeAssignmentSchemas.js";
import type { RefereeWorkloadProfileRecord } from "../../data/referee-assignments/RefereeAssignmentRepository.js";

function violation(rule: AssignmentViolation["rule"], message: string, refereeId: string): AssignmentViolation {
  return {
    rule,
    message,
    refereeId
  };
}

export class WorkloadPolicyEvaluator {
  evaluate(input: {
    requestedRefereeIds: string[];
    profilesById: Map<string, RefereeWorkloadProfileRecord>;
  }): AssignmentViolation[] {
    const violations: AssignmentViolation[] = [];

    for (const refereeId of input.requestedRefereeIds) {
      const profile = input.profilesById.get(refereeId);
      if (!profile || !profile.eligible) {
        violations.push(
          violation(
            "REFEREE_NOT_ASSIGNABLE",
            "Selected referee is not assignment eligible.",
            refereeId
          )
        );
        continue;
      }

      if (profile.currentActiveAssignments >= profile.maxActiveAssignments) {
        violations.push(
          violation(
            "REFEREE_WORKLOAD_LIMIT_REACHED",
            "Selected referee is at the workload limit.",
            refereeId
          )
        );
      }
    }

    return violations;
  }
}
