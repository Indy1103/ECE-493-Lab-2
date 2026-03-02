import assert from "node:assert/strict";
import test from "node:test";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("polish: invitation response records are marked protected at rest", async () => {
  const ctx = await createReviewInvitationTestApp();

  assert.equal(ctx.repository.isEncryptedAtRest(), true);

  await ctx.app.close();
});
