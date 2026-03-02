import test from "node:test";
import assert from "node:assert/strict";

import {
  assertRouteIsPublic,
  isPublicRoute
} from "../../src/presentation/middleware/auth.js";
import {
  DefaultRegistrationPriceService,
  RegistrationPriceRetrievalError
} from "../../src/business/services/registrationPriceService.js";
import {
  InMemoryRegistrationPriceRepository,
  PrismaRegistrationPriceRepository
} from "../../src/data/repositories/registrationPriceRepository.js";
import {
  PublishedRegistrationPriceListSchema,
  RegistrationPriceSchema
} from "../../src/business/validation/registrationPriceValidation.js";
import { createGetPublicRegistrationPricesHandler } from "../../src/presentation/controllers/publicRegistrationPricesController.js";

test("public route auth helper keeps registration-prices endpoint unauthenticated", () => {
  assert.equal(isPublicRoute("/public/registration-prices"), true);
  assert.equal(isPublicRoute("/api/editor/papers"), false);
  assert.doesNotThrow(() => assertRouteIsPublic("/public/registration-prices"));
  assert.throws(() => assertRouteIsPublic("/api/editor/papers"));
});

test("prisma repository returns null when no published list exists", async () => {
  const repository = new PrismaRegistrationPriceRepository({
    registrationPriceList: {
      findFirst: async () => null
    }
  });

  const result = await repository.getPublishedPriceList();
  assert.equal(result, null);
});

test("prisma repository maps decimal-like amount values to numbers", async () => {
  const repository = new PrismaRegistrationPriceRepository({
    registrationPriceList: {
      findFirst: async () => ({
        id: "5f4a6f31-1fca-4b75-ae17-a8ef9dd999a1",
        title: "Conference 2026 Registration",
        status: "PUBLISHED",
        publishedAt: new Date("2026-02-10T10:00:00.000Z"),
        effectiveFrom: null,
        effectiveTo: null,
        prices: [
          {
            id: "31aa3531-8e4d-45f6-b3c6-5616f2cbf642",
            attendanceType: "regular",
            amount: { toNumber: () => 399 },
            currency: "USD"
          },
          {
            id: "1d5c1a53-7fda-4d4b-8f56-501c34926e10",
            attendanceType: "student",
            amount: 199,
            currency: "USD"
          }
        ]
      })
    }
  });

  const result = await repository.getPublishedPriceList();
  assert.ok(result);
  assert.equal(result?.prices[0].amount, 399);
  assert.equal(result?.prices[1].amount, 199);
});

test("in-memory repository clones values and supports force-failure branch", async () => {
  const repository = new InMemoryRegistrationPriceRepository();
  repository.setPublishedPriceList({
    id: "5f4a6f31-1fca-4b75-ae17-a8ef9dd999a1",
    title: "Conference 2026 Registration",
    status: "PUBLISHED",
    publishedAt: new Date("2026-02-10T10:00:00.000Z"),
    effectiveFrom: null,
    effectiveTo: null,
    prices: [
      {
        id: "31aa3531-8e4d-45f6-b3c6-5616f2cbf642",
        attendanceType: "regular",
        amount: 399,
        currency: "USD"
      }
    ]
  });

  const first = await repository.getPublishedPriceList();
  assert.ok(first);
  first!.title = "Changed";

  const second = await repository.getPublishedPriceList();
  assert.equal(second?.title, "Conference 2026 Registration");

  repository.setForceFailure(true);
  await assert.rejects(() => repository.getPublishedPriceList());
});

