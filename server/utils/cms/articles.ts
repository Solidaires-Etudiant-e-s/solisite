import type { Prisma } from '@prisma/client'
import type { CmsArticle } from '~~/lib/cms'
import { createArticleRevision } from './revisions'
import type { ArticleRecord } from './types'
import { runInCmsTransaction, useCmsDatabase } from './database'
import { notFound } from './http'
import { toArticle } from './mappers'
import { nowIso, resolveUniqueSlug } from './shared'

type CmsDatabaseClient = Prisma.TransactionClient | Awaited<ReturnType<typeof useCmsDatabase>>

export async function listArticles(database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const records = await client.article.findMany({
    orderBy: [
      { publishedAt: 'desc' },
      { id: 'desc' }
    ]
  }) as ArticleRecord[]

  return records.map(toArticle)
}

export async function getArticleById(id: number, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const record = await client.article.findUnique({
    where: { id }
  }) as ArticleRecord | null

  return record ? toArticle(record) : null
}

export async function getArticleBySlug(slug: string, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const record = await client.article.findUnique({
    where: { slug }
  }) as ArticleRecord | null

  return record ? toArticle(record) : null
}

async function getUniqueArticleSlug(baseTitle: string, currentId?: number, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()

  return await resolveUniqueSlug(
    baseTitle,
    'article',
    async (slug) => {
      const existing = await client.article.findUnique({
        where: { slug },
        select: { id: true }
      })

      return existing?.id ?? null
    },
    currentId
  )
}

export async function createArticle() {
  return await runInCmsTransaction(async (database) => {
    const timestamp = nowIso()
    const title = `Nouvel article ${new Date().toLocaleDateString('fr-FR')}`
    const slug = await getUniqueArticleSlug(title, undefined, database)

    const created = await database.article.create({
      data: {
        slug,
        title,
        excerpt: 'Rédige un court résumé pour l’affichage dans la liste des articles.',
        content: '<p>Commence à écrire ici.</p>',
        coverImage: '/hero.jpg',
        publishedAt: timestamp,
        updatedAt: timestamp
      }
    })

    const article = await getArticleById(created.id, database)

    if (!article) {
      notFound(`Article "${created.id}" not found.`)
    }

    return article
  })
}

interface UpdateArticleOptions {
  skipRevision?: boolean
}

async function normalizeArticleUpdate(current: CmsArticle, input: Partial<CmsArticle>, database?: CmsDatabaseClient): Promise<CmsArticle> {
  const title = (input.title || current.title).trim() || current.title

  return {
    ...current,
    ...input,
    id: current.id,
    title,
    slug: await getUniqueArticleSlug(input.slug?.trim() || title, current.id, database),
    excerpt: (input.excerpt ?? current.excerpt).trim(),
    content: input.content ?? current.content,
    coverImage: input.coverImage ?? current.coverImage,
    publishedAt: input.publishedAt ?? current.publishedAt,
    updatedAt: nowIso()
  }
}

export async function updateArticle(id: number, input: Partial<CmsArticle>, options: UpdateArticleOptions = {}) {
  return await runInCmsTransaction(async (database) => {
    const current = await getArticleById(id, database)

    if (!current) {
      notFound(`Article "${id}" not found.`)
    }

    const updated = await normalizeArticleUpdate(current, input, database)

    await database.article.update({
      where: { id: updated.id },
      data: {
        slug: updated.slug,
        title: updated.title,
        excerpt: updated.excerpt,
        content: updated.content,
        coverImage: updated.coverImage,
        publishedAt: updated.publishedAt,
        updatedAt: updated.updatedAt
      }
    })

    const savedArticle = await getArticleById(id, database)

    if (!savedArticle) {
      notFound(`Article "${id}" not found.`)
    }

    if (!options.skipRevision) {
      await createArticleRevision(savedArticle, 'save', undefined, database)
    }

    return savedArticle
  })
}
