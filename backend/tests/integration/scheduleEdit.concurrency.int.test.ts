import assert from "node:assert/strict";
import test from "node:test";

import { createScheduleEditTestApp } from "./schedule-edit/testScheduleEditApp.js";

test("concurrency: simultaneous updates produce a single success and conflicts/finalized rejections", async () => {
  const ctx = await createScheduleEditTestApp();

  const payload = {
    scheduleId: ctx.scheduleId,
    entries: [
      {
        paperId: ctx.validEntries[0]!.paperId,
        sessionId: "21000000-0000-4000-8000-000000000003",
        roomId: "31000000-0000-4000-8000-000000000003",
        timeSlotId: "41000000-0000-4000-8000-000000000003"
      },
      ctx.validEntries[1]
    ]
  };

  const responses = await Promise.all(
    Array.from({ length: 10 }, () =>
      ctx.app.inject({
        method: "PUT",
        url: `/api/editor/conferences/${ctx.conferenceId}/schedule`,
        headers: {
          "x-forwarded-proto": "https",
          cookie: `session=${ctx.editorSessionId}`
        },
        payload
      })
    )
  );

  const statusCodes = responses.map((response) => response.statusCode);
  assert.equal(statusCodes.filter((status) => status === 200).length, 1);
  assert.equal(statusCodes.filter((status) => status === 409).length, 9);

  await ctx.app.close();
});
