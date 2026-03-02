CREATE TABLE IF NOT EXISTS login_attempts (
  attempt_id UUID PRIMARY KEY,
  username_submitted TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL,
  client_key TEXT NOT NULL,
  outcome TEXT NOT NULL,
  request_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS authenticated_sessions (
  session_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL,
  request_id TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_throttle_records (
  client_key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  failed_attempt_count INTEGER NOT NULL,
  blocked_until TIMESTAMPTZ NULL
);
