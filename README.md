# RemedyQuest

RemedyQuest is organized as a full-stack project with separate frontend, backend, and database areas.

## Project Structure

```text
frontend/   React + Vite application, UI, routes, styles, frontend services
backend/    Node HTTP API, controllers, routes, models, middleware, config
database/   SQL schema, seed data, and database setup notes
scripts/    Root development and verification scripts
```

## Install

```bash
npm install
```

## Run Everything

```bash
npm run dev
```

This starts:

- Backend API: `http://127.0.0.1:8787`
- Frontend dev server: Vite, with `/api` proxied to the backend

## Public GitHub Pages Demo

The app is published as a static browser demo at:

```text
https://sadeil.github.io/SalmaAYA/
```

The GitHub Pages build uses in-browser demo data so anyone can open the link without running the Node backend locally.

## Run Frontend Only

```bash
npm run dev:frontend
```

Frontend source lives in `frontend/src`.

## Run Backend Only

```bash
npm run dev:backend
```

Backend source lives in `backend/src`.

## Production Build And Start

```bash
npm run build
npm start
```

The backend serves the built frontend from `frontend/dist` and exposes the API under `/api`.

## Verification

```bash
npm run lint
npm run build
npm start
npm run test:smoke
```

The smoke test verifies routes, localization, login, exercise flow, chat, and mobile navigation.

## Accounts

Anyone can create a patient account from **Get started**. A new patient starts
from zero — no plan, 0 points, Level 1 — and is guided to build a first plan
with the AI assistant.

Two demo accounts show the prototype data:

| Role    | Email                   | Password     |
| ------- | ----------------------- | ------------ |
| Patient | `salma@remedyquest.app` | `Salma@2026` |
| Doctor  | `aya@remedyquest.app`   | `Aya@2026`   |

Points: +5 per completed exercise (or completed camera session), once per
exercise per day. Levels start at 0, 40, 75, 100 and 150 points; reaching
Level 3 and Level 4 each earns a 5 ILS refund.

The rules live in `shared/remedyCore.mjs`, used by both the Node backend and
the GitHub Pages demo. On GitHub Pages there is no server, so accounts and
progress are stored in that browser's localStorage.

## API Routes

Patient, doctor and admin routes need `Authorization: Bearer <token>` from
login or register.

- `GET /api/health`
- `POST /api/auth/register` — creates a patient account
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/patient/dashboard` — stats, plan, rewards for the signed-in patient
- `GET /api/patient/exercises`
- `POST /api/patient/exercises/:id/status` — `{ "done": true }` awards points
- `GET /api/patient/messages` / `POST /api/patient/messages` — care-plan chat
- `POST /api/patient/conversations/end`
- `GET /api/patient/sessions` / `POST /api/patient/sessions` — camera sessions
- `GET /api/patient/care-messages` / `POST /api/patient/care-messages`
- `GET /api/doctor/patients`
- `PATCH /api/doctor/patients/:id/plan`
- `GET /api/admin/dashboard` / `GET /api/admin/database` (doctor or admin)

## Database

The backend stores everything in `database/data/app-db.json` (users with
scrypt-hashed passwords, sessions, and one record per patient). Delete the
file to reset it; the demo accounts are recreated on the next start.

SQL schema and seed files for a future relational database are in
`database/schema` and `database/seeds`.
