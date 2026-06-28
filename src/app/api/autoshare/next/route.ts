import config from '@payload-config'
import { getPayload } from 'payload'

type EntityType = 'blog' | 'project'

type ShareEventDoc = {
  entity_type?: EntityType
  blog_post?: string | { id?: string } | null
  project?: string | { id?: string } | null
}

type BlogPostDoc = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  status?: string | null
  published_at?: string | null
  updatedAt?: string | null
  cover_image?: string | { id?: string; url?: string; alt?: string } | null
}

type ProjectDoc = {
  id: string
  title: string
  slug: string
  summary?: string | null
  content?: string | null
  status?: string | null
  updatedAt?: string | null
  image?: string | { id?: string; url?: string; alt?: string } | null
  demo_url?: string | null
  repo_url?: string | null
}

function assertAutoshareSecret(request: Request) {
  const expected = process.env.AUTOSHARE_WEBHOOK_SECRET
  const actual = request.headers.get('x-autoshare-secret')

  if (!expected || actual !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

function docId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in value && typeof value.id === 'string') return value.id
  return null
}

function absoluteUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return new URL(path, baseUrl).toString()
}

function assetUrl(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('url' in value)) return null
  if (typeof value.url !== 'string') return null
  return absoluteUrl(value.url)
}

function cleanText(value?: string | null, maxLength = 220) {
  const text = (value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}…`
}

function buildSocialText(input: {
  entityType: EntityType
  title: string
  description?: string | null
  url: string
}) {
  const label = input.entityType === 'blog' ? 'New blog post' : 'New project'
  const description = cleanText(input.description, 180)

  return [
    `${label}: ${input.title}`,
    description,
    input.url,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export async function GET(request: Request) {
  const unauthorized = assertAutoshareSecret(request)
  if (unauthorized) return unauthorized

  const url = new URL(request.url)
  const platform = url.searchParams.get('platform') || 'linkedin'
  const contentType = url.searchParams.get('type') || 'all'

  if (!['all', 'blog', 'project'].includes(contentType)) {
    return Response.json({ error: 'Invalid type. Use all, blog, or project.' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const status = await payload.findGlobal({ slug: 'autoshare-status', overrideAccess: true })
  const now = new Date().toISOString()

  if (!status?.is_enabled || status?.status === 'paused') {
    await payload.updateGlobal({
      slug: 'autoshare-status',
      overrideAccess: true,
      data: {
        is_enabled: Boolean(status?.is_enabled),
        status: status?.status === 'paused' ? 'paused' : 'idle',
        last_checked_at: now,
        last_message: status?.status === 'paused' ? 'Autoshare is paused.' : 'Autoshare is disabled.',
      },
    })

    return Response.json({
      shouldShare: false,
      reason: status?.status === 'paused' ? 'paused' : 'disabled',
    })
  }

  const shareEvents = await payload.find({
    collection: 'share-events',
    overrideAccess: true,
    depth: 0,
    limit: 1000,
    where: {
      platform: {
        equals: platform,
      },
    },
  })

  const sharedBlogIds = new Set<string>()
  const sharedProjectIds = new Set<string>()

  for (const event of shareEvents.docs as ShareEventDoc[]) {
    if (event.entity_type === 'blog') {
      const id = docId(event.blog_post)
      if (id) sharedBlogIds.add(id)
    }

    if (event.entity_type === 'project') {
      const id = docId(event.project)
      if (id) sharedProjectIds.add(id)
    }
  }

  const candidates: Array<{
    entityType: EntityType
    id: string
    title: string
    slug: string
    description?: string | null
    url: string
    image_url?: string | null
    sortDate?: string | null
    extra?: Record<string, unknown>
  }> = []

  if (contentType === 'all' || contentType === 'blog') {
    const posts = await payload.find({
      collection: 'blog-posts',
      overrideAccess: true,
      depth: 1,
      limit: 50,
      sort: 'published_at',
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    for (const post of posts.docs as BlogPostDoc[]) {
      if (sharedBlogIds.has(post.id)) continue

      candidates.push({
        entityType: 'blog',
        id: post.id,
        title: post.title,
        slug: post.slug,
        description: post.excerpt || cleanText(post.content, 220),
        url: absoluteUrl(`/blog/${post.slug}`),
        image_url: assetUrl(post.cover_image),
        sortDate: post.published_at || post.updatedAt,
      })
    }
  }

  if (contentType === 'all' || contentType === 'project') {
    const projects = await payload.find({
      collection: 'projects',
      overrideAccess: true,
      depth: 1,
      limit: 50,
      sort: 'updatedAt',
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    for (const project of projects.docs as ProjectDoc[]) {
      if (sharedProjectIds.has(project.id)) continue

      candidates.push({
        entityType: 'project',
        id: project.id,
        title: project.title,
        slug: project.slug,
        description: project.summary || cleanText(project.content, 220),
        url: absoluteUrl(`/projects/${project.slug}`),
        image_url: assetUrl(project.image),
        sortDate: project.updatedAt,
        extra: {
          demo_url: project.demo_url,
          repo_url: project.repo_url,
        },
      })
    }
  }

  candidates.sort((a, b) => {
    const left = a.sortDate ? new Date(a.sortDate).getTime() : 0
    const right = b.sortDate ? new Date(b.sortDate).getTime() : 0
    return left - right
  })

  const next = candidates[0]

  if (!next) {
    await payload.updateGlobal({
      slug: 'autoshare-status',
      overrideAccess: true,
      data: {
        is_enabled: Boolean(status?.is_enabled),
        status: 'idle',
        last_checked_at: now,
        last_message: `No unshared published content for ${platform}.`,
        last_error: null,
      },
    })

    return Response.json({
      shouldShare: false,
      reason: 'no_unshared_content',
      platform,
    })
  }

  await payload.updateGlobal({
    slug: 'autoshare-status',
    overrideAccess: true,
    data: {
      is_enabled: Boolean(status?.is_enabled),
      status: 'running',
      platform,
      last_checked_at: now,
      last_message: `Prepared ${next.entityType} for ${platform}: ${next.title}`,
      last_error: null,
    },
  })

  return Response.json({
    shouldShare: true,
    platform,
    item: {
      entity_type: next.entityType,
      entity_id: next.id,
      title: next.title,
      slug: next.slug,
      description: next.description,
      url: next.url,
      image_url: next.image_url,
      social_text: buildSocialText({
        entityType: next.entityType,
        title: next.title,
        description: next.description,
        url: next.url,
      }),
      ...next.extra,
    },
  })
}
