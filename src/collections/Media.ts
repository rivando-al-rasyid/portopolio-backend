import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  dbName: 'payload_media',
  admin: {
    useAsTitle: 'alt',
    group: 'Content',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 320,
        height: 240,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 432,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1600,
        height: 900,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Short description for accessibility and SEO.',
      },
    },
  ],
}
