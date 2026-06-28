import config from '@payload-config'
import { getPayload } from 'payload'

type EntityType = 'blog' | 'project'

type CompleteBody = {
  success?: boolean | string
  platform?: string
  entity_type?: EntityType
  entity_id?: string
  title?: string
  shared_url?: string
  source_url?: string
  message?: string
  error?: string
}

function assertAutoshareSecret(request: Request) {
  const expected = process.env.AUTOSHARE_WEBHOOK_SECRET
  const actual = request.headers.get('x-autoshare-secret')

  if (!expected || actual !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

function isEntityType(value: unknown): value is EntityType {
  return value === 'blog' || value === 'project'
}

async function readRequestBody(request: Request): Promise<CompleteBody> {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return (await request.json()) as CompleteBody
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const formData = await request.formData()
    return Object.fromEntries(formData.entries()) as CompleteBody
  }

  try {
    return (await request.json()) as CompleteBody
  } catch {
    const formData = await request.formData()
    return Object.fromEntries(formData.entries()) as CompleteBody
  }
}

export async function POST(request: Request) {
  const unauthorized = assertAutoshareSecret(request)
  if (unauthorized) return unauthorized

  const body = await readRequestBody(request)
  const payload = await getPayload({ config })
  const now = new Date().toISOString()

  if (!body.platform) {
    return Response.json({ error: 'platform is required' }, { status: 400 })
  }

  if (!isEntityType(body.entity_type)) {
    return Response.json({ error: 'entity_type must be blog or project' }, { status: 400 })
  }

  if (!body.entity_id) {
    return Response.json({ error: 'entity_id is required' }, { status: 400 })
  }

  const currentStatus = await payload.findGlobal({ slug: 'autoshare-status', overrideAccess: true })

  const didSucceed = body.success === true || body.success === 'true'

  if (!didSucceed) {
    const status = await payload.updateGlobal({
      slug: 'autoshare-status',
      overrideAccess: true,
      data: {
        is_enabled: Boolean(currentStatus?.is_enabled),
        status: 'failed',
        platform: body.platform,
        last_checked_at: now,
        last_message: body.message || `Autoshare failed for ${body.entity_type}.`,
        last_error: body.error || 'Unknown autoshare error.',
      },
    })

    return Response.json({
      ok: false,
      status,
    })
  }

  const eventData: Record<string, unknown> = {
    entity_type: body.entity_type,
    platform: body.platform,
    url: body.shared_url || body.source_url || '',
    title: body.title || `Shared ${body.entity_type}`,
    created_at: now,
  }

  if (body.entity_type === 'blog') {
    eventData.blog_post = body.entity_id
  } else {
    eventData.project = body.entity_id
  }

  const event = await payload.create({
    collection: 'share-events',
    overrideAccess: true,
    data: eventData,
  })

  const status = await payload.updateGlobal({
    slug: 'autoshare-status',
    overrideAccess: true,
    data: {
      is_enabled: Boolean(currentStatus?.is_enabled),
      status: 'success',
      platform: body.platform,
      last_checked_at: now,
      last_shared_at: now,
      last_message: body.message || `Autoshare completed for ${body.title || body.entity_id}.`,
      last_error: null,
    },
  })

  return Response.json({
    ok: true,
    event,
    status,
  })
}
