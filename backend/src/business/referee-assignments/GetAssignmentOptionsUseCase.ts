import type { RefereeAssignmentRepository } from "../../data/referee-assignments/RefereeAssignmentRepository.js";

export type GetAssignmentOptionsOutcome =
  | {
      outcome: "SUCCESS";
      paperId: string;
      currentAssignedCount: number;
      remainingSlots: number;
      maxRefereesPerPaper: number;
      candidateReferees: Array<{
        refereeId: string;
        displayName: string;
        currentWorkload: number;
        maxWorkload: number;
        eligible: boolean;
      }>;
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
      outcome: "INTERNAL_ERROR";
      code: "INTERNAL_ERROR";
      message: string;
    };

interface GetAssignmentOptionsUseCaseDeps {
  repository: RefereeAssignmentRepository;
}

export class GetAssignmentOptionsUseCase {
  constructor(private readonly deps: GetAssignmentOptionsUseCaseDeps) {}

  async execute(input: { paperId: string }): Promise<GetAssignmentOptionsOutcome> {
    try {
      const paper = await this.deps.repository.getPaperCandidate(input.paperId);
      if (!paper) {
        return {
          outcome: "PAPER_NOT_FOUND",
          code: "PAPER_NOT_FOUND",
          message: "Paper was not found."
        };
      }

      if (paper.workflowState !== "AWAITING_ASSIGNMENT") {
        return {
          outcome: "PAPER_NOT_ASSIGNABLE",
          code: "PAPER_NOT_ASSIGNABLE",
          message: "Paper is not eligible for referee assignment."
        };
      }

      const assignments = await this.deps.repository.getAssignmentsByPaper(input.paperId);
      const profiles = await this.deps.repository.listRefereeProfiles(paper.conferenceCycleId);
      const currentAssignedCount = assignments.length;

      return {
        outcome: "SUCCESS",
        paperId: paper.paperId,
        currentAssignedCount,
        remainingSlots: Math.max(paper.maxRefereesPerPaper - currentAssignedCount, 0),
        maxRefereesPerPaper: paper.maxRefereesPerPaper,
        candidateReferees: profiles.map((profile) => ({
          refereeId: profile.refereeId,
          displayName: profile.displayName,
          currentWorkload: profile.currentActiveAssignments,
          maxWorkload: profile.maxActiveAssignments,
          eligible: profile.eligible
        }))
      };
    } catch {
      return {
        outcome: "INTERNAL_ERROR",
        code: "INTERNAL_ERROR",
        message: "Assignment options are currently unavailable."
      };
    }
  }
}
