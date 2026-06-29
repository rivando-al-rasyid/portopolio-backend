import type { CollectionConfig } from 'payload'
import { authenticated, publishedOrAuthenticated } from '@/lib/access'
import { formatSlug } from '@/lib/slugify'

export const Projects: CollectionConfig = {
  slug: 'projects',
  dbName: 'payload_projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'is_featured', 'sort_order', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => (data ? { ...data, slug: data.slug || formatSlug(data.title) } : data),
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
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
            {
              name: 'summary',
              type: 'textarea',
            },
            {
              name: 'content',
              type: 'textarea',
              required: true,
              defaultValue: '',
              admin: {
                rows: 18,
              },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
        {
          label: 'Links',
          fields: [
            {
              name: 'demo_url',
              type: 'text',
            },
            {
              name: 'repo_url',
              type: 'text',
            },
            {
              name: 'source_url',
              type: 'text',
            },
          ],
        },
        {
          label: 'Publishing',
          fields: [
            {
              name: 'status',
              type: 'select',
              required: true,
              defaultValue: 'draft',
              index: true,
              options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Published', value: 'published' },
              ],
            },
            {
              name: 'is_featured',
              type: 'checkbox',
              defaultValue: false,
              index: true,
            },
            {
              name: 'sort_order',
              type: 'number',
              defaultValue: 100,
              required: true,
              index: true,
            },
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
            },
            {
              name: 'content_source',
              type: 'select',
              required: true,
              defaultValue: 'manual',
              options: [
                { label: 'Manual', value: 'manual' },
                { label: 'GitHub README', value: 'github_readme' },
                { label: 'Markdown URL', value: 'markdown_url' },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'meta_title',
              type: 'text',
            },
            {
              name: 'meta_description',
              type: 'textarea',
            },
          ],
        },
      ],
    },
  ],
}
