import { getDefaultRegistrationRole } from "./defaultRolePolicy.js";
import { normalizeEmail } from "./emailNormalization.js";
import { mapValidationIssues } from "./validationErrorMapper.js";
import type { RegisterUserResult } from "../../shared/contracts/registrationOutcome.js";
import type { RegistrationTelemetry } from "../../shared/observability/registrationTelemetry.js";
import { Argon2PasswordHasher, type PasswordHasher } from "../../security/passwordHasher.js";
import { RegistrationRequestSchema } from "../../presentation/registration/registrationSchemas.js";
import {
  EmailAlreadyRegisteredError,
  type UserAccountRepository
} from "../../data/repositories/userAccountRepository.js";
import { RegistrationThrottleService } from "./registrationThrottleService.js";

export interface RegisterUserInput {
  fullName: string;
  email: string;
  password: string;
  requestId: string;
  clientKey: string;
}

interface RegisterUserDependencies {
  userRepository: UserAccountRepository;
  throttleService: RegistrationThrottleService;
  telemetry: RegistrationTelemetry;
  passwordHasher?: PasswordHasher;
  nowProvider?: () => Date;
  forceProcessingFailure?: boolean;
}

export class RegisterUserUseCase {
  private readonly passwordHasher: PasswordHasher;
  private readonly nowProvider: () => Date;
  private readonly forceProcessingFailure: boolean;

  constructor(private readonly deps: RegisterUserDependencies) {
    this.passwordHasher = deps.passwordHasher ?? new Argon2PasswordHasher();
    this.nowProvider = deps.nowProvider ?? (() => new Date());
    this.forceProcessingFailure = deps.forceProcessingFailure ?? false;
  }

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    const now = this.nowProvider();

    const throttle = await this.deps.throttleService.isThrottled(input.clientKey, now);
    if (throttle.throttled) {
      this.deps.telemetry.record({
        requestId: input.requestId,
        clientKey: input.clientKey,
        outcome: "THROTTLED"
      });
      return {
        outcome: "THROTTLED",
        retryAfterSeconds: throttle.retryAfterSeconds
      };
    }

    const parsedInput = RegistrationRequestSchema.safeParse({
      fullName: input.fullName,
      email: input.email,
      password: input.password
    });

    if (!parsedInput.success) {
      await this.deps.throttleService.recordFailure(input.clientKey, now);
      const errors = mapValidationIssues(parsedInput.error.issues);
      this.deps.telemetry.record({
        requestId: input.requestId,
        clientKey: input.clientKey,
        outcome: "VALIDATION_FAILED",
        details: { errors }
      });
      return { outcome: "VALIDATION_FAILED", errors };
    }

    const normalizedEmail = normalizeEmail(parsedInput.data.email);
    const existingAccount = await this.deps.userRepository.findByNormalizedEmail(normalizedEmail);

    if (existingAccount !== null) {
      await this.deps.throttleService.recordFailure(input.clientKey, now);
      this.deps.telemetry.record({
        requestId: input.requestId,
        clientKey: input.clientKey,
        outcome: "DUPLICATE_EMAIL"
      });
      return { outcome: "DUPLICATE_EMAIL" };
    }

    if (this.forceProcessingFailure) {
      this.deps.telemetry.record({
        requestId: input.requestId,
        clientKey: input.clientKey,
        outcome: "PROCESSING_FAILURE"
      });
      return { outcome: "PROCESSING_FAILURE" };
    }

    try {
      const passwordHash = await this.passwordHasher.hash(parsedInput.data.password);
      await this.deps.userRepository.createAccount({
        fullName: parsedInput.data.fullName,
        emailOriginal: parsedInput.data.email,
        emailNormalized: normalizedEmail,
        passwordHash,
        role: getDefaultRegistrationRole(),
        status: "ACTIVE"
      });

      await this.deps.throttleService.reset(input.clientKey);
      this.deps.telemetry.record({
        requestId: input.requestId,
        clientKey: input.clientKey,
        outcome: "REGISTERED"
      });
      return { outcome: "REGISTERED" };
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) {
        await this.deps.throttleService.recordFailure(input.clientKey, now);
        this.deps.telemetry.record({
          requestId: input.requestId,
          clientKey: input.clientKey,
          outcome: "DUPLICATE_EMAIL"
        });
        return { outcome: "DUPLICATE_EMAIL" };
      }

      this.deps.telemetry.record({
        requestId: input.requestId,
        clientKey: input.clientKey,
        outcome: "PROCESSING_FAILURE"
      });
      return { outcome: "PROCESSING_FAILURE" };
    }
  }
}
