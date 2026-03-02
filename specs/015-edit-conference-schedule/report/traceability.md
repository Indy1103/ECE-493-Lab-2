# UC-15 Traceability

- UC-15 main flow -> AT-UC15-01
  - `GET /api/editor/conferences/{conferenceId}/schedule`
  - `PUT /api/editor/conferences/{conferenceId}/schedule` valid edit path
- UC-15 extension 3a -> AT-UC15-02
  - Invalid modification rejection path with unchanged schedule state
  - Resubmission of corrected edits
