import {
  type AssignmentViolation,
  validateAssignRefereesRequest
} from "./refereeAssignmentSchemas.js";
import { WorkloadPolicyEvaluator } from "./WorkloadPolicyEvaluator.js";
import { PaperCapacityPolicyEvaluator } from "./PaperCapacityPolicyEvaluator.js";
import {
  type RefereeAssignmentRepository,
  type RefereeAssignmentRecord
} from "../../data/referee-assignments/RefereeAssignmentRepository.js";
import { RefereeAssignmentConflictError } from "../../data/referee-assignments/PrismaRefereeAssignmentRepository.js";
import {
  type InvitationDispatchStatus,
  InvitationDispatchService
} from "./InvitationDispatchService.js";
import { RefereeAssignmentAuditService } from "../../shared/audit/refereeAssignmentAudit.js";

export type AssignRefereesOutcome =
  | {
      outcome: "SUCCESS";
      paperId: string;
      assignedRefereeIds: string[];
      invitationStatuses: InvitationDispatchStatus[];
      message: "Referees assigned successfully.";
    }
  | {
      outcome: "VALIDATION_FAILED";
      code: "VALIDATION_FAILED";
      message: string;
      violations: AssignmentViolation[];
    }
  | {
      outcome: "PAPER_NOT_FOUND";
      code: "PAPER_NOT_FOUND";
      message: string;
    }
  | {
      outcome: "PAPER_NOT_ASSIGNABLE";
      code: "PAPER_NOT_ASSIGNABLE";
      message: string;
    }
  | {
      outcome: "ASSIGNMENT_CONFLICT";
      code: "ASSIGNMENT_CONFLICT";
      message: string;
    }
  | {
      outcome: "INTERNAL_ERROR";
      code: "INTERNAL_ERROR";
      message: string;
    };

interface AssignRefereesUseCaseDeps {
  repository: RefereeAssignmentRepository;
  invitationDispatchService: InvitationDispatchService;
  workloadPolicyEvaluator: WorkloadPolicyEvaluator;
  paperCapacityPolicyEvaluator: PaperCapacityPolicyEvaluator;
  auditService: RefereeAssignmentAuditService;
}

export class AssignRefereesUseCase {
  constructor(private readonly deps: AssignRefereesUseCaseDeps) {}

