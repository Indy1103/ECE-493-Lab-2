import Fastify, { type FastifyInstance } from "fastify";

import {
  DefaultRegistrationPriceService
} from "../../../src/business/services/registrationPriceService.js";
import {
  InMemoryRegistrationPriceRepository,
  type RegistrationPriceListRow
} from "../../../src/data/repositories/registrationPriceRepository.js";
import { createPublicRoutes } from "../../../src/presentation/routes/publicRoutes.js";

interface CreateRegistrationPricesTestAppOptions {
  publishedPriceList?: RegistrationPriceListRow;
  forceRepositoryFailure?: boolean;
}

export interface RegistrationPricesTestAppContext {
  app: FastifyInstance;
  repository: InMemoryRegistrationPriceRepository;
  loggerEvents: Array<Record<string, unknown>>;
}

export function createPublishedPriceListFixture(): RegistrationPriceListRow {
  return {
    id: "5f4a6f31-1fca-4b75-ae17-a8ef9dd999a1",
    title: "Conference 2026 Registration",
    status: "PUBLISHED",
    publishedAt: new Date("2026-02-10T10:00:00.000Z"),
    effectiveFrom: new Date("2026-02-10T00:00:00.000Z"),
    effectiveTo: new Date("2026-03-10T00:00:00.000Z"),
    prices: [
      {
        id: "1d5c1a53-7fda-4d4b-8f56-501c34926e10",
        attendanceType: "student",
        amount: 199,
        currency: "USD"
      },
      {
        id: "31aa3531-8e4d-45f6-b3c6-5616f2cbf642",
        attendanceType: "regular",
        amount: 399,
        currency: "USD"
      }
    ]
  };
}

export async function createRegistrationPricesTestApp(
  options: CreateRegistrationPricesTestAppOptions = {}
): Promise<RegistrationPricesTestAppContext> {
  const app = Fastify({
    logger: false,
    genReqId: () => "req_registration_prices_test"
  });

  const repository = new InMemoryRegistrationPriceRepository();
  repository.setPublishedPriceList(options.publishedPriceList ?? null);
  repository.setForceFailure(options.forceRepositoryFailure ?? false);

  const service = new DefaultRegistrationPriceService(repository);

  const loggerEvents: Array<Record<string, unknown>> = [];

  app.register(
    createPublicRoutes({
      registrationPriceService: service,
      logger: {
        error: (entry) => {
          loggerEvents.push(structuredClone(entry));
        }
      }
    })
  );

  await app.ready();

  return { app, repository, loggerEvents };
}
