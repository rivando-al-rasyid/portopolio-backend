import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '@/lib/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  dbName: 'payload_site_settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
  },
  access: {
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'site_name',
      type: 'text',
      required: true,
      defaultValue: 'Portfolio Knowledge Graph',
    },
    {
      name: 'hero_badge',
      type: 'text',
      required: true,
      defaultValue: 'Payload CMS + Astro SSR + Postgres',
    },
    {
      name: 'hero_title',
      type: 'text',
      required: true,
      defaultValue: 'Portfolio that works like a knowledge graph.',
    },
    {
      name: 'hero_description',
      type: 'textarea',
      required: true,
      defaultValue:
        'Manage posts, projects, and categories in Payload CMS, then render them through a separate Astro SSR frontend.',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'primary_cta_label',
          type: 'text',
          required: true,
          defaultValue: 'View projects',
        },
        {
          name: 'primary_cta_href',
          type: 'text',
          required: true,
          defaultValue: '/projects',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'secondary_cta_label',
          type: 'text',
          required: true,
          defaultValue: 'Read posts',
        },
        {
          name: 'secondary_cta_href',
          type: 'text',
          required: true,
          defaultValue: '/blog',
        },
      ],
    },
  ],
}
