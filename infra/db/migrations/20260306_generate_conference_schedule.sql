-- UC-14 Generate Conference Schedule

CREATE TABLE IF NOT EXISTS conference_schedules (
  conference_id UUID NOT NULL,
  version INT NOT NULL,
  generated_by_admin_id UUID NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  entries JSONB NOT NULL,
  PRIMARY KEY (conference_id, version)
);

CREATE TABLE IF NOT EXISTS conference_schedule_audits (
  event_id UUID PRIMARY KEY,
  actor_user_id UUID NOT NULL,
  conference_id UUID NOT NULL,
  outcome TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conference_schedule_audits_conference
  ON conference_schedule_audits(conference_id);
