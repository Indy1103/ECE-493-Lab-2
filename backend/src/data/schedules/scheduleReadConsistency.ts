export class ScheduleReadConsistency {
  private readonly locks = new Map<string, Promise<void>>();

  async withConsistentRead<T>(scopeKey: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(scopeKey) ?? Promise.resolve();

    let release: () => void = () => {};
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(scopeKey, previous.then(() => current));

    await previous;

    try {
      return await operation();
    } finally {
      release();
      this.locks.delete(scopeKey);
    }
  }
}
