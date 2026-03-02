-- UC-06 save paper submission draft

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'draft_save_outcome') THEN
    CREATE TYPE draft_save_outcome AS ENUM (
      'SUCCESS',
      'VALIDATION_FAILED',
      'AUTHZ_FAILED',
      'OPERATIONAL_FAILED'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS submission_drafts (
  id UUID PRIMARY KEY,
  author_id UUID NOT NULL,
  in_progress_submission_id UUID NOT NULL,
  title TEXT NOT NULL,
  draft_payload JSONB NOT NULL,
  payload_version INTEGER NOT NULL,
  policy_version TEXT NOT NULL,
  last_saved_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT submission_drafts_unique_current UNIQUE (author_id, in_progress_submission_id)
);

CREATE INDEX IF NOT EXISTS submission_drafts_author_submission_idx
  ON submission_drafts (author_id, in_progress_submission_id);

CREATE TABLE IF NOT EXISTS draft_snapshots (
  id UUID PRIMARY KEY,
  submission_draft_id UUID NOT NULL REFERENCES submission_drafts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot_payload JSONB NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT draft_snapshots_submission_version_unique UNIQUE (submission_draft_id, version)
);

CREATE INDEX IF NOT EXISTS draft_snapshots_submission_saved_idx
  ON draft_snapshots (submission_draft_id, saved_at DESC);

CREATE TABLE IF NOT EXISTS draft_save_attempts (
  id UUID PRIMARY KEY,
  author_id UUID,
  in_progress_submission_id UUID,
  outcome draft_save_outcome NOT NULL,
  reason_code TEXT NOT NULL,
  request_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS draft_save_attempts_submission_time_idx
  ON draft_save_attempts (in_progress_submission_id, occurred_at DESC);
