import type { CollectionConfig } from 'payload'
import { authenticated, publishedOrAuthenticated } from '@/lib/access'
import { formatSlug } from '@/lib/slugify'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  dbName: 'payload_blog_posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'is_featured', 'sort_order', 'published_at'],
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
      ({ data }) => {
        if (data && !data.slug && data.title) {
          data.slug = formatSlug(data.title)
        }

        if (data?.status === 'published' && !data.published_at) {
          data.published_at = new Date().toISOString()
        }

        return data
      },
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
              name: 'excerpt',
              type: 'textarea',
            },
            {
              name: 'content',
              type: 'textarea',
              required: true,
              defaultValue: '',
              admin: {
                rows: 18,
                description: 'Markdown/plain text content. Kept simple to match the previous database shape.',
              },
            },
            {
              name: 'cover_image',
              type: 'upload',
              relationTo: 'media',
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
              options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Published', value: 'published' },
              ],
            },
            {
              name: 'published_at',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
            {
              name: 'is_featured',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'sort_order',
              type: 'number',
              defaultValue: 100,
              required: true,
            },
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
            },
          ],
        },
        {
          label: 'Source',
          fields: [
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
            {
              name: 'source_url',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.content_source !== 'manual',
              },
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
            {
              name: 'canonical_url',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
