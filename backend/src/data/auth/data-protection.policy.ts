import type { AuthDataProtectionSnapshot } from "./auth.repository.js";

export function evaluateAuthDataProtection(snapshot: AuthDataProtectionSnapshot): {
  protected: boolean;
  findings: string[];
} {
  const findings: string[] = [];

  if (!snapshot.primaryRecordsEncrypted) {
    findings.push("primary_records_unencrypted");
  }

  if (!snapshot.backupsEncrypted) {
    findings.push("backups_unencrypted");
  }

  return {
    protected: findings.length === 0,
    findings
  };
}
