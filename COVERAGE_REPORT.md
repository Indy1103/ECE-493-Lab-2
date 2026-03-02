# Coverage Report

Date: 2026-03-01  
Branch: `001-view-conference-announcements`

Command run:

```bash
npm run coverage -w backend
```

Result:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## c8 output

```text
---------------------------------------|---------|----------|---------|---------|-------------------
File                                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------------------------|---------|----------|---------|---------|-------------------
All files                              |     100 |      100 |     100 |     100 |
 business/rules                        |     100 |      100 |     100 |     100 |
  publicAnnouncementEligibility.ts     |     100 |      100 |     100 |     100 |
 business/services                     |     100 |      100 |     100 |     100 |
  publicAnnouncementService.ts         |     100 |      100 |     100 |     100 |
 data                                  |     100 |      100 |     100 |     100 |
  ...nferenceAnnouncementRepository.ts |     100 |      100 |     100 |     100 |
 presentation/http                     |     100 |      100 |     100 |     100 |
  server.ts                            |     100 |      100 |     100 |     100 |
 presentation/routes                   |     100 |      100 |     100 |     100 |
  publicAnnouncementsRoute.ts          |     100 |      100 |     100 |     100 |
 shared/contracts                      |     100 |      100 |     100 |     100 |
  publicAnnouncementsSchemas.ts        |     100 |      100 |     100 |     100 |
 shared/observability                  |     100 |      100 |     100 |     100 |
  announcementMetrics.ts               |     100 |      100 |     100 |     100 |
---------------------------------------|---------|----------|---------|---------|-------------------
```

---

# Coverage Report (Appendix: UC-02)

Date: 2026-03-01  
Branch: `002-user-account-registration`

Command run:

```bash
npm run coverage -w backend
```

Result:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## c8 output summary

```text
All files | % Stmts 100 | % Branch 100 | % Funcs 100 | % Lines 100
```

---

# Coverage Report (Appendix: UC-03)

Date: 2026-03-02  
Branch: `003-user-login`

Command run:

```bash
npm run coverage -w backend
```

Result:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## c8 output summary

```text
All files | % Stmts 100 | % Branch 100 | % Funcs 100 | % Lines 100
```

---

# Coverage Report (Appendix: UC-04)

Date: 2026-03-02  
Branch: `004-change-password`

Command run:

```bash
npm run coverage -w backend
```

Result:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## c8 output summary

```text
All files | % Stmts 100 | % Branch 100 | % Funcs 100 | % Lines 100
```

---

# Coverage Report (Appendix: UC-05)

Date: 2026-03-02  
Branch: `005-submit-paper-manuscript`

Command run:

```bash
npm run coverage -w backend
```

Result:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## c8 output summary

```text
All files | % Stmts 100 | % Branch 100 | % Funcs 100 | % Lines 100
```

---

# Coverage Report (Appendix: UC-06)

Date: 2026-03-02  
Branch: `006-save-submission-draft`

Command run:

```bash
npm run coverage -w backend
```

Result:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## c8 output summary

```text
All files | % Stmts 100 | % Branch 100 | % Funcs 100 | % Lines 100
```

Notes:
- Coverage command enforces `--check-coverage --branches 100 --functions 100 --lines 100 --statements 100`.
- Type-only UC-06 repository contract file excluded from c8 script config: `src/data/submission-drafts/SubmissionDraftRepository.ts`.

---

# Coverage Report (Appendix: UC-07)

Date: 2026-03-02  
Branch: `007-assign-paper-referees`

Command run:

```bash
npm run coverage -w backend
```

Result:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## c8 output summary

```text
All files | % Stmts 100 | % Branch 100 | % Funcs 100 | % Lines 100
```

---

# Coverage Report (Appendix: UC-10)

Date: 2026-03-02  
Branch: `010-submit-paper-review`

Command run:

```bash
npm run coverage -w backend
```

Result:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## c8 output summary

```text
All files | % Stmts 100 | % Branch 100 | % Funcs 100 | % Lines 100
```

Notes:
- Coverage command enforces `--check-coverage --branches 100 --functions 100 --lines 100 --statements 100`.
- UC-10 branch coverage is fully satisfied, including `submit-review.service.ts`, validation policy, session guard parsing, and handler/repository fallback branches.

---

# Coverage Report (Appendix: UC-12)

Date: 2026-03-02  
Branch: `012-record-final-decision`

Command run:

```bash
npm run coverage -w backend
```

Result:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## c8 output summary

```text
All files | % Stmts 100 | % Branch 100 | % Funcs 100 | % Lines 100
```

Notes:
- Coverage command enforces `--check-coverage --branches 100 --functions 100 --lines 100 --statements 100`.
- UC-12 branch coverage is fully satisfied, including completion gating, immutability conflicts, unavailable/denied fallback mapping, audit redaction, TLS/session guard branches, and repository conflict/read-failure branches.
