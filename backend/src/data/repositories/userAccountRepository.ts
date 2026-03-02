export interface UserAccount {
  id: string;
  fullName: string;
  emailOriginal: string;
  emailNormalized: string;
  passwordHash: string;
  role: "REGISTERED_USER";
  status: "ACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserAccountInput {
  fullName: string;
  emailOriginal: string;
  emailNormalized: string;
  passwordHash: string;
  role: "REGISTERED_USER";
  status: "ACTIVE";
}

export interface UserAccountRepository {
  findByNormalizedEmail(emailNormalized: string): Promise<UserAccount | null>;
  createAccount(input: CreateUserAccountInput): Promise<UserAccount>;
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("Email is already registered.");
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class InMemoryUserAccountRepository implements UserAccountRepository {
  private readonly accountsByNormalizedEmail = new Map<string, UserAccount>();
  private sequence = 0;

  async findByNormalizedEmail(emailNormalized: string): Promise<UserAccount | null> {
    return this.accountsByNormalizedEmail.get(emailNormalized) ?? null;
  }

  async createAccount(input: CreateUserAccountInput): Promise<UserAccount> {
    if (this.accountsByNormalizedEmail.has(input.emailNormalized)) {
      throw new EmailAlreadyRegisteredError();
    }

    this.sequence += 1;
    const now = new Date();

    const account: UserAccount = {
      id: `00000000-0000-4000-8000-${String(this.sequence).padStart(12, "0")}`,
      fullName: input.fullName,
      emailOriginal: input.emailOriginal,
      emailNormalized: input.emailNormalized,
      passwordHash: input.passwordHash,
      role: input.role,
      status: input.status,
      createdAt: now,
      updatedAt: now
    };

    this.accountsByNormalizedEmail.set(input.emailNormalized, account);
    return account;
  }
}
