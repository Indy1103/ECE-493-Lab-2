-- UC-10 submit paper review scaffold migration

CREATE TABLE IF NOT EXISTS review_submissions (
  id UUID PRIMARY KEY,
  assignment_id UUID NOT NULL UNIQUE,
  paper_id UUID NOT NULL,
  referee_user_id UUID NOT NULL,
  content JSONB NOT NULL,
  status TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS review_submissions_paper_idx
  ON review_submissions (paper_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS review_submission_audits (
  id UUID PRIMARY KEY,
  actor_user_id UUID NOT NULL,
  assignment_id UUID,
  paper_id UUID,
  outcome TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS review_submission_audits_assignment_idx
  ON review_submission_audits (assignment_id, occurred_at DESC);
