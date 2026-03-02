-- UC-12 Record Final Decision

CREATE TABLE IF NOT EXISTS final_decisions (
  paper_id UUID PRIMARY KEY,
  decision TEXT NOT NULL CHECK (decision IN ('ACCEPT', 'REJECT')),
  decided_at TIMESTAMPTZ NOT NULL,
  decided_by_editor_id UUID NOT NULL,
  is_final BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS final_decision_audits (
  event_id UUID PRIMARY KEY,
  actor_user_id UUID NOT NULL,
  paper_id UUID NOT NULL,
  outcome TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_final_decisions_editor ON final_decisions(decided_by_editor_id);
CREATE INDEX IF NOT EXISTS idx_final_decision_audits_paper ON final_decision_audits(paper_id);
CREATE INDEX IF NOT EXISTS idx_final_decision_audits_occurred_at ON final_decision_audits(occurred_at);
