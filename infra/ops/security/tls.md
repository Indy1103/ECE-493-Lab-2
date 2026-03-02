# TLS Enforcement Notes

- UC-15 schedule edit endpoints (`GET/PUT /api/editor/conferences/{conferenceId}/schedule`) require HTTPS.
- Requests without `x-forwarded-proto: https` are rejected with HTTP 426 and `TLS_REQUIRED`.
