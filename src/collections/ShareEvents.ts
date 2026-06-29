import type { CollectionConfig } from 'payload'
import { authenticated, autoshareSecretOrAuthenticated } from '@/lib/access'

export const ShareEvents: CollectionConfig = {
  slug: 'share-events',
  dbName: 'payload_share_events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'entity_type', 'platform', 'created_at'],
    group: 'Automation',
  },
  access: {
    read: authenticated,
    create: autoshareSecretOrAuthenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'entity_type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Blog', value: 'blog' },
        { label: 'Project', value: 'project' },
      ],
    },
    {
      name: 'blog_post',
      type: 'relationship',
      relationTo: 'blog-posts',
      index: true,
      admin: {
        condition: (_, siblingData) => siblingData?.entity_type === 'blog',
      },
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      index: true,
      admin: {
        condition: (_, siblingData) => siblingData?.entity_type === 'project',
      },
    },
    {
      name: 'platform',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'url',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'created_at',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
