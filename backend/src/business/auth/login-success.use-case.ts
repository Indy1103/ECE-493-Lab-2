import type { AuthRepository } from "../../data/auth/auth.repository.js";
import type { PasswordVerifier } from "../../security/auth/password-verifier.js";
import { RolePolicyService } from "./role-policy.js";

interface LoginSuccessUseCaseDeps {
  repository: AuthRepository;
  passwordVerifier: PasswordVerifier;
  rolePolicy: RolePolicyService;
  nowProvider?: () => Date;
}

export type LoginSuccessOutcome =
  | { outcome: "AUTHENTICATED"; roleHomePath: string }
  | { outcome: "INVALID_CREDENTIALS" }
  | { outcome: "ROLE_MAPPING_UNAVAILABLE" }
  | { outcome: "PROCESSING_FAILURE" };

export class LoginSuccessUseCase {
  private readonly nowProvider: () => Date;

  constructor(private readonly deps: LoginSuccessUseCaseDeps) {
    this.nowProvider = deps.nowProvider ?? (() => new Date());
  }

  async execute(input: {
    username: string;
    password: string;
    requestId: string;
  }): Promise<LoginSuccessOutcome> {
    try {
      const username = input.username.trim();
      const password = input.password;

      if (username.length === 0 || password.length === 0) {
        return { outcome: "INVALID_CREDENTIALS" };
      }

      const account = await this.deps.repository.findAccountByUsername(username);
      if (account === null) {
        return { outcome: "INVALID_CREDENTIALS" };
      }

      const verified = await this.deps.passwordVerifier.verify(
        account.passwordHash,
        password
      );

      if (!verified) {
        return { outcome: "INVALID_CREDENTIALS" };
      }

      const roleHomePath = this.deps.rolePolicy.resolveHomePath(account.role);
      if (roleHomePath === null) {
        return { outcome: "ROLE_MAPPING_UNAVAILABLE" };
      }

      await this.deps.repository.createSession({
        userId: account.id,
        role: account.role,
        requestId: input.requestId,
        now: this.nowProvider()
      });

      return { outcome: "AUTHENTICATED", roleHomePath };
    } catch {
      return { outcome: "PROCESSING_FAILURE" };
    }
  }
}
