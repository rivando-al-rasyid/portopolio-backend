import type { Access } from 'payload'

export const anyone: Access = () => true

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true

  return {
    status: {
      equals: 'published',
    },
  }
}

export const autoshareSecretOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true

  const expected = process.env.AUTOSHARE_WEBHOOK_SECRET
  const header = req.headers?.get?.('x-autoshare-secret')

  return Boolean(expected && header && header === expected)
}
