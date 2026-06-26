# RemedyQuest Database

The app now uses a simple local JSON database for the demo backend:

- `data/app-db.json`: active local database used by the backend.
- `schema/schema.sql`: relational schema reference for a future SQLite/PostgreSQL move.
- `seeds/seed.sql`: sample SQL data matching the demo state.

## What Is Stored

- Patient profile and care metadata.
- Exercise plan items shown on the existing Exercises page.
- Chatbot messages.
- Chatbot intake state and draft rehab plan.
- Form Coach session summaries.
- Progress chart data and demo doctor/patient rows.

No camera frames, videos, or raw pose landmarks are stored.

## Backend Connection

The backend reads and writes:

```text
database/data/app-db.json
```

You can override the path:

```bash
JSON_DATABASE_PATH=database/data/app-db.json npm run dev
```

On Windows PowerShell:

```powershell
$env:JSON_DATABASE_PATH="database/data/app-db.json"
npm run dev
```

## Reset Demo Data

Stop the dev server, restore `database/data/app-db.json` from source control, then restart:

```bash
npm run dev
```

## Future SQL Setup

For SQLite:

```bash
sqlite3 remedyquest.db < database/schema/schema.sql
sqlite3 remedyquest.db < database/seeds/seed.sql
```

The controller response shapes should stay the same if the JSON file is later replaced by SQLite or PostgreSQL.
