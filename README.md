# whiskers-e-comm

Whiskers V2 monorepo: **whiskers-api** (NestJS + Prisma) and **whiskers-web-v2** (React 19 + Vite + Tailwind). Product scope and phases live in [`plan.md`](plan.md) (中文) and [`plan_en.md`](plan_en.md) (English); both describe the same roadmap.

## Prerequisites

- Node.js 20+
- Docker (for Postgres + Redis in development)
- v1 repo: https://github.com/HoshinoIzumi/Whiskers

## Phase 1 — run locally

### Data stores

From the repo root:

```bash
docker compose up -d
```

Postgres: `localhost:5432` (user / password / database: `whiskers`). Redis: `localhost:6379`.

### Backend (`whiskers-api`)

```bash
cd whiskers-api
cp .env.example .env   # first time only; set JWT_SECRET, REDIS_URL, DATABASE_URL
npm install
npx prisma migrate dev # applies migrations (requires Postgres up)
npm run start:dev
```

- Liveness: `GET http://localhost:3000/api/health` → `{ "status": "ok" }`
- DB readiness: `GET http://localhost:3000/api/health/ready` (expects Postgres reachable via `DATABASE_URL`)
- Swagger: `http://localhost:3000/api/docs` (Bearer auth for protected routes)
- CORS defaults to `http://localhost:5173`; override with `CORS_ORIGIN` (comma-separated origins)

### Frontend (`whiskers-web-v2`)

```bash
cd whiskers-web-v2
cp .env.example .env.local   # optional; defaults API to http://localhost:3000/api
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). Routes include `/`, `/flavours` (today’s menu via `GET /menu`), `/cart`, `/checkout` → Square Sandbox hosted checkout, `/checkout/success`, `/login`.

### Phase 3 — Square Sandbox (orders + webhook)

1. In [Square Developer](https://developer.squareup.com/), create a Sandbox application and copy **Sandbox access token** and a **Location ID**.
2. Add them (and `FRONTEND_URL`) to `whiskers-api/.env`. Run migrations so `orders` has Square columns: `npx prisma migrate dev` from `whiskers-api`.
3. Expose the API with ngrok (or similar), register webhook URL `https://<host>/api/orders/webhook`, subscribe to `payment.updated` (and/or `payment.created`), and set `SQUARE_WEBHOOK_SIGNATURE_KEY` + `SQUARE_WEBHOOK_NOTIFICATION_URL` to match the subscription.
4. In development, if webhook env vars are unset, signature verification is skipped (do **not** deploy that way).

Stack baseline: **React Router**, **TanStack Query**, **Zustand** (`authStore`, `cartStore`), **Axios** (`src/lib/api.ts`).

### Migrations

Use descriptive names and run from `whiskers-api`:

```bash
npx prisma migrate dev --name <short_purpose>
```

Prisma is pinned to **6.x** for now so NestJS can use the classic `PrismaClient` from `@prisma/client` without driver adapters. Upgrading to Prisma 7 is a deliberate follow-up (see [upgrade guide](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)).

## Parallel agent work (Cursor)

`plan.md` and `plan_en.md` are aligned; split work by **surface** so two agents rarely touch the same files:

| Track | Owns | Primary docs |
|-------|------|----------------|
| **A – API & infra** | `whiskers-api/`, root `docker-compose*.yml`, `.env.example` patterns for backend | `plan.md` §3–5 (backend phases) |
| **B – Web** | `whiskers-web-v2/`, SPA routes, Zustand/Query when in Phase 4 | `plan_en.md` §3–4 §6 (checklists) |

**Rules:** Track A must not edit `whiskers-web-v2/`; Track B must not edit `whiskers-api/` without coordination. Shared contract changes (DTOs, OpenAPI) — agree on types or generate client in one step. Root `README.md` updates: either agent may append a short note, but avoid conflicting edits in one pass.

## License

Private / UNLICENSED (see per-package `package.json`).
