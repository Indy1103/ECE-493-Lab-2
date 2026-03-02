import type { SessionRepository, SessionRecord } from "../../data/security/session.repository.js";

interface SessionRevocationServiceDeps {
  sessionRepository: SessionRepository;
}

export class SessionRevocationService {
  constructor(private readonly deps: SessionRevocationServiceDeps) {}

  async revokeAll(accountId: string, now: Date): Promise<void> {
    await this.deps.sessionRepository.revokeAllByAccount(accountId, now);
  }

  snapshot(): SessionRecord[] {
    return this.deps.sessionRepository.snapshot();
  }

  restore(snapshot: SessionRecord[]): void {
    this.deps.sessionRepository.restore(snapshot);
  }
}
