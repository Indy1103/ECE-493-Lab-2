export interface SubmissionDraftOwnershipRepository {
  isSubmissionOwnedByAuthor(authorId: string, submissionId: string): Promise<boolean>;
}

export class SubmissionDraftAuthorizationError extends Error {
  constructor(message = "You are not authorized to access this submission draft.") {
    super(message);
    this.name = "SubmissionDraftAuthorizationError";
  }
}

export class SubmissionDraftOwnershipGuard {
  constructor(private readonly repository: SubmissionDraftOwnershipRepository) {}

  async assertOwnership(authorId: string, submissionId: string): Promise<void> {
    const isOwner = await this.repository.isSubmissionOwnedByAuthor(authorId, submissionId);

    if (!isOwner) {
      throw new SubmissionDraftAuthorizationError();
    }
  }
}
