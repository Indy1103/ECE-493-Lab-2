import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { buildServer } from "../../src/presentation/http/server.js";

test("recovers from transient retrieval failure to normal available state", async () => {
  let shouldFail = true;

  const app = buildServer({
    service: {
      getPublicAnnouncements: async () => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error("transient outage");
        }

        return {
          state: "AVAILABLE",
          announcements: [
            {
              id: "233a6b26-a22a-4c89-a5ec-2ef31a6b6f17",
              title: "Recovered",
              content: "Service restored",
              publishStart: "2026-02-01T00:00:00.000Z",
              publishEnd: null
            }
          ],
          message: "Announcements available."
        };
      }
    }
  });

  await app.ready();

  const failureResponse = await request(app.server)
    .get("/api/public/announcements")
    .set("x-forwarded-proto", "https");

  assert.equal(failureResponse.status, 503);
  assert.equal(failureResponse.body.code, "ANNOUNCEMENTS_UNAVAILABLE");

  const recoveryResponse = await request(app.server)
    .get("/api/public/announcements")
    .set("x-forwarded-proto", "https");

  assert.equal(recoveryResponse.status, 200);
  assert.equal(recoveryResponse.body.state, "AVAILABLE");
  assert.equal(recoveryResponse.body.announcements.length, 1);

  await app.close();
});
