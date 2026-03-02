# TLS Enforcement Notes

- UC-15 schedule edit endpoints (`GET/PUT /api/editor/conferences/{conferenceId}/schedule`) require HTTPS.
- Requests without `x-forwarded-proto: https` are rejected with HTTP 426 and `TLS_REQUIRED`.
- UC-16 author schedule endpoint (`GET /api/author/schedule`) requires HTTPS.
- Non-HTTPS requests for UC-16 are rejected with HTTP 426 and `TLS_REQUIRED`.
