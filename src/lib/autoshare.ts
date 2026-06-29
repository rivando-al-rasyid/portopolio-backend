export type EntityType = 'blog' | 'project'
export type ContentFilter = EntityType | 'all'
export type AutoshareStatusValue = 'idle' | 'running' | 'success' | 'failed' | 'paused'

const CONTENT_FILTERS = new Set<ContentFilter>(['all', 'blog', 'project'])
const AUTOSHARE_STATUSES = new Set<AutoshareStatusValue>([
  'idle',
  'running',
  'success',
  'failed',
  'paused',
])

export function assertAutoshareSecret(request: Request): Response | null {
  const expected = process.env.AUTOSHARE_WEBHOOK_SECRET?.trim()
  const actual = request.headers.get('x-autoshare-secret')?.trim()

  if (!expected || actual !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function readRequestBody<T extends Record<string, unknown>>(
  request: Request,
): Promise<T> {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return (await request.json()) as T
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const formData = await request.formData()
    return Object.fromEntries(formData.entries()) as T
  }

  try {
    return (await request.json()) as T
  } catch {
    const formData = await request.formData()
    return Object.fromEntries(formData.entries()) as T
  }
}

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function asBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1' || value === 1
}

export function asContentFilter(value: unknown): ContentFilter | null {
  return typeof value === 'string' && CONTENT_FILTERS.has(value as ContentFilter)
    ? (value as ContentFilter)
    : null
}

export function asEntityType(value: unknown): EntityType | null {
  return value === 'blog' || value === 'project' ? value : null
}

export function asAutoshareStatus(value: unknown): AutoshareStatusValue | undefined {
  return typeof value === 'string' && AUTOSHARE_STATUSES.has(value as AutoshareStatusValue)
    ? (value as AutoshareStatusValue)
    : undefined
}

export function absoluteUrl(path: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
  return new URL(path, baseUrl).toString()
}

export function assetUrl(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('url' in value)) return null
  return typeof value.url === 'string' ? absoluteUrl(value.url) : null
}

export function cleanText(value?: string | null, maxLength = 220): string {
  const text = (value || '').replace(/\s+/g, ' ').trim()
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trim()}…`
}

export function docId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in value && typeof value.id === 'string') return value.id
  return null
}

export function candidateLimit(): number {
  const configured = Number(process.env.AUTOSHARE_CANDIDATE_LIMIT || 50)
  if (!Number.isFinite(configured)) return 50
  return Math.max(1, Math.min(Math.trunc(configured), 100))
}
