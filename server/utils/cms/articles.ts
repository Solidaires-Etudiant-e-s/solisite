import type { CmsArticle } from '~~/lib/cms'
import { createArticleRevision } from './revisions'
import type { ArticleRecord } from './types'
import { runInCmsTransaction, useCmsDatabase } from './database'
import { notFound } from './http'
import { toArticle } from './mappers'
import { nowIso, resolveUniqueSlug } from './shared'

export function listArticles() {
  const records = useCmsDatabase().query(`
    SELECT id, slug, title, excerpt, content, cover_image, published_at, updated_at
    FROM articles
    ORDER BY published_at DESC, id DESC
  `).all() as ArticleRecord[]

  return records.map(toArticle)
}

export function getArticleById(id: number) {
  const record = useCmsDatabase().query(`
    SELECT id, slug, title, excerpt, content, cover_image, published_at, updated_at
    FROM articles
    WHERE id = $id
  `).get({ id }) as ArticleRecord | null

  return record ? toArticle(record) : null
}

export function getArticleBySlug(slug: string) {
  const record = useCmsDatabase().query(`
    SELECT id, slug, title, excerpt, content, cover_image, published_at, updated_at
    FROM articles
    WHERE slug = $slug
  `).get({ slug }) as ArticleRecord | null

  return record ? toArticle(record) : null
}

function getUniqueArticleSlug(baseTitle: string, currentId?: number) {
  const database = useCmsDatabase()
  return resolveUniqueSlug(
    baseTitle,
    'article',
    slug => (database.query<{ id: number }>('SELECT id FROM articles WHERE slug = $slug').get({ slug })?.id ?? null),
    currentId
  )
}

export function createArticle() {
  return runInCmsTransaction(() => {
    const timestamp = nowIso()
    const title = `Nouvel article ${new Date().toLocaleDateString('fr-FR')}`
    const slug = getUniqueArticleSlug(title)

    useCmsDatabase().query(`
      INSERT INTO articles (slug, title, excerpt, content, cover_image, published_at, updated_at)
      VALUES ($slug, $title, $excerpt, $content, $coverImage, $publishedAt, $updatedAt)
    `).run({
      slug,
      title,
      excerpt: 'Rédige un court résumé pour l’affichage dans la liste des articles.',
      content: '<p>Commence à écrire ici.</p>',
      coverImage: '/hero.jpg',
      publishedAt: timestamp,
      updatedAt: timestamp
    })

    const created = useCmsDatabase().query('SELECT last_insert_rowid() as id').get() as { id: number }
    const article = getArticleById(created.id)

    if (!article) {
      notFound(`Article "${created.id}" not found.`)
    }

    return article
  })
}

interface UpdateArticleOptions {
  skipRevision?: boolean
}

function normalizeArticleUpdate(current: CmsArticle, input: Partial<CmsArticle>): CmsArticle {
  const title = (input.title || current.title).trim() || current.title

  return {
    ...current,
    ...input,
    id: current.id,
    title,
    slug: getUniqueArticleSlug(input.slug?.trim() || title, current.id),
    excerpt: (input.excerpt ?? current.excerpt).trim(),
    content: input.content ?? current.content,
    coverImage: input.coverImage ?? current.coverImage,
    publishedAt: input.publishedAt ?? current.publishedAt,
    updatedAt: nowIso()
  }
}

export function updateArticle(id: number, input: Partial<CmsArticle>, options: UpdateArticleOptions = {}) {
  return runInCmsTransaction(() => {
    const current = getArticleById(id)

    if (!current) {
      notFound(`Article "${id}" not found.`)
    }

    const updated = normalizeArticleUpdate(current, input)

    useCmsDatabase().query(`
      UPDATE articles
      SET slug = $slug,
          title = $title,
          excerpt = $excerpt,
          content = $content,
          cover_image = $coverImage,
          published_at = $publishedAt,
          updated_at = $updatedAt
      WHERE id = $id
    `).run({
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      excerpt: updated.excerpt,
      content: updated.content,
      coverImage: updated.coverImage,
      publishedAt: updated.publishedAt,
      updatedAt: updated.updatedAt
    })

    const savedArticle = getArticleById(id)

    if (!savedArticle) {
      notFound(`Article "${id}" not found.`)
    }

    if (!options.skipRevision) {
      createArticleRevision(savedArticle)
    }

    return savedArticle
  })
}
