import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'
import { formatSlug } from '@/lib/slugify'

export const Categories: CollectionConfig = {
  slug: 'categories',
  dbName: 'payload_categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.name) {
          data.slug = formatSlug(data.name)
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
  ],
}
