import test from "node:test";
import assert from "node:assert/strict";

import { Registry } from "prom-client";

import { createAnnouncementMetrics } from "../../src/shared/observability/announcementMetrics.js";

test("increments retrieval failure counter with reason label", async () => {
  const registry = new Registry();
  const metrics = createAnnouncementMetrics(registry);

  metrics.incrementRetrievalFailure("retrieval_failure");

  const metric = await registry.getSingleMetricAsString(
    "public_announcements_retrieval_failures_total"
  );

  assert.match(metric, /reason="retrieval_failure"/);
  assert.match(metric, / 1(\.0+)?$/m);
});
