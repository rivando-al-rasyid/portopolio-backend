# n8n autoshare setup

This folder contains an importable starter workflow:

```txt
n8n/portfolio-autoshare-generic-webhook.json
```

## What the workflow does

1. Runs every 6 hours.
2. Calls Payload:

```txt
GET /api/autoshare/next?platform=linkedin&type=all
```

3. Stops if there is no content to share.
4. Builds a social post payload.
5. Sends the payload to the placeholder social posting endpoint.
6. Calls Payload:

```txt
POST /api/autoshare/complete
```

7. Payload creates a `share-events` record and updates the `autoshare-status` global.

## Docker Compose configuration

When you run this project with the included Compose files, n8n receives these environment variables automatically:

```env
PAYLOAD_BASE_URL=http://payload:3000
AUTOSHARE_WEBHOOK_SECRET=your-secret-from-.env
```

The imported workflow already uses these expressions:

```txt
={{ $env.PAYLOAD_BASE_URL }}/api/autoshare/next
={{ $env.PAYLOAD_BASE_URL }}/api/autoshare/complete
={{ $env.AUTOSHARE_WEBHOOK_SECRET }}
```

So, inside the Compose stack, you do not need to replace the Payload URL manually.

## Before activating the workflow

In Payload Admin:

1. Go to **Globals > Autoshare Status**.
2. Set **Enabled** to true.
3. Set **Status** to `idle`.
4. Publish at least one blog post or project.

## Import into n8n

1. Open n8n.
2. Import `portfolio-autoshare-generic-webhook.json`.
3. Open **Post to Social Platform - Replace This**.
4. Replace it with your real LinkedIn/X/Facebook/Telegram/social API node.
5. Test manually.
6. Activate the workflow.

## If n8n runs outside this Compose stack

Set `PAYLOAD_BASE_URL` to wherever Payload is reachable from n8n:

```env
PAYLOAD_BASE_URL=https://your-portfolio-domain.com
```

Do not use `http://localhost:3000` from inside the n8n container unless Payload is running inside the same container. If Payload is another service in the same Compose stack, use:

```txt
http://payload:3000
```

## Payload endpoints

### Get next unshared item

```bash
curl "http://localhost:3000/api/autoshare/next?platform=linkedin&type=all" \
  -H "x-autoshare-secret: $AUTOSHARE_WEBHOOK_SECRET"
```

Example response when there is content:

```json
{
  "shouldShare": true,
  "platform": "linkedin",
  "item": {
    "entity_type": "project",
    "entity_id": "...",
    "title": "VanWallet",
    "slug": "vanwallet",
    "description": "Digital wallet app...",
    "url": "https://your-portfolio-domain.com/projects/vanwallet",
    "image_url": "https://your-portfolio-domain.com/media/example.webp",
    "social_text": "New project: VanWallet\n\nDigital wallet app...\n\nhttps://your-portfolio-domain.com/projects/vanwallet"
  }
}
```

### Mark share complete

```bash
curl -X POST "http://localhost:3000/api/autoshare/complete" \
  -H "x-autoshare-secret: $AUTOSHARE_WEBHOOK_SECRET" \
  -H "content-type: application/json" \
  -d '{
    "success": true,
    "platform": "linkedin",
    "entity_type": "project",
    "entity_id": "PROJECT_ID",
    "title": "VanWallet",
    "source_url": "https://your-portfolio-domain.com/projects/vanwallet",
    "shared_url": "https://linkedin.com/posts/example",
    "message": "Posted by n8n"
  }'
```

If posting fails, call the same endpoint with:

```json
{
  "success": false,
  "platform": "linkedin",
  "entity_type": "project",
  "entity_id": "PROJECT_ID",
  "title": "VanWallet",
  "error": "API rate limit or token expired"
}
```
