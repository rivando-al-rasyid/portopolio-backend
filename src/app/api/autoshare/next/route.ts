import config from '@payload-config'
import { getPayload } from 'payload'
import {
  absoluteUrl,
  asContentFilter,
  assetUrl,
  assertAutoshareSecret,
  candidateLimit,
  cleanText,
  docId,
  type ContentFilter,
  type EntityType,
} from '@/lib/autoshare'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  updatedAt?: string | null
  image?: string | { id?: string; url?: string; alt?: string } | null
  demo_url?: string | null
  repo_url?: string | null
}

type Candidate = {
  entityType: EntityType
  id: string
  title: string
  slug: string
  description: string
  url: string
  image_url: string | null
  sortDate?: string | null
  extra?: Record<string, string | null | undefined>
}

function buildSocialText(input: Pick<Candidate, 'entityType' | 'title' | 'description' | 'url'>): string {
  const label = input.entityType === 'blog' ? 'New blog post' : 'New project'
  return [`${label}: ${input.title}`, cleanText(input.description, 180), input.url]
    .filter(Boolean)
    .join('\n\n')
}

function oldestFirst(left?: string | null, right?: string | null): number {
  const leftTime = left ? new Date(left).getTime() : 0
  const rightTime = right ? new Date(right).getTime() : 0
  return leftTime - rightTime
}

function shouldFetchBlog(contentFilter: ContentFilter): boolean {
  return contentFilter === 'all' || contentFilter === 'blog'
}

function shouldFetchProject(contentFilter: ContentFilter): boolean {
  return contentFilter === 'all' || contentFilter === 'project'
}

export async function GET(request: Request) {
  const unauthorized = assertAutoshareSecret(request)
  if (unauthorized) return unauthorized

  const url = new URL(request.url)
  const platform = url.searchParams.get('platform')?.trim() || 'linkedin'
  const contentFilter = asContentFilter(url.searchParams.get('type') || 'all')

  if (!contentFilter) {
    return Response.json({ error: 'Invalid type. Use all, blog, or project.' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const status = await payload.findGlobal({ slug: 'autoshare-status', overrideAccess: true })
  const now = new Date().toISOString()

  if (!status?.is_enabled || status?.status === 'paused') {
    const reason = status?.status === 'paused' ? 'paused' : 'disabled'

    await payload.updateGlobal({
      slug: 'autoshare-status',
      overrideAccess: true,
      data: {
        is_enabled: Boolean(status?.is_enabled),
        status: reason === 'paused' ? 'paused' : 'idle',
        last_checked_at: now,
        last_message: reason === 'paused' ? 'Autoshare is paused.' : 'Autoshare is disabled.',
      },
    })

    return Response.json({ shouldShare: false, reason })
  }

  const limit = candidateLimit()
  const [postsResult, projectsResult] = await Promise.all([
    shouldFetchBlog(contentFilter)
      ? payload.find({
          collection: 'blog-posts',
          overrideAccess: true,
          depth: 1,
          limit,
          sort: 'published_at',
          where: {
            status: {
              equals: 'published',
            },
          },
        })
      : Promise.resolve({ docs: [] }),
    shouldFetchProject(contentFilter)
      ? payload.find({
          collection: 'projects',
          overrideAccess: true,
          depth: 1,
          limit,
          sort: 'updatedAt',
          where: {
            status: {
              equals: 'published',
            },
          },
        })
      : Promise.resolve({ docs: [] }),
  ])

  const posts = postsResult.docs as BlogPostDoc[]
  const projects = projectsResult.docs as ProjectDoc[]
  const postIds = posts.map((post) => post.id)
  const projectIds = projects.map((project) => project.id)

  const [blogShareEvents, projectShareEvents] = await Promise.all([
    postIds.length
      ? payload.find({
          collection: 'share-events',
          overrideAccess: true,
          depth: 0,
          limit: postIds.length,
          pagination: false,
          where: {
            and: [
              { platform: { equals: platform } },
              { entity_type: { equals: 'blog' } },
              { blog_post: { in: postIds } },
            ],
          },
        })
      : Promise.resolve({ docs: [] }),
    projectIds.length
      ? payload.find({
          collection: 'share-events',
          overrideAccess: true,
          depth: 0,
          limit: projectIds.length,
          pagination: false,
          where: {
            and: [
              { platform: { equals: platform } },
              { entity_type: { equals: 'project' } },
              { project: { in: projectIds } },
            ],
          },
        })
      : Promise.resolve({ docs: [] }),
  ])

  const sharedBlogIds = new Set(
    (blogShareEvents.docs as ShareEventDoc[]).map((event) => docId(event.blog_post)).filter(Boolean),
  )
  const sharedProjectIds = new Set(
    (projectShareEvents.docs as ShareEventDoc[]).map((event) => docId(event.project)).filter(Boolean),
  )

  const candidates: Candidate[] = [
    ...posts
      .filter((post) => !sharedBlogIds.has(post.id))
      .map((post) => ({
        entityType: 'blog' as const,
        id: post.id,
        title: post.title,
        slug: post.slug,
        description: post.excerpt || cleanText(post.content, 220),
        url: absoluteUrl(`/blog/${post.slug}`),
        image_url: assetUrl(post.cover_image),
        sortDate: post.published_at || post.updatedAt,
      })),
    ...projects
      .filter((project) => !sharedProjectIds.has(project.id))
      .map((project) => ({
        entityType: 'project' as const,
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
      })),
  ].sort((left, right) => oldestFirst(left.sortDate, right.sortDate))

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
      social_text: buildSocialText(next),
      ...next.extra,
    },
  })
}
