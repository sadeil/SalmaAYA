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

## API Routes

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/patient/dashboard`
- `GET /api/patient/exercises`
- `GET /api/patient/messages`
- `POST /api/patient/messages`
- `GET /api/doctor/patients`
- `PATCH /api/doctor/patients/:id/plan`
- `GET /api/admin/dashboard`

## Database

Database files are in `database/`.

For SQLite:

```bash
sqlite3 remedyquest.db < database/schema/schema.sql
sqlite3 remedyquest.db < database/seeds/seed.sql
```

The current backend uses `backend/src/models/appStore.mjs` as an in-memory model layer for the project demo. Replace that model layer with SQL queries when connecting a persistent database.
