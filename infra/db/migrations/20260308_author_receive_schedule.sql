-- UC-16 Author Receive Schedule

CREATE TABLE IF NOT EXISTS schedule_publications (
  id UUID PRIMARY KEY,
  schedule_id UUID NOT NULL UNIQUE REFERENCES conference_schedules(id) ON DELETE CASCADE,
  published_at TIMESTAMPTZ NOT NULL,
  published_by_editor_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PUBLISHED'))
);

CREATE TABLE IF NOT EXISTS author_notifications (
  id UUID PRIMARY KEY,
  author_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES conference_schedules(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('SENT', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_author_notifications_author
  ON author_notifications(author_id);

CREATE INDEX IF NOT EXISTS idx_author_notifications_schedule_time
  ON author_notifications(schedule_id, notified_at);
