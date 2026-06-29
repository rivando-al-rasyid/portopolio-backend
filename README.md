# Portfolio Backend Deployment Compose

This package is meant to live inside your `backend/` folder.

It deploys:

- Caddy reverse proxy
- Frontend from GHCR: `ghcr.io/rivando-al-rasyid/portopolio-astro:latest`
- Payload backend from GHCR: `ghcr.io/rivando-al-rasyid/portopolio-backend:latest`
- PostgreSQL 17
- n8n

## URLs

With `PUBLIC_HOST=202-155-132-98.domainesia.io`:

- Frontend: `https://202-155-132-98.domainesia.io`
- Payload Admin: `https://202-155-132-98.domainesia.io/admin`
- Payload API: `https://202-155-132-98.domainesia.io/api`
- n8n: `https://202-155-132-98.domainesia.io/n8n/`

## Setup

Copy env:

```bash
cp .env.production.example .env
nano .env
```

Generate secrets:

```bash
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
```

Use them for:

```env
POSTGRES_PASSWORD=
PAYLOAD_SECRET=
N8N_ENCRYPTION_KEY=
```

Create folders:

```bash
mkdir -p local-files media n8n infra/postgres
chmod +x infra/postgres/init-databases.sh
```

Pull and start:

```bash
docker compose pull frontend payload
docker compose up -d --remove-orphans
```

Check status:

```bash
docker compose ps
```

Check logs:

```bash
docker compose logs -f caddy
docker compose logs -f payload
docker compose logs -f frontend
docker compose logs -f n8n
docker compose logs -f postgres
```

## Update deployment

```bash
docker compose pull frontend payload
docker compose up -d --force-recreate --remove-orphans
```

## Important notes

If your frontend image is not Nginx-based and listens on port `4321`, set:

```env
FRONTEND_CONTAINER_PORT=4321
```

If the GHCR images are private, login first:

```bash
docker login ghcr.io -u rivando-al-rasyid
```

Use a GitHub Personal Access Token as the password.
