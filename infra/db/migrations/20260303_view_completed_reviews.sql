-- UC-11 fixture-ready migration scaffold for review visibility.
-- Existing UC-10 review submission records can be reused for completed review count checks.

create table if not exists review_visibility_audits (
  id uuid primary key,
  actor_user_id uuid not null,
  paper_id uuid not null,
  outcome text not null,
  reason_code text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists review_visibility_audits_paper_idx
  on review_visibility_audits (paper_id, occurred_at desc);
