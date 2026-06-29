import type { Access } from 'payload'

export const anyone: Access = () => true

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const publishedOrAuthenticated: Access = ({ req }) =>
  req.user
    ? true
    : {
        status: {
          equals: 'published',
        },
      }

export const autoshareSecretOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true

  const expected = process.env.AUTOSHARE_WEBHOOK_SECRET?.trim()
  const actual = req.headers?.get?.('x-autoshare-secret')?.trim()

  return Boolean(expected && actual && actual === expected)
}
