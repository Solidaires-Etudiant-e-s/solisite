import { slugify } from '~~/lib/cms'

export { slugify } from '~~/lib/cms'

export const defaultArticle = {
  title: 'Launching the custom CMS',
  excerpt: 'The Directus layer is gone. Content now lives directly in SQLite.',
  content: '<p>This first article confirms the new content flow: Nuxt UI editor, SQLite persistence, and shared preview components.</p><p>Keep the model small, keep the UI clear, and expand only when the content model truly needs it.</p>',
  coverImage: '/hero.jpg'
}

export const defaultGuide = {
  title: 'Guide de bienvenue',
  excerpt: 'Ajoute ici un court résumé du guide et rattache ensuite le PDF à télécharger.',
  content: '<p>Présente ici le contenu du guide, son contexte et ce que l’on y trouve avant le téléchargement.</p>',
  coverImage: '/hero.jpg',
  pdfFile: ''
}

export function nowIso() {
  return new Date().toISOString()
}

export async function resolveUniqueSlug(
  baseValue: string,
  fallback: string,
  findExistingId: (slug: string) => Promise<number | null>,
  currentId?: number
) {
  const baseSlug = slugify(baseValue) || fallback
  let slug = baseSlug
  let index = 1

  while (true) {
    const existingId = await findExistingId(slug)

    if (existingId === null || existingId === currentId) {
      return slug
    }

    index += 1
    slug = `${baseSlug}-${index}`
  }
}
