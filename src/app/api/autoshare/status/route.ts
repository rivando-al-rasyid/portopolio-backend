import config from '@payload-config'
import { getPayload } from 'payload'

function assertAutoshareSecret(request: Request) {
  const expected = process.env.AUTOSHARE_WEBHOOK_SECRET
  const actual = request.headers.get('x-autoshare-secret')

  if (!expected || actual !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function GET(request: Request) {
  const unauthorized = assertAutoshareSecret(request)
  if (unauthorized) return unauthorized

  const payload = await getPayload({ config })
  const status = await payload.findGlobal({ slug: 'autoshare-status' })

  return Response.json(status)
}

export async function PATCH(request: Request) {
  const unauthorized = assertAutoshareSecret(request)
  if (unauthorized) return unauthorized

  const body = await request.json()
  const payload = await getPayload({ config })

  const status = await payload.updateGlobal({
    slug: 'autoshare-status',
    data: {
      is_enabled: body.is_enabled,
      status: body.status,
      platform: body.platform,
      last_shared_at: body.last_shared_at,
      last_checked_at: body.last_checked_at || new Date().toISOString(),
      last_message: body.last_message,
      last_error: body.last_error,
    },
  })

  return Response.json(status)
}
