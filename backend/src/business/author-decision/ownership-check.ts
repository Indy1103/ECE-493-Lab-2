import type { AuthorDecisionAccessRecord } from "./ports.js";

export class AuthorDecisionOwnershipCheck {
  isOwner(record: AuthorDecisionAccessRecord | null, authorId: string): boolean {
    if (!record) {
      return false;
    }

    return record.authorId === authorId;
  }
}
