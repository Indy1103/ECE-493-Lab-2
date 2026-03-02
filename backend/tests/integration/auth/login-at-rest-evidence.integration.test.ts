import test from "node:test";
import assert from "node:assert/strict";

import { evaluateAuthDataProtection } from "../../../src/data/auth/data-protection.policy.js";

test("release evidence: at-rest protection sampling passes", () => {
  const evidence = evaluateAuthDataProtection({
    primaryRecordsEncrypted: true,
    backupsEncrypted: true
  });

  assert.equal(evidence.protected, true);
  assert.deepEqual(evidence.findings, []);
});