test("registration price service covers available, unavailable, and failure branches", async () => {
  const repository = new InMemoryRegistrationPriceRepository();
  const service = new DefaultRegistrationPriceService(repository);

  const unavailable = await service.getPublishedRegistrationPrices();
  assert.equal(unavailable.state, "UNAVAILABLE");

  repository.setPublishedPriceList({
    id: "5f4a6f31-1fca-4b75-ae17-a8ef9dd999a1",
    title: "Conference 2026 Registration",
    status: "PUBLISHED",
    publishedAt: new Date("2026-02-10T10:00:00.000Z"),
    effectiveFrom: new Date("2026-02-10T00:00:00.000Z"),
    effectiveTo: new Date("2026-03-10T00:00:00.000Z"),
    prices: [
      {
        id: "31aa3531-8e4d-45f6-b3c6-5616f2cbf642",
        attendanceType: "regular",
        amount: 399,
        currency: "USD"
      }
    ]
  });

  const available = await service.getPublishedRegistrationPrices();
  assert.equal(available.state, "AVAILABLE");
  if (available.state === "AVAILABLE") {
    assert.equal(available.priceList.status, "PUBLISHED");
    assert.equal(available.priceList.effectiveFrom, "2026-02-10");
    assert.equal(available.priceList.effectiveTo, "2026-03-10");
  }

  repository.setPublishedPriceList({
    id: "f6e74ea8-c637-4adc-a58a-8c7fe4156b64",
    title: "Conference 2026 Registration (No Window)",
    status: "PUBLISHED",
    publishedAt: new Date("2026-02-11T10:00:00.000Z"),
    effectiveFrom: null,
    effectiveTo: null,
    prices: [
      {
        id: "c2cbe4d4-5a8d-4e3f-bd36-1322cce9686f",
        attendanceType: "virtual",
        amount: 99,
        currency: "USD"
      }
    ]
  });

  const availableNoWindow = await service.getPublishedRegistrationPrices();
  assert.equal(availableNoWindow.state, "AVAILABLE");
  if (availableNoWindow.state === "AVAILABLE") {
    assert.equal(availableNoWindow.priceList.effectiveFrom, null);
    assert.equal(availableNoWindow.priceList.effectiveTo, null);
  }

  repository.setForceFailure(true);
  await assert.rejects(
    () => service.getPublishedRegistrationPrices(),
    RegistrationPriceRetrievalError
  );
});

test("registration price service rethrows typed retrieval error branch", async () => {
  const service = new DefaultRegistrationPriceService({
    getPublishedPriceList: async () => {
      throw new RegistrationPriceRetrievalError();
    }
  });

  await assert.rejects(
    () => service.getPublishedRegistrationPrices(),
    RegistrationPriceRetrievalError
  );
});

test("registration price controller uses default logger branch when logger is absent", async () => {
  const handler = createGetPublicRegistrationPricesHandler({
    service: {
      getPublishedRegistrationPrices: async () => {
        throw new Error("dependency-down");
      }
    }
  });

  const reply = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    header(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    code(code: number) {
      this.statusCode = code;
      return this;
    }
  };

  const payload = (await handler({ id: "req_uc17" } as any, reply as any)) as {
    code: string;
  };

  assert.equal(reply.statusCode, 503);
  assert.equal(payload.code, "REGISTRATION_PRICES_RETRIEVAL_FAILED");
  assert.equal(reply.headers["x-request-id"], "req_uc17");
});

test("registration price controller logs fallback message for non-Error throws", async () => {
  const loggerEvents: Array<Record<string, unknown>> = [];
  const handler = createGetPublicRegistrationPricesHandler({
    service: {
      getPublishedRegistrationPrices: async () => {
        throw "not-an-error";
      }
    },
    logger: {
      error: (entry) => {
        loggerEvents.push(entry);
      }
    }
  });

  const reply = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    header(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    code(code: number) {
      this.statusCode = code;
      return this;
    }
  };

  await handler({ id: "req_uc17_unknown" } as any, reply as any);

  assert.equal(reply.statusCode, 503);
  assert.equal(loggerEvents.length, 1);
  assert.equal(
    loggerEvents[0].message,
    "unknown registration price retrieval error"
  );
});

test("validation schema enforces non-empty price entries", () => {
  const validPrice = RegistrationPriceSchema.safeParse({
    id: "31aa3531-8e4d-45f6-b3c6-5616f2cbf642",
    attendanceType: "regular",
    amount: 399,
    currency: "USD"
  });

  assert.equal(validPrice.success, true);

  const invalidList = PublishedRegistrationPriceListSchema.safeParse({
    id: "5f4a6f31-1fca-4b75-ae17-a8ef9dd999a1",
    title: "Conference 2026 Registration",
    status: "PUBLISHED",
    publishedAt: "2026-02-10T10:00:00.000Z",
    effectiveFrom: "2026-02-10",
    effectiveTo: "2026-03-10",
    prices: []
  });

  assert.equal(invalidList.success, false);
});
