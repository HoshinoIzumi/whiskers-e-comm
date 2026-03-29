# Whiskers V2 — multi-agent split

Use **two tracks** so `plan.md` and `plan_en.md` stay in sync without merge noise. The plans describe the same MVP; language only differs.

## Track A — Backend & platform

- **Paths:** `whiskers-api/`, root `docker-compose.yml`, future `docker-compose.prod.yml`, Jenkinsfile when added.
- **Milestone guide:** `plan.md` sections 3–5, 7 (backend-heavy).
- **Phase 1 done when:** `docker compose up` works; `GET /api/health` returns 200; Prisma migrates against local Postgres; optional `GET /api/health/ready` checks DB.

## Track B — Frontend SPA

- **Paths:** `whiskers-web-v2/` only.
- **Milestone guide:** `plan_en.md` sections 3, 6 (checkboxes for UI/state).
- **Phase 1 done when:** `npm run dev` shows the Whiskers V2 placeholder; Tailwind + ESLint + Prettier behave.

## Coordination

- **No cross-track edits** in the same PR without calling out API contracts.
- **API contract:** Track A exposes Swagger; Track B mirrors paths in `services/api.ts` and shared types (add a `packages/shared` later if needed).
- **Env:** Backend `.env` in `whiskers-api/`; frontend uses `VITE_*` only when introduced.

## Starting a parallel session in Cursor

1. Open two Composer/chat contexts (or Agent + Editor).
2. Paste Track A prompt with `@plan.md` and `@whiskers-api`.
3. Paste Track B prompt with `@plan_en.md` and `@whiskers-web-v2`.
4. Merge at the repo root only for `README.md` or compose files after both tracks finish a phase.
