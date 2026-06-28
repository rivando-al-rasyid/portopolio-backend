import type { CollectionConfig } from 'payload'
import { authenticated } from '@/lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  dbName: 'payload_users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'System',
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}
