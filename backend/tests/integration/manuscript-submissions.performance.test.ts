import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createManuscriptSubmissionTestApp } from "./manuscript-submissions.testApp.js";

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index] ?? 0;
}

function buildPayload(index: number) {
  return {
    metadata: {
      title: `Performance Submission ${index}`,
      abstract: "Latency benchmark payload.",
      keywords: ["performance"],
      fullAuthorList: [{ name: "Perf Author" }],
      correspondingAuthorEmail: "perf.author@example.com",
      primarySubjectArea: "Software Engineering"
    },
    manuscriptFile: {
      filename: `perf-${index}.pdf`,
      mediaType: "application/pdf",
      byteSize: 80_000,
      sha256Digest: `${index}`.padStart(64, "d"),
      contentBase64: "JVBERi0xLjQ="
    }
  };
}

test("performance: submission endpoint p95 latency stays at or below 700ms", async () => {
  const ctx = await createManuscriptSubmissionTestApp();
  const samples: number[] = [];

  for (let index = 0; index < 30; index += 1) {
    const started = performance.now();
    const response = await request(ctx.app.server)
      .post("/api/v1/manuscript-submissions")
      .set("x-forwarded-proto", "https")
      .set("cookie", `cms_session=${ctx.sessionId}`)
      .send(buildPayload(index));
    const elapsed = performance.now() - started;

    assert.equal(response.status, 201);
    samples.push(elapsed);
  }

  const p95 = percentile(samples, 95);
  assert.equal(p95 <= 700, true, `Expected p95 <= 700ms, received ${p95.toFixed(2)}ms`);

  await ctx.app.close();
});
