-- UC-15 Edit Conference Schedule

ALTER TABLE IF EXISTS conference_schedules
  ADD COLUMN IF NOT EXISTS id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by_editor_id UUID;

UPDATE conference_schedules
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE IF EXISTS conference_schedules
  ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'conference_schedules_pk_id'
  ) THEN
    ALTER TABLE conference_schedules
      ADD CONSTRAINT conference_schedules_pk_id PRIMARY KEY (id);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conference_schedules_conference_id
  ON conference_schedules(conference_id);

CREATE TABLE IF NOT EXISTS schedule_entries (
  id UUID PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES conference_schedules(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL,
  session_id UUID NOT NULL,
  room_id UUID NOT NULL,
  time_slot_id UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedule_entries_schedule
  ON schedule_entries(schedule_id);

CREATE TABLE IF NOT EXISTS schedule_modification_requests (
  id UUID PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES conference_schedules(id) ON DELETE CASCADE,
  requested_by_editor_id UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPLIED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_schedule_modification_requests_schedule_time
  ON schedule_modification_requests(schedule_id, requested_at);
