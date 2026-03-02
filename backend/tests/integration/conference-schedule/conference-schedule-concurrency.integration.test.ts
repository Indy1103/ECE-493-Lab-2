import assert from "node:assert/strict";
import test from "node:test";

import { createConferenceScheduleTestApp } from "./testConferenceScheduleApp.js";

test("concurrency: simultaneous schedule generation stays consistent", async () => {
  const ctx = await createConferenceScheduleTestApp();

  const responses = await Promise.all(
    Array.from({ length: 8 }, () =>
      ctx.app.inject({
        method: "POST",
        url: `/api/admin/conference/${ctx.conferenceIds.withAccepted}/schedule`,
        headers: {
          "x-forwarded-proto": "https",
          cookie: `session=${ctx.adminSessionId}`
        }
      })
    )
  );

  assert.equal(responses.every((response) => response.statusCode === 200), true);
  assert.equal(responses.every((response) => response.json().entries.length === 2), true);

  await ctx.app.close();
});
