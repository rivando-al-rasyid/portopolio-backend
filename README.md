# Portfolio Payload CMS Backend

Backend-only Payload CMS for the portfolio dashboard/API.

This package intentionally does **not** include app-local Docker Compose files. Keep orchestration at the root deployment level, not inside `backend/` or `frontend/`.

## What this backend provides

- Payload Admin at `/admin`
- Payload REST API at `/api/*`
- Payload GraphQL at `/api/graphql`
- Collections for users, media, categories, blog posts, projects, and share events
- Globals for site settings and autoshare status
- PostgreSQL support via `@payloadcms/db-postgres`

## Requirements

- Node.js 20.9+
- PostgreSQL database
- A valid `DATABASE_URL`

Payload does not use `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY`. It needs a direct PostgreSQL connection string.

## Local setup without Docker Compose

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@localhost:5432/payload
PAYLOAD_SECRET=use-a-long-random-secret
AUTOSHARE_WEBHOOK_SECRET=use-another-random-secret-if-used
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:4321
```

Run:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000/admin
```

Payload will ask you to create the first admin user on a fresh database.

## Useful commands

```bash
npm run generate:types
npm run generate:importmap
npm run migrate:create
npm run migrate
npm run build
npm run start
```

## Dashboard-only mode

This app is admin/API only. Your public frontend should be a separate app and fetch from the Payload REST API.

- `/` redirects to `/admin`
- `/admin` is the Payload dashboard
- `/api/*` is the Payload REST API
- `/api/graphql` is the Payload GraphQL endpoint
- `/api/autoshare/*` contains optional autoshare endpoints if you still use them

Set `FRONTEND_ORIGIN` to your real frontend URL so browser requests are allowed.

## Common Payload import map fix

If the dashboard shows:

```txt
getFromImportMap: PayloadComponent not found in importMap
```

Run:

```bash
npm run generate:importmap
npm run dev
```

## n8n workflow export

The `n8n/` folder contains workflow export files only. It does **not** contain Docker Compose orchestration.

If you run n8n from a separate root Compose stack, import the workflow JSON from:

```txt
n8n/portfolio-autoshare-generic-webhook.json
```

## Compose ownership

Compose files were removed from this backend package. Put these files only in your root deployment folder, not inside `backend/` or `frontend/`:

```txt
compose.yaml
compose.local.yaml
compose.prod.yaml
Caddyfile
.env.compose.example
```

The same cleanup should be applied to your frontend repo if it has its own app-local Compose files.

### What stays in backend

```txt
Dockerfile
Dockerfile.local
.dockerignore
```

These are app image build files, not orchestration files. Keep them only if your root Compose file builds the backend image from this folder.

## Database safety

Before pointing this backend at an existing production database, create a backup first.

```bash
pg_dump "$DATABASE_URL" > backup-before-payload-change.sql
```

Payload manages its own schema through migrations/Drizzle. Do not manually edit Payload internal tables unless you know exactly what generated schema is expected.
