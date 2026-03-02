import type { SubmissionMetadata } from "../domain/manuscript-submission.js";
import type {
  ManuscriptSubmissionRecord,
  ManuscriptSubmissionRepository
} from "../../data/manuscripts/manuscript-submission.repository.js";

interface SubmissionDeduplicationServiceDeps {
  submissionRepository: ManuscriptSubmissionRepository;
}

export class SubmissionDeduplicationService {
  constructor(private readonly deps: SubmissionDeduplicationServiceDeps) {}

  async createSingleWinner(input: {
    authorId: string;
    conferenceCycleId: string;
    normalizedTitle: string;
    metadataPolicyVersion: string;
    manuscriptArtifactId: string;
    metadata: SubmissionMetadata;
    now: Date;
  }): Promise<{ duplicate: boolean; submission?: ManuscriptSubmissionRecord }> {
    return this.deps.submissionRepository.createAcceptedSubmission(input);
  }
}
