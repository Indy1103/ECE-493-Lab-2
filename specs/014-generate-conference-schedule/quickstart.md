# Quickstart: Generate Conference Schedule (UC-14)

## Goal

Generate conference schedule entries for accepted papers and present them to an administrator.

## Verification Checklist

- Contract tests:
  - `cd backend && node --import tsx --test "tests/contract/conference-schedule/*.test.ts"`
- Integration tests:
  - `cd backend && node --import tsx --test "tests/integration/conference-schedule/*.test.ts"`
- Unit tests:
  - `cd backend && node --import tsx --test tests/unit/conferenceScheduleSupport.unit.test.ts`
- UC-14 coverage gate:
  - `cd backend && npx c8 --all --check-coverage --branches 100 --functions 100 --lines 100 --statements 100 --include "src/business/conference-schedule/*.ts" --include "src/data/conference-schedule/*.ts" --include "src/presentation/conference-schedule/*.ts" --reporter text node --import tsx --test tests/unit/conferenceScheduleSupport.unit.test.ts "tests/contract/conference-schedule/*.test.ts" "tests/integration/conference-schedule/*.test.ts"`
