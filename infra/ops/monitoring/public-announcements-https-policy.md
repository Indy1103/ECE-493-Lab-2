# HTTPS Policy: Public Announcements Endpoint

- Endpoint: `GET /api/public/announcements`
- Requirement: TLS is mandatory for all user-facing access.
- Enforcement: Requests where `x-forwarded-proto != https` receive `426 TLS_REQUIRED`.
- Verification: Integration test `backend/tests/integration/public-announcements.tls.integration.test.ts`.
