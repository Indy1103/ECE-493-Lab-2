import test from "node:test";
import assert from "node:assert/strict";

import { evaluateAuthDataProtection } from "../../../src/data/auth/data-protection.policy.js";

test("at-rest encryption coverage requires primary records and backups to be encrypted", () => {
  const secure = evaluateAuthDataProtection({
    primaryRecordsEncrypted: true,
    backupsEncrypted: true
  });

  const insecure = evaluateAuthDataProtection({
    primaryRecordsEncrypted: true,
    backupsEncrypted: false
  });

  assert.equal(secure.protected, true);
  assert.equal(insecure.protected, false);
  assert.equal(insecure.findings.includes("backups_unencrypted"), true);
});
