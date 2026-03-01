# Data Model: Public Conference Announcement Access

## Entity: ConferenceAnnouncement

Purpose: Canonical persisted announcement record evaluated for public display.

Fields:
- `id` (UUID, primary key, immutable)
- `title` (string, required, non-empty)
- `content` (text, required, non-empty)
- `is_public` (boolean, required)
- `publish_start` (timestamp with timezone, required)
- `publish_end` (timestamp with timezone, nullable)
- `created_at` (timestamp with timezone, required)
- `updated_at` (timestamp with timezone, required)

Validation rules:
- `publish_end` must be null or `publish_end >= publish_start`.
- Announcement is eligible for public retrieval only when:
  - `is_public = true`
  - `publish_start <= current_time`
  - `publish_end` is null or `current_time <= publish_end`
- Non-public or out-of-window announcements must never be returned by the public endpoint.

State derivation (computed, not persisted as a required column):
- `SCHEDULED`: `is_public = true` and `current_time < publish_start`
- `LIVE`: eligible for public retrieval under the rules above
- `EXPIRED`: `is_public = true` and `publish_end` is not null and `current_time > publish_end`
- `HIDDEN`: `is_public = false`

## Entity: PublicUser

Purpose: Anonymous actor consuming public announcement information.

Fields:
- No persisted identity is required for this feature.
- Request-level metadata may include transient request ID for traceability.

Validation rules:
- Must not require account creation, credentials, or authentication token.

## Entity: AnnouncementAvailabilityState

Purpose: Deterministic outcome exposed to presentation logic for UC-01 behavior.

Values:
- `AVAILABLE`: one or more eligible announcements returned.
- `EMPTY`: zero eligible announcements returned.
- `RETRIEVAL_FAILURE`: announcements could not be retrieved.

Rules:
- `AVAILABLE` and `EMPTY` are successful read outcomes.
- `RETRIEVAL_FAILURE` maps to explicit user-visible error messaging and operational observability events.

## Relationships

- `PublicUser` reads zero or more `ConferenceAnnouncement` records through filtered public access rules.
- `AnnouncementAvailabilityState` is derived from the retrieval result set and backend execution outcome.
