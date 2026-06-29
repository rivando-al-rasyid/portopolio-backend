import config from '@payload-config'
import { getPayload } from 'payload'
import {
  asAutoshareStatus,
  asBoolean,
  asString,
  assertAutoshareSecret,
  readRequestBody,
} from '@/lib/autoshare'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type StatusPatchBody = {
  is_enabled?: boolean | string | number
  status?: string
  platform?: string
  last_shared_at?: string
  last_checked_at?: string
  last_message?: string
  last_error?: string | null
}

export async function GET(request: Request) {
  const unauthorized = assertAutoshareSecret(request)
  if (unauthorized) return unauthorized

  const payload = await getPayload({ config })
  const status = await payload.findGlobal({
    slug: 'autoshare-status',
    overrideAccess: true,
  })

  return Response.json(status)
}

export async function PATCH(request: Request) {
  const unauthorized = assertAutoshareSecret(request)
  if (unauthorized) return unauthorized

  const body = await readRequestBody<StatusPatchBody>(request)
  const nextStatus = asAutoshareStatus(body.status)

  const payload = await getPayload({ config })
  const currentStatus = await payload.findGlobal({
    slug: 'autoshare-status',
    overrideAccess: true,
  })

  const status = await payload.updateGlobal({
    slug: 'autoshare-status',
    overrideAccess: true,
    data: {
      is_enabled:
        body.is_enabled === undefined ? Boolean(currentStatus?.is_enabled) : asBoolean(body.is_enabled),
      status: nextStatus || currentStatus?.status || 'idle',
      platform: asString(body.platform) || currentStatus?.platform,
      last_shared_at: asString(body.last_shared_at) || currentStatus?.last_shared_at,
      last_checked_at: asString(body.last_checked_at) || new Date().toISOString(),
      last_message: asString(body.last_message) || currentStatus?.last_message,
      last_error: body.last_error === null ? null : asString(body.last_error) || currentStatus?.last_error,
    },
  })

  return Response.json(status)
}
