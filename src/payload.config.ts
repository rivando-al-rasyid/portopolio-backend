import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'

import { BlogPosts } from '@/collections/BlogPosts'
import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Projects } from '@/collections/Projects'
import { ShareEvents } from '@/collections/ShareEvents'
import { Users } from '@/collections/Users'
import { AutoshareStatus } from '@/globals/AutoshareStatus'
import { SiteSettings } from '@/globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const require = createRequire(import.meta.url)
const sharp = require('sharp')

function env(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback
}

function requiredRuntimeEnv(name: string): string {
  const value = env(name)

  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`${name} is required in production runtime.`)
  }

  return value
}

function uniqueOrigins(...origins: Array<string | undefined>): string[] {
  return Array.from(new Set(origins.map((origin) => origin?.trim()).filter(Boolean) as string[]))
}

const payloadServerURL = env(
  'PAYLOAD_PUBLIC_SERVER_URL',
  env('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),
)

const trustedOrigins = uniqueOrigins(payloadServerURL, process.env.FRONTEND_ORIGIN)

export default buildConfig({
  serverURL: payloadServerURL,
  cors: trustedOrigins,
  csrf: trustedOrigins,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, 'app', '(payload)', 'admin', 'importMap.js'),
    },
    meta: {
      titleSuffix: '- Portfolio CMS',
      icons: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          url: '/favicon.svg',
        },
      ],
    },
  },
  collections: [Users, Media, Categories, BlogPosts, Projects, ShareEvents],
  globals: [SiteSettings, AutoshareStatus],
  db: postgresAdapter({
    idType: 'uuid',
    pool: {
      connectionString: env('DATABASE_URL'),
    },
  }),
  secret: requiredRuntimeEnv('PAYLOAD_SECRET'),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
