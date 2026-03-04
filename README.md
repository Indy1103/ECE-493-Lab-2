# ECE 493 Lab 2

Conference Management System monorepo (TypeScript backend + frontend) with UC-based specs and tests.

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm run setup
```

## Run Locally (Frontend + Backend)

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Health check: `http://localhost:3000/health`

### Run each workspace separately

```bash
npm run dev -w backend
npm run dev -w frontend
```

### Local `start` mode

```bash
npm run start
```

- Frontend: `http://localhost:4173`
- Backend: `http://localhost:3000`

## Run Quality Gates (from repo root)

```bash
npm run lint
npm test
npm run coverage
```

What these do:
- `npm run lint` -> type-checks backend and frontend
- `npm test` -> runs backend Node test runner + frontend Node test runner
- `npm run coverage` -> backend c8 coverage with 100% thresholds

## Current Local Runtime Scope

The local backend dev server now exposes all user-facing UC endpoints (UC-01 through UC-17), plus:

- `GET /health`
- `GET /api/demo/credentials` (lists demo roles + usernames + seeded session ids)

Frontend pages in the local shell:

- Public pages: announcements, registration prices, register, login
- Role workspaces: `ADMIN`, `EDITOR`, `AUTHOR`, `REFEREE`, `REGISTERED_USER`
- Shared authenticated page: change password
- Backend demo page: all UC endpoints with role login + RBAC smoke check

## Demo Accounts (All Roles)

All demo accounts use password `Passw0rd88`:

- `ADMIN`: `admin.ava`
- `EDITOR`: `editor.jane`
- `AUTHOR`: `author.alex`
- `REFEREE`: `referee.riley`
- `REGISTERED_USER`: `user.uma`

## Role Routing and Redirects

- Unauthenticated users are redirected to `/login` for protected routes.
- Successful login auto-redirects to role home:
  - `ADMIN` -> `/admin/dashboard`
  - `EDITOR` -> `/editor/dashboard`
  - `AUTHOR` -> `/author/dashboard`
  - `REFEREE` -> `/referee/dashboard`
  - `REGISTERED_USER` -> `/user/dashboard`
- If a logged-in user tries another role's route, the app redirects to their own dashboard.
- Password change success signs the user out and redirects to `/login`.

## Role Features

- `ADMIN`: `/admin/generate-schedule`
- `EDITOR`: `/editor/referee-assignments`, `/editor/completed-reviews`, `/editor/final-decision`, `/editor/schedule-editor`
- `AUTHOR`: `/author/submit-manuscript`, `/author/submission-draft`, `/author/final-decision`, `/author/schedule`
- `REFEREE`: `/referee/invitation`, `/referee/assigned-papers`, `/referee/review-submission`
- `REGISTERED_USER`: `/user/registration-prices`

## Full Demo Walkthrough

1. Run `npm run dev` (or `npm run start`).
2. Open frontend (`http://localhost:5173` for dev, `http://localhost:4173` for start).
3. Sign in at `/login` using one of the demo role accounts.
4. Verify automatic redirect to that role's dashboard.
5. Use left navigation to open each role feature page.
6. Use the `Workflow Context` panel (conference/paper/submission/invitation/assignment IDs) for cross-UC demo flows.
7. Open `/demo` for endpoint-level checks and RBAC smoke testing.