  async execute(input: {
    paperId: string;
    editorId: string;
    requestId: string;
    body: unknown;
  }): Promise<AssignRefereesOutcome> {
    const parsed = validateAssignRefereesRequest(input.body);

    if (!parsed.valid) {
      await this.deps.auditService.recordOutcome({
        requestId: input.requestId,
        paperId: input.paperId,
        editorId: input.editorId,
        submittedRefereeIdsCount: 0,
        outcome: "VALIDATION_FAILED",
        reasonCode: "VALIDATION_FAILED"
      });

      return {
        outcome: "VALIDATION_FAILED",
        code: "VALIDATION_FAILED",
        message: "Assignment validation failed.",
        violations: parsed.violations
      };
    }

    try {
      return await this.deps.repository.withPaperLock(input.paperId, async () => {
        const paper = await this.deps.repository.getPaperCandidate(input.paperId);
        if (!paper) {
          await this.deps.auditService.recordOutcome({
            requestId: input.requestId,
            paperId: input.paperId,
            editorId: input.editorId,
            submittedRefereeIdsCount: parsed.refereeIds.length,
            outcome: "VALIDATION_FAILED",
            reasonCode: "PAPER_NOT_FOUND"
          });

          return {
            outcome: "PAPER_NOT_FOUND",
            code: "PAPER_NOT_FOUND",
            message: "Paper was not found."
          };
        }

        if (paper.workflowState !== "AWAITING_ASSIGNMENT") {
          await this.deps.auditService.recordOutcome({
            requestId: input.requestId,
            paperId: input.paperId,
            editorId: input.editorId,
            submittedRefereeIdsCount: parsed.refereeIds.length,
            outcome: "VALIDATION_FAILED",
            reasonCode: "PAPER_NOT_ASSIGNABLE"
          });

          return {
            outcome: "PAPER_NOT_ASSIGNABLE",
            code: "PAPER_NOT_ASSIGNABLE",
            message: "Paper is not eligible for referee assignment."
          };
        }

        const assignments = await this.deps.repository.getAssignmentsByPaper(input.paperId);
        const profiles = await this.deps.repository.listRefereeProfiles(paper.conferenceCycleId);
        const profilesById = new Map(profiles.map((profile) => [profile.refereeId, profile]));

        const violations: AssignmentViolation[] = [];

        violations.push(
          ...this.deps.workloadPolicyEvaluator.evaluate({
            requestedRefereeIds: parsed.refereeIds,
            profilesById
          })
        );

        violations.push(
          ...this.deps.paperCapacityPolicyEvaluator.evaluate({
            paper,
            currentAssignedCount: assignments.length,
            requestedCount: parsed.refereeIds.length
          })
        );

        for (const refereeId of parsed.refereeIds) {
          const existing = await this.deps.repository.findActiveAssignment(input.paperId, refereeId);
          if (existing) {
            violations.push({
              rule: "REFEREE_NOT_ASSIGNABLE",
              message: "Selected referee is already assigned to this paper.",
              refereeId
            });
          }
        }

        if (violations.length > 0) {
          await this.deps.auditService.recordOutcome({
            requestId: input.requestId,
            paperId: input.paperId,
            editorId: input.editorId,
            submittedRefereeIdsCount: parsed.refereeIds.length,
            outcome: "VALIDATION_FAILED",
            reasonCode: violations[0].rule
          });

          return {
            outcome: "VALIDATION_FAILED",
            code: "VALIDATION_FAILED",
            message: "Assignment validation failed.",
            violations
          };
        }

        const snapshot = this.deps.repository.snapshot();

        try {
          const createdAssignments = await this.deps.repository.createAssignments({
            paperId: input.paperId,
            conferenceCycleId: paper.conferenceCycleId,
            editorId: input.editorId,
            refereeIds: parsed.refereeIds
          });

          const invitationStatuses =
            await this.deps.invitationDispatchService.dispatchForAssignments(createdAssignments);

          const retryable = invitationStatuses.some((status) => status.status === "PENDING_RETRY");

          await this.deps.auditService.recordOutcome({
            requestId: input.requestId,
            paperId: input.paperId,
            editorId: input.editorId,
            submittedRefereeIdsCount: parsed.refereeIds.length,
            outcome: retryable ? "INVITATION_RETRYABLE_FAILURE" : "SUCCESS",
            reasonCode: retryable ? "INVITATION_DELIVERY_FAILED" : "ASSIGNMENT_COMMITTED"
          });

          return {
            outcome: "SUCCESS",
            paperId: input.paperId,
            assignedRefereeIds: createdAssignments.map((assignment) => assignment.refereeId),
            invitationStatuses,
            message: "Referees assigned successfully."
          };
        } catch {
          this.deps.repository.restore(snapshot);
          await this.deps.auditService.recordOutcome({
            requestId: input.requestId,
            paperId: input.paperId,
            editorId: input.editorId,
            submittedRefereeIdsCount: parsed.refereeIds.length,
            outcome: "INTERNAL_ERROR",
            reasonCode: "INTERNAL_ERROR"
          });

          return {
            outcome: "INTERNAL_ERROR",
            code: "INTERNAL_ERROR",
            message: "Referee assignment failed unexpectedly."
          };
        }
      });
    } catch (error) {
      if (error instanceof RefereeAssignmentConflictError) {
        await this.deps.auditService.recordOutcome({
          requestId: input.requestId,
          paperId: input.paperId,
          editorId: input.editorId,
          submittedRefereeIdsCount: parsed.refereeIds.length,
          outcome: "CONFLICT",
          reasonCode: "ASSIGNMENT_CONFLICT"
        });

        return {
          outcome: "ASSIGNMENT_CONFLICT",
          code: "ASSIGNMENT_CONFLICT",
          message: "Assignment request conflicted with another in-flight assignment."
        };
      }

      await this.deps.auditService.recordOutcome({
        requestId: input.requestId,
        paperId: input.paperId,
        editorId: input.editorId,
        submittedRefereeIdsCount: parsed.refereeIds.length,
        outcome: "INTERNAL_ERROR",
        reasonCode: "INTERNAL_ERROR"
      });

      return {
        outcome: "INTERNAL_ERROR",
        code: "INTERNAL_ERROR",
        message: "Referee assignment failed unexpectedly."
      };
    }
  }
}
