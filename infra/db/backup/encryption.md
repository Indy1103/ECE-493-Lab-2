# Encryption Notes

- Schedule edit data for UC-15 is stored in the PostgreSQL system of record with encrypted-at-rest infrastructure controls.
- Backup artifacts that include schedule rows and modification request records must remain encrypted in transit and at rest.
- UC-16 schedule publication state (`schedule_publications`) and author notification records (`author_notifications`) must remain encrypted at rest and included in encrypted backup snapshots.
