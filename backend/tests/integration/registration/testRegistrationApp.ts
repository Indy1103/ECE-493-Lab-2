import Fastify, { type FastifyInstance } from "fastify";

import { createPublicRegistrationRoute } from "../../../src/presentation/routes/publicRegistrationRoute.js";
import {
  InMemoryRegistrationThrottleRepository
} from "../../../src/data/repositories/registrationThrottleRepository.js";
import {
  InMemoryUserAccountRepository
} from "../../../src/data/repositories/userAccountRepository.js";
import { RegistrationThrottleService } from "../../../src/business/registration/registrationThrottleService.js";
import { createRegistrationMetrics } from "../../../src/shared/observability/registrationMetrics.js";
import { createRegistrationTelemetry } from "../../../src/shared/observability/registrationTelemetry.js";
import { RegisterUserUseCase } from "../../../src/business/registration/registerUser.js";

interface TestAppOptions {
  forceProcessingFailure?: boolean;
}

export interface TestAppContext {
  app: FastifyInstance;
  userRepository: InMemoryUserAccountRepository;
  throttleRepository: InMemoryRegistrationThrottleRepository;
  telemetryEvents: Array<Record<string, unknown>>;
}

export async function createRegistrationTestApp(
  options: TestAppOptions = {}
): Promise<TestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_test_request_id" });

  const userRepository = new InMemoryUserAccountRepository();
  const throttleRepository = new InMemoryRegistrationThrottleRepository();
  const throttleService = new RegistrationThrottleService(throttleRepository);

  const telemetryEvents: Array<Record<string, unknown>> = [];
  const metrics = createRegistrationMetrics();
  const telemetry = createRegistrationTelemetry({
    metrics,
    emit: (event) => {
      telemetryEvents.push(event);
    }
  });

  const registerUser = new RegisterUserUseCase({
    userRepository,
    throttleService,
    telemetry,
    forceProcessingFailure: options.forceProcessingFailure ?? false
  });

  app.register(createPublicRegistrationRoute({ registerUser }));

  await app.ready();

  return {
    app,
    userRepository,
    throttleRepository,
    telemetryEvents
  };
}
