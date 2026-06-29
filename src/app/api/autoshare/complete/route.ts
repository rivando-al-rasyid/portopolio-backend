import config from '@payload-config'
import { getPayload } from 'payload'
import {
  asBoolean,
  asEntityType,
  asString,
  assertAutoshareSecret,
  readRequestBody,
  type EntityType,
} from '@/lib/autoshare'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CompleteBody = {
  success?: boolean | string | number
  platform?: string
  entity_type?: EntityType
  entity_id?: string
  title?: string
  shared_url?: string
  source_url?: string
  message?: string
  error?: string
}

export async function POST(request: Request) {
  const unauthorized = assertAutoshareSecret(request)
  if (unauthorized) return unauthorized

  const body = await readRequestBody<CompleteBody>(request)
  const platform = asString(body.platform)
  const entityType = asEntityType(body.entity_type)
  const entityId = asString(body.entity_id)
  const didSucceed = asBoolean(body.success)

  if (!platform) return Response.json({ error: 'platform is required' }, { status: 400 })
  if (!entityType) return Response.json({ error: 'entity_type must be blog or project' }, { status: 400 })
  if (!entityId) return Response.json({ error: 'entity_id is required' }, { status: 400 })

  const payload = await getPayload({ config })
  const now = new Date().toISOString()
  const currentStatus = await payload.findGlobal({
    slug: 'autoshare-status',
    overrideAccess: true,
  })

  if (!didSucceed) {
    const status = await payload.updateGlobal({
      slug: 'autoshare-status',
      overrideAccess: true,
      data: {
        is_enabled: Boolean(currentStatus?.is_enabled),
        status: 'failed',
        platform,
        last_checked_at: now,
        last_message: asString(body.message) || `Autoshare failed for ${entityType}.`,
        last_error: asString(body.error) || 'Unknown autoshare error.',
      },
    })

    return Response.json({ ok: false, status })
  }

  const sharedURL = asString(body.shared_url) || asString(body.source_url)
  if (!sharedURL) return Response.json({ error: 'shared_url or source_url is required' }, { status: 400 })

  const event = await payload.create({
    collection: 'share-events',
    overrideAccess: true,
    data: {
      entity_type: entityType,
      [entityType === 'blog' ? 'blog_post' : 'project']: entityId,
      platform,
      url: sharedURL,
      title: asString(body.title) || `Shared ${entityType}`,
      created_at: now,
    },
  })

  const status = await payload.updateGlobal({
    slug: 'autoshare-status',
    overrideAccess: true,
    data: {
      is_enabled: Boolean(currentStatus?.is_enabled),
      status: 'success',
      platform,
      last_checked_at: now,
      last_shared_at: now,
      last_message: asString(body.message) || `Autoshare completed for ${asString(body.title) || entityId}.`,
      last_error: null,
    },
  })

  return Response.json({ ok: true, event, status })
}
