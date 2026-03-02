import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { buildServer } from "../../src/presentation/http/server.js";

test("fault-injection scenario confirms outage then recovery timing behavior", async () => {
  let attemptCount = 0;

  const app = buildServer({
    service: {
      getPublicAnnouncements: async () => {
        attemptCount += 1;

        if (attemptCount <= 2) {
          throw new Error("injected fault");
        }

        return {
          state: "EMPTY",
          announcements: [],
          message: "No conference announcements are currently available."
        };
      }
    }
  });

  await app.ready();

  for (let index = 0; index < 2; index += 1) {
    const failureResponse = await request(app.server)
      .get("/api/public/announcements")
      .set("x-forwarded-proto", "https");

    assert.equal(failureResponse.status, 503);
  }

  const recoveryResponse = await request(app.server)
    .get("/api/public/announcements")
    .set("x-forwarded-proto", "https");

  assert.equal(recoveryResponse.status, 200);
  assert.equal(recoveryResponse.body.state, "EMPTY");
  assert.equal(recoveryResponse.body.message, "No conference announcements are currently available.");

  await app.close();
});
