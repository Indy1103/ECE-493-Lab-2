-- UC-13 Author Receive Decision

CREATE TABLE IF NOT EXISTS author_decision_notifications (
  id UUID PRIMARY KEY,
  paper_id UUID NOT NULL,
  author_id UUID NOT NULL,
  notification_status TEXT NOT NULL CHECK (notification_status IN ('DELIVERED', 'FAILED')),
  sent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS author_decision_access_audits (
  event_id UUID PRIMARY KEY,
  actor_user_id UUID NOT NULL,
  paper_id UUID NOT NULL,
  outcome TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_author_decision_notifications_paper ON author_decision_notifications(paper_id);
CREATE INDEX IF NOT EXISTS idx_author_decision_notifications_author ON author_decision_notifications(author_id);
CREATE INDEX IF NOT EXISTS idx_author_decision_access_audits_paper ON author_decision_access_audits(paper_id);
CREATE INDEX IF NOT EXISTS idx_author_decision_access_audits_occurred_at ON author_decision_access_audits(occurred_at);
