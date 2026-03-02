# Status Report (After Debugging)

Date: 2026-03-01  
Branch: `001-view-conference-announcements`

## Test Status

Command run:

```bash
npm test
```

Result:
- Backend tests: 21 passed, 0 failed
- Frontend Node test runner: 0 tests discovered, 0 failed
- Overall: PASS

Backend passing suite includes:
- Contract tests (`AVAILABLE`, `EMPTY`)
- Integration tests (available, empty, failure, TLS, recovery, fault-recovery)
- Unit tests (eligibility rules, service mapping, metrics)

---

# Status Report (Appendix: UC-02)

Date: 2026-03-01  
Branch: `002-user-account-registration`

## Test Status

Command run:

```bash
npm test
```

Result:
- Backend tests: 47 passed, 0 failed
- Frontend Node test runner: 0 tests discovered, 0 failed
- Overall: PASS

Backend passing suite includes:
- Contract tests (`201`, `400`, `409`, `429`, `503`)
- Integration tests (success, validation, duplicate email, throttling, failure)
- Foundational security/reliability/observability registration tests
- Unit tests for registration business/security/observability helpers

---

# Status Report (Appendix: UC-03)

Date: 2026-03-02  
Branch: `003-user-login`

## Test Status

Command run:

```bash
npm test
```

Result:
- Backend tests: 71 passed, 0 failed
- Frontend Node test runner: 0 tests discovered, 0 failed
- Overall: PASS

Backend passing suite includes:
- Contract tests (`200`, `401`, `403`, `429`, `503`)
- Integration tests (success, throttling, deterministic outcomes, TLS-only, no-plaintext, concurrency, performance)
- Release-evidence integration tests (at-rest protection, transport rejection, no-plaintext findings)
- UC-03 unit tests for login use-case, role policy, throttle policy, and auth data protection helpers

---

# Status Report (Appendix: UC-04)

Date: 2026-03-02  
Branch: `004-change-password`

## Test Status

Command run:

```bash
npm test
```

Result:
- Backend tests: 108 passed, 0 failed
- Frontend Node test runner: 0 tests discovered, 0 failed
- Overall: PASS

Backend passing suite includes:
- Contract tests (`200`, `400`, `401`, `409`, `429`, `500`)
- Integration tests (success flow, invalid current password, expired session, throttling, rollback on operational failure, conflict mapping)
- Performance integration test (`p95 <= 500ms` target)
- UC-04 support unit tests for validation, throttling, repositories, observability, session auth middleware, and controller mapping

---

# Status Report (Appendix: UC-05)

Date: 2026-03-02  
Branch: `005-submit-paper-manuscript`

## Test Status

Command run:

```bash
npm test
```

Result:
- Backend tests: 141 passed, 0 failed
- Frontend Node test runner: 0 tests discovered, 0 failed
- Overall: PASS

Backend passing suite includes:
- Contract tests (`200`, `201`, `400`, `409`, `413`, `415`)
- Integration tests (success path, intake closed, duplicate protection, metadata/file validation failures, operational rollback, TLS-only enforcement, author-only guard)
- Dedicated UC-05 concurrency and performance integration tests
- UC-05 support unit tests for middleware, service branches, policy/validation helpers, metrics/observability, redaction, and controller mapping

---

# Status Report (Appendix: UC-06)

Date: 2026-03-02  
Branch: `006-save-submission-draft`

## Test Status

Command run:

```bash
npm test
```

Result:
- Backend tests: 174 passed, 0 failed
- Frontend Node test runner: 0 tests discovered, 0 failed
- Overall: PASS

Backend passing suite includes:
- Contract tests for submission drafts (`PUT` success/errors and `GET` success/errors)
- Foundational and story integration tests (ownership/authn/authz, validation, save overwrite, resume retrieval, deterministic concurrency, operational-failure preservation)
- Security/reliability integration tests (TLS-only transport, audit redaction/no plaintext leakage, at-rest and backup coverage checks)
- UC-06 support unit tests for validation, use-case error branches, handlers, repository utilities, and mapper coverage

---

# Status Report (Appendix: UC-07)

Date: 2026-03-02  
Branch: `007-assign-paper-referees`

## Test Status

Command run:

```bash
npm test
```

Result:
- Backend tests: 208 passed, 0 failed
- Frontend Node test runner: 0 tests discovered, 0 failed
- Overall: PASS

Backend passing suite includes:
- Contract tests for referee assignments (`GET` options success/auth errors, `POST` assignment success and validation/capacity/workload failures)
- Foundational and story integration tests (editor authz/authn guard, per-paper serialization, duplicate atomicity, successful assignment + invitation handling, workload and capacity rejection paths, retry path after rejection)
- Security/reliability integration tests (TLS-only transport, no-sensitive-data responses/events, at-rest protection evidence, invitation retry budget terminal handling)
- UC-07 support unit tests for schemas, use-case branches, policy evaluators, mapper branches, repository lock/persistence branches, handler authless branches, guard parsing branches, and audit helpers

---

# Status Report (Appendix: UC-10)

Date: 2026-03-02  
Branch: `010-submit-paper-review`

## Test Status

Command run:

```bash
npm run test -w backend
```

Result:
- Backend tests: 282 passed, 0 failed
- Frontend Node test runner: 0 tests discovered, 0 failed
- Overall: PASS

Backend passing suite includes:
- UC-10 contract tests for review-form retrieval and final review submission outcomes
- UC-10 integration tests for success, validation failures, submit-time ineligibility, duplicate denial, session-expired handling, concurrency control, and audit redaction
- UC-10 unit tests for eligibility/validation policies, submit orchestrator branches, handler mappings, session guard parsing, and repository utility paths

---

# Status Report (Appendix: UC-12)

Date: 2026-03-02  
Branch: `012-record-final-decision`

## Test Status

Command run:

```bash
npm test
```

Result:
- Backend tests: 326 passed, 0 failed
- Frontend Node test runner: 0 tests discovered, 0 failed
- Overall: PASS

Backend passing suite includes:
- UC-12 contract tests for `POST /api/editor/papers/{paperId}/decision` success, pending, finalized, and non-editor denied outcomes
- UC-12 integration tests for success persistence + author notification, pending-review blocking, finalized immutability, concurrency safety, TLS enforcement, and audit redaction
- UC-12 support unit tests for completion gate, notifier, audit logger/repository redaction, service fallback/rethrow branches, mapper branches, session guard branches, and route/handler branches
