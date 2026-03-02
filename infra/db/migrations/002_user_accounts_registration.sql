CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email_original TEXT NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registration_throttle_records (
  client_key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  failed_attempt_count INTEGER NOT NULL,
  blocked_until TIMESTAMPTZ NULL
);
