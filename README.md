# Portfolio Payload CMS

This is a Payload CMS remake of the portfolio CMS dashboard. It replaces the custom React + shadcn + Supabase-client dashboard with a Next.js + Payload CMS app.

## What changed

- Removed `@supabase/supabase-js` frontend dashboard code.
- Removed the queue/share-queue dashboard concept.
- Added Payload Admin at `/admin`.
- Added Payload collections for posts, projects, categories, media, and share events.
- Added Payload globals for site settings and autoshare status.
- Uses Postgres directly via `@payloadcms/db-postgres`.

Payload installs into a Next.js app and provides its own admin panel, REST API, and GraphQL routes. The official docs list `payload`, `@payloadcms/next`, and a database adapter such as `@payloadcms/db-postgres` as the core setup.

## Requirements

- Node.js 20.9+
- Postgres database connection string
- Supabase direct database URL if you still want to use Supabase Postgres

Do not use `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` for Payload. Payload needs `DATABASE_URL`.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
PAYLOAD_SECRET=use-a-long-random-secret
AUTOSHARE_WEBHOOK_SECRET=use-another-random-secret-for-n8n
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:5173
```

Then run:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000/admin
```

Payload will ask you to create the first admin user.

## Admin content model

### Collections

- `users` - Payload admin users
- `media` - uploaded images
- `categories` - name + slug
- `blog-posts` - title, slug, excerpt, content, source, status, SEO, categories
- `projects` - title, slug, summary, content, links, source, status, SEO, categories
- `share-events` - historical social/share events

### Globals

- `site-settings` - homepage hero and CTA text
- `autoshare-status` - simple workflow state for n8n or cron

## Autoshare endpoint for n8n

Read status:

```bash
curl http://localhost:3000/api/autoshare/status \
  -H "x-autoshare-secret: $AUTOSHARE_WEBHOOK_SECRET"
```

Update status:

```bash
curl -X PATCH http://localhost:3000/api/autoshare/status \
  -H "content-type: application/json" \
  -H "x-autoshare-secret: $AUTOSHARE_WEBHOOK_SECRET" \
  -d '{
    "is_enabled": true,
    "status": "success",
    "platform": "linkedin",
    "last_checked_at": "2026-06-29T00:00:00.000Z",
    "last_shared_at": "2026-06-29T00:00:00.000Z",
    "last_message": "Shared latest project"
  }'
```

Create a share event through Payload REST API:

```bash
curl -X POST http://localhost:3000/api/share-events \
  -H "content-type: application/json" \
  -H "x-autoshare-secret: $AUTOSHARE_WEBHOOK_SECRET" \
  -d '{
    "entity_type": "project",
    "platform": "linkedin",
    "url": "https://example.com/projects/demo",
    "title": "Shared project"
  }'
```

## Important database warning

This project uses Payload-managed tables with `payload_` prefixes. That is intentional.

Do not point Payload at your existing production Supabase database without a backup. Payload manages schema changes via Drizzle and can warn about destructive changes in development. Keeping Payload tables prefixed avoids collision with your old `blog_posts`, `projects`, `categories`, `site_settings`, and `share_events` tables.

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

This app intentionally does not include the demo portfolio frontend anymore. It only provides Payload Admin/API.

- `/` redirects to `/admin`
- `/admin` is the Payload dashboard
- `/api/*` is the Payload REST API
- `/api/graphql` is the Payload GraphQL endpoint
- `/api/autoshare/*` contains the n8n autoshare endpoints

Build your public portfolio frontend as a separate app and fetch from this Payload API. Set `FRONTEND_ORIGIN` to your frontend URL so browser requests are allowed.


## Fixing the Payload import map error

If the dashboard shows:

```txt
getFromImportMap: PayloadComponent not found in importMap
key: "@payloadcms/next/rsc#CollectionCards"
```

Regenerate the Payload admin import map and restart:

```bash
npm run generate:importmap
npm run dev
```

For Docker local development, the scripts now run `payload generate:importmap` before `next dev`. For production images, the Docker build runs import map generation before `next build`.

## n8n autoshare workflow

This version includes a ready-to-import n8n starter workflow:

```txt
n8n/portfolio-autoshare-generic-webhook.json
```

It uses these Payload endpoints:

```txt
GET /api/autoshare/next?platform=linkedin&type=all
POST /api/autoshare/complete
GET /api/autoshare/status
PATCH /api/autoshare/status
```

The workflow is intentionally generic. Replace the node named **Post to Social Platform - Replace This** with your real LinkedIn/X/Facebook/Telegram/social API node. The rest of the workflow can stay the same.

See:

```txt
n8n/README.md
```

for import and configuration steps.

## Docker Compose deployment

This project now includes Docker support for running Payload, n8n, and Postgres together.

### Included files

```txt
Dockerfile
compose.yaml
compose.local.yaml
.env.compose.example
docker/postgres/init-databases.sh
```

### Local Docker run

Use this for testing on your own machine without HTTPS or DNS:

```bash
cp .env.compose.example .env
mkdir -p local-files media
# edit .env secrets first
docker compose -f compose.local.yaml up -d --build
```

Open:

```txt
Payload: http://localhost:3000/admin
n8n:     http://localhost:5678
```

### Cloud Docker run with HTTPS

Use this when your domain DNS is pointed to the server:

```bash
cp .env.compose.example .env
mkdir -p local-files media
# edit DOMAIN_NAME, APP_SUBDOMAIN, N8N_SUBDOMAIN, SSL_EMAIL, and all secrets
docker compose up -d --build
```

The default hostnames are:

```txt
Payload: https://portfolio.example.com
n8n:     https://n8n.example.com
```

Change them in `.env`.

### n8n + Payload connection inside Docker

Inside the Compose network, n8n calls Payload through:

```txt
http://payload:3000
```

That value is passed to n8n as:

```env
PAYLOAD_BASE_URL=http://payload:3000
```

The included n8n workflow already uses `$env.PAYLOAD_BASE_URL` and `$env.AUTOSHARE_WEBHOOK_SECRET`, so you only need to replace the social posting node.

### Database layout

The single Postgres container creates two databases on first startup:

```txt
payload
n8n
```

Payload and n8n intentionally use separate databases. If you change `PAYLOAD_DB_NAME` or `N8N_DB_NAME` after the first startup, recreate the `postgres_data` volume or create the database manually.

## Docker build note

This project uses `next build --experimental-build-mode compile` for Docker builds. Payload + Next can otherwise try to collect page data during image build and connect to Postgres before the Compose runtime services exist.

To debug build output:

```bash
docker compose -f compose.local.yaml build payload --no-cache --progress=plain
```

To read logs after containers start, use the plural command:

```bash
docker compose -f compose.local.yaml logs -f payload
```

## Docker troubleshooting: missing `payload_users`

If you see:

```txt
relation "payload_users" does not exist
```

You started Payload against a fresh Postgres database before the Payload schema was created. For local Docker, use the included development compose setup:

```bash
docker compose -f compose.local.yaml down -v
docker compose -f compose.local.yaml up -d --build
```

The local compose file uses `Dockerfile.local` and runs Payload in development mode so Payload can sync the schema automatically. For production, generate and run Payload migrations instead.

## Headless use in this full-stack package

This backend is intentionally admin/API only. The public frontend lives in `../frontend` and reads Payload REST endpoints.
