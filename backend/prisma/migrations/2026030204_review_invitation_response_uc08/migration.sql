-- UC-08: Review invitation response support

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvitationResponseStatus') THEN
    CREATE TYPE "InvitationResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvitationResponseAttemptOutcome') THEN
    CREATE TYPE "InvitationResponseAttemptOutcome" AS ENUM (
      'SUCCESS_ACCEPTED',
      'SUCCESS_REJECTED',
      'REJECTED_ALREADY_RESOLVED',
      'AUTHZ_FAILED',
      'VALIDATION_FAILED',
      'RECORDING_FAILED',
      'INVITATION_NOT_FOUND',
      'INTERNAL_ERROR'
    );
  END IF;
END
$$;

ALTER TABLE "referee_assignments"
  ADD COLUMN IF NOT EXISTS "source_invitation_id" UUID;

ALTER TABLE "review_invitations"
  ADD COLUMN IF NOT EXISTS "response_status" "InvitationResponseStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "response_recorded_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "invitation_response_attempts" (
  "id" UUID PRIMARY KEY,
  "invitation_id" UUID NOT NULL,
  "referee_id" UUID,
  "decision_requested" TEXT NOT NULL,
  "outcome" "InvitationResponseAttemptOutcome" NOT NULL,
  "reason_code" TEXT NOT NULL,
  "request_id" TEXT NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invitation_response_attempts_invitation_fk"
    FOREIGN KEY ("invitation_id") REFERENCES "review_invitations"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "invitation_response_attempts_invitation_time_idx"
  ON "invitation_response_attempts" ("invitation_id", "occurred_at");

CREATE UNIQUE INDEX IF NOT EXISTS "referee_assignments_source_invitation_id_key"
  ON "referee_assignments" ("source_invitation_id");
