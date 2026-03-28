import type { Database } from 'bun:sqlite'
import { slugify } from '~~/lib/cms'

export { slugify } from '~~/lib/cms'

export const defaultArticle = {
  title: 'Launching the custom CMS',
  excerpt: 'The Directus layer is gone. Content now lives directly in SQLite.',
  content: '<p>This first article confirms the new content flow: Nuxt UI editor, SQLite persistence, and shared preview components.</p><p>Keep the model small, keep the UI clear, and expand only when the content model truly needs it.</p>',
  coverImage: '/hero.jpg'
}

export function nowIso() {
  return new Date().toISOString()
}

export function hasTableColumn(database: Database, table: string, column: string) {
  return database
    .query<{ name: string }>(`PRAGMA table_info(${table})`)
    .all()
    .some(entry => entry.name === column)
}

export function resolveUniqueSlug(baseValue: string, fallback: string, findExistingId: (slug: string) => number | null, currentId?: number) {
  const baseSlug = slugify(baseValue) || fallback
  let slug = baseSlug
  let index = 1

  while (true) {
    const existingId = findExistingId(slug)

    if (existingId === null || existingId === currentId) {
      return slug
    }

    index += 1
    slug = `${baseSlug}-${index}`
  }
}
