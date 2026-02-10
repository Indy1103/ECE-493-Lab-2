# ECE 493 Lab 2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-09

## Active Technologies
- TypeScript 5.x (frontend + backend) + React 18, Fastify (web API), Prisma (PostgreSQL access), Zod (validation), Argon2 (password hashing), rate-limiter-flexible (throttling), Pino (structured logging), Prometheus client (metrics) (002-user-account-registration)
- PostgreSQL as system of record with encrypted-at-rest infrastructure controls and encrypted backups (002-user-account-registration)
- TypeScript 5.x (frontend + backend) + React 18, Fastify (web API), Prisma (PostgreSQL access), Zod (validation), Argon2 (credential verification), rate-limiter-flexible (failed-login throttling), Pino (structured logging), Prometheus client (metrics) (003-user-login)
- PostgreSQL as system of record with encrypted-at-rest controls and encrypted backups (003-user-login)
- TypeScript 5.x (React frontend + Fastify backend) + React 18, Fastify, Prisma (PostgreSQL), Zod, Argon2, rate-limiter-flexible, Pino, prom-clien (004-change-password)
- PostgreSQL system of record with encrypted-at-rest infrastructure controls and encrypted backups (004-change-password)
- TypeScript 5.x (React frontend + Fastify backend) + React 18, Fastify, Prisma (PostgreSQL), Zod, Pino, prom-clien (005-submit-paper-manuscript)
- PostgreSQL system of record + encrypted object storage for manuscript files + encrypted backups (005-submit-paper-manuscript)
- TypeScript 5.x (React frontend + Fastify backend) + React 18, Fastify, Prisma (PostgreSQL), Zod, Pino, prom-client, rate-limiter-flexible (existing auth-related throttling stack) (007-assign-paper-referees)
- PostgreSQL system of record for assignments/invitations + encrypted-at-rest controls + encrypted backups (007-assign-paper-referees)
- TypeScript 5.x (React frontend + Fastify backend) + React 18, Fastify, Prisma (PostgreSQL), Zod, Pino, prom-client, rate-limiter-flexible (existing throttling stack) (008-review-invitation-response)
- PostgreSQL system of record for invitation responses and assignment state + encrypted-at-rest controls + encrypted backups (008-review-invitation-response)
- TypeScript 5.x (frontend + backend) + React 18, Fastify, Prisma, Zod, Pino, prom-client, rate-limiter-flexible (009-access-assigned-paper)
- PostgreSQL for assignments/access metadata + encrypted object storage for paper files (009-access-assigned-paper)

- TypeScript 5.x (frontend + backend) + React 18, Fastify (web API), Prisma (PostgreSQL access), Zod (validation), Pino (structured logging), Prometheus client (metrics) (001-view-conference-announcements)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (frontend + backend): Follow standard conventions

## Recent Changes
- 009-access-assigned-paper: Added TypeScript 5.x (frontend + backend) + React 18, Fastify, Prisma, Zod, Pino, prom-client, rate-limiter-flexible
- 008-review-invitation-response: Added TypeScript 5.x (React frontend + Fastify backend) + React 18, Fastify, Prisma (PostgreSQL), Zod, Pino, prom-client, rate-limiter-flexible (existing throttling stack)
- 007-assign-paper-referees: Added TypeScript 5.x (React frontend + Fastify backend) + React 18, Fastify, Prisma (PostgreSQL), Zod, Pino, prom-client, rate-limiter-flexible (existing auth-related throttling stack)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
