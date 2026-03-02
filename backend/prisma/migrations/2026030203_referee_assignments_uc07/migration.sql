-- UC-07 assign paper referees

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
    CREATE TYPE assignment_status AS ENUM (
      'ASSIGNED',
      'INVITED',
      'DECLINED',
      'COMPLETED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
    CREATE TYPE invitation_status AS ENUM (
      'PENDING',
      'SENT',
      'FAILED_RETRYABLE',
      'FAILED_FINAL'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_audit_outcome') THEN
    CREATE TYPE assignment_audit_outcome AS ENUM (
      'SUCCESS',
      'VALIDATION_FAILED',
      'AUTHN_FAILED',
      'AUTHZ_FAILED',
      'INVITATION_RETRYABLE_FAILURE',
      'CONFLICT',
      'INTERNAL_ERROR'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS referee_assignments (
  id UUID PRIMARY KEY,
  paper_id UUID NOT NULL,
  referee_id UUID NOT NULL,
  assigned_by_editor_id UUID NOT NULL,
  assignment_status assignment_status NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL,
  conference_cycle_id UUID NOT NULL,
  CONSTRAINT referee_assignments_unique_active UNIQUE (paper_id, referee_id)
);

CREATE INDEX IF NOT EXISTS referee_assignments_paper_idx
  ON referee_assignments (paper_id);

CREATE INDEX IF NOT EXISTS referee_assignments_referee_idx
  ON referee_assignments (referee_id);

CREATE INDEX IF NOT EXISTS referee_assignments_cycle_idx
  ON referee_assignments (conference_cycle_id);

CREATE TABLE IF NOT EXISTS review_invitations (
  id UUID PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES referee_assignments(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL,
  referee_id UUID NOT NULL,
  invitation_status invitation_status NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  failure_reason_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS review_invitations_assignment_idx
  ON review_invitations (assignment_id);

CREATE INDEX IF NOT EXISTS review_invitations_status_idx
  ON review_invitations (invitation_status, last_attempt_at);

CREATE TABLE IF NOT EXISTS assignment_attempt_audits (
  id UUID PRIMARY KEY,
  request_id TEXT NOT NULL,
  paper_id UUID NOT NULL,
  editor_id UUID,
  submitted_referee_ids_count INTEGER NOT NULL,
  outcome assignment_audit_outcome NOT NULL,
  reason_code TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assignment_attempt_audits_paper_time_idx
  ON assignment_attempt_audits (paper_id, occurred_at DESC);
