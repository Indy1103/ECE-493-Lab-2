CREATE TABLE IF NOT EXISTS conference_announcements (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN NOT NULL,
  publish_start TIMESTAMPTZ NOT NULL,
  publish_end TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conference_announcements_publish_window_ck
    CHECK (publish_end IS NULL OR publish_end >= publish_start)
);

CREATE INDEX IF NOT EXISTS conference_announcements_public_window_idx
  ON conference_announcements (is_public, publish_start, publish_end);
