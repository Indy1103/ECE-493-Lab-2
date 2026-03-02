-- UC-05 manuscript submission scaffold migration

CREATE TABLE IF NOT EXISTS manuscript_artifacts (
  id UUID PRIMARY KEY,
  storage_object_key TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  sha256_digest TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manuscript_submissions (
  id UUID PRIMARY KEY,
  author_id UUID NOT NULL,
  conference_cycle_id UUID NOT NULL,
  status TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  metadata_policy_version TEXT NOT NULL,
  manuscript_artifact_id UUID NOT NULL REFERENCES manuscript_artifacts(id),
  downstream_available BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS manuscript_submissions_active_duplicate_idx
  ON manuscript_submissions (author_id, conference_cycle_id, normalized_title, status);

CREATE TABLE IF NOT EXISTS submission_metadata_packages (
  submission_id UUID PRIMARY KEY REFERENCES manuscript_submissions(id),
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  full_author_list JSONB NOT NULL,
  corresponding_author_email TEXT NOT NULL,
  primary_subject_area TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submission_attempt_audits (
  id UUID PRIMARY KEY,
  author_id UUID,
  submission_id UUID,
  request_id TEXT NOT NULL,
  outcome TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
