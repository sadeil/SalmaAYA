# RemedyQuest Frontend

Professional responsive frontend prototype for a health-tech therapeutic exercise platform.

## Stack

- React + Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- Recharts

## Run locally

```bash
npm install
npm run dev
```

## Backend integration

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`. The API boundary is centralized in `src/services/api.js`; replace mock data page-by-page as backend endpoints become available.

Main integration areas:

- Authentication: `/auth/login`, `/auth/register`
- Patient: `/patient/dashboard`, `/patient/exercises`
- Doctor: `/doctor/patients`
- Admin: `/admin/dashboard`

Payment, AI assistant, and refund processing are frontend placeholders only.
