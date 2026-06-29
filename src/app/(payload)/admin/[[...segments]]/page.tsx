import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'

type SearchParamsWithUndefined = Record<string, string | string[] | undefined>
type PayloadSearchParams = Record<string, string | string[]>

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<SearchParamsWithUndefined>
}

async function sanitizeSearchParams(
  searchParams: Promise<SearchParamsWithUndefined>,
): Promise<PayloadSearchParams> {
  const resolved = await searchParams
  const cleaned: PayloadSearchParams = {}

  for (const [key, value] of Object.entries(resolved)) {
    if (value !== undefined) cleaned[key] = value
  }

  return cleaned
}

export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({
    config,
    params,
    searchParams: sanitizeSearchParams(searchParams),
  })

export default function Page({ params, searchParams }: Args) {
  return RootPage({
    config,
    params,
    searchParams: sanitizeSearchParams(searchParams),
    importMap,
  })
}
