import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { buildServer } from "../../src/presentation/http/server.js";

test("retrieval failure emits log and metric and returns 503 payload with requestId", async () => {
  const metricCalls: string[] = [];
  const logCalls: Array<Record<string, unknown>> = [];

  const app = buildServer({
    service: {
      getPublicAnnouncements: async () => {
        throw new Error("database unavailable");
      }
    },
    logger: {
      error: (entry: Record<string, unknown>) => {
        logCalls.push(entry);
      }
    },
    metrics: {
      incrementRetrievalFailure: (reason: string) => {
        metricCalls.push(reason);
      }
    }
  });

  await app.ready();

  const response = await request(app.server)
    .get("/api/public/announcements")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 503);
  assert.equal(response.body.code, "ANNOUNCEMENTS_UNAVAILABLE");
  assert.equal(
    response.body.message,
    "Conference announcements are temporarily unavailable. Please try again."
  );
  assert.ok(response.body.requestId);

  assert.equal(metricCalls.length, 1);
  assert.equal(metricCalls[0], "retrieval_failure");

  assert.equal(logCalls.length, 1);
  assert.equal(logCalls[0].failureCategory, "RETRIEVAL_FAILURE");
  assert.equal(logCalls[0].requestId, response.body.requestId);

  await app.close();
});

test("non-Error throw values are logged with generic error message", async () => {
  const logCalls: Array<Record<string, unknown>> = [];

  const app = buildServer({
    service: {
      getPublicAnnouncements: async () => {
        throw "string failure";
      }
    },
    logger: {
      error: (entry: Record<string, unknown>) => {
        logCalls.push(entry);
      }
    }
  });

  await app.ready();

  const response = await request(app.server)
    .get("/api/public/announcements")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 503);
  assert.equal(logCalls.length, 1);
  assert.equal(logCalls[0].errorMessage, "unknown error");

  await app.close();
});
