const COMBINING_MARKS = /[\u0300-\u036f]/g
const NON_ALPHANUMERIC = /[^a-z0-9]+/g
const EDGE_DASHES = /^-+|-+$/g

export function formatSlug(value?: string | null): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(NON_ALPHANUMERIC, '-')
    .replace(EDGE_DASHES, '')
}
