import type { GlobalConfig } from 'payload'
import { authenticated, autoshareSecretOrAuthenticated } from '@/lib/access'

export const AutoshareStatus: GlobalConfig = {
  slug: 'autoshare-status',
  dbName: 'payload_autoshare_status',
  label: 'Autoshare Status',
  admin: {
    group: 'Automation',
  },
  access: {
    read: authenticated,
    update: autoshareSecretOrAuthenticated,
  },
  fields: [
    {
      name: 'is_enabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Enabled',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'idle',
      options: [
        { label: 'Idle', value: 'idle' },
        { label: 'Running', value: 'running' },
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
        { label: 'Paused', value: 'paused' },
      ],
    },
    {
      name: 'platform',
      type: 'text',
    },
    {
      name: 'last_shared_at',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'last_checked_at',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'last_message',
      type: 'textarea',
    },
    {
      name: 'last_error',
      type: 'textarea',
    },
  ],
}
