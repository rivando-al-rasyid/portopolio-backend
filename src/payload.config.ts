import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import sharp from 'sharp'

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

const payloadServerURL =
  process.env.PAYLOAD_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const trustedOrigins = [payloadServerURL, process.env.FRONTEND_ORIGIN].filter(Boolean) as string[]

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
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
