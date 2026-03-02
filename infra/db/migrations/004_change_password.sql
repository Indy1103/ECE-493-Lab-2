CREATE TABLE IF NOT EXISTS account_credentials (
  account_id UUID PRIMARY KEY,
  password_hash TEXT NOT NULL,
  password_algo TEXT NOT NULL DEFAULT 'ARGON2ID',
  credential_version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_history_entries (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_change_attempts (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  session_id TEXT NULL,
  source_ip TEXT NOT NULL,
  outcome TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  request_id TEXT NOT NULL
);
