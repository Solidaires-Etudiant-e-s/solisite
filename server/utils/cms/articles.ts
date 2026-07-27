import type { Prisma } from '@prisma/client'
import type { CmsArticle, CmsTag } from '~~/lib/cms'
import { createArticleRevision } from './revisions'
import type { ArticleRecord, ArticleTagRecord, TagRecord } from './types'
import { runInCmsTransaction, useCmsDatabase } from './database'
import { notFound } from './http'
import { toArticle } from './mappers'
import { nowIso, resolveUniqueSlug, slugify } from './shared'

type CmsDatabaseClient = Prisma.TransactionClient | Awaited<ReturnType<typeof useCmsDatabase>>

function normalizeTags(tags: CmsTag[] | null | undefined): { name: string; slug: string }[] {
  if (!tags) {
    return []
  }

  return tags
    .filter(tag => tag.name.trim() || tag.slug.trim())
    .map(tag => ({
      name: tag.name.trim(),
      slug: slugify(tag.name.trim() || tag.slug.trim())
    }))
    .filter(tag => tag.name && tag.slug)
}

async function syncArticleTags(
  articleId: number,
  inputTags: CmsTag[] | null | undefined,
  database: CmsDatabaseClient
) {
  const normalized = normalizeTags(inputTags)

  const existing = await database.articleTag.findMany({
    where: { articleId },
    select: { tagId: true }
  })

  const existingTagIds = existing.map(e => e.tagId)
  const newTagSlugs = normalized.map(t => t.slug)

  const matchingTags = await database.tag.findMany({
    where: { slug: { in: newTagSlugs } }
  })

  const matchedTagIds = matchingTags.map(t => t.id)
  const tagsToCreate = normalized.filter(t => !matchingTags.some(mt => mt.slug === t.slug))

  for (const tag of tagsToCreate) {
    const created = await database.tag.create({
      data: { name: tag.name, slug: tag.slug }
    })
    matchedTagIds.push(created.id)
  }

  const tagsToRemove = existingTagIds.filter(id => !matchedTagIds.includes(id))

  if (tagsToRemove.length) {
    await database.articleTag.deleteMany({
      where: {
        articleId,
        tagId: { in: tagsToRemove }
      }
    })
  }

  const tagsToAdd = matchedTagIds.filter(id => !existingTagIds.includes(id))

  for (const tagId of tagsToAdd) {
    await database.articleTag.create({
      data: { articleId, tagId }
    })
  }
}

export async function listArticles(database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const records = await client.article.findMany({
    orderBy: [
      { publishedAt: 'desc' },
      { id: 'desc' }
    ],
    include: { articleTags: { include: { tag: true } } }
  }) as (ArticleRecord & { articleTags: Array<ArticleTagRecord & { tag: TagRecord }> })[]

  return records.map(record => toArticle(record, record.articleTags.map(at => at.tag)))
}

export async function getArticleById(id: number, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const record = await client.article.findUnique({
    where: { id },
    include: { articleTags: { include: { tag: true } } }
  }) as (ArticleRecord & { articleTags: Array<ArticleTagRecord & { tag: TagRecord }> }) | null

  return record ? toArticle(record, record.articleTags.map(at => at.tag)) : null
}

export async function getArticleBySlug(slug: string, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const record = await client.article.findUnique({
    where: { slug },
    include: { articleTags: { include: { tag: true } } }
  }) as (ArticleRecord & { articleTags: Array<ArticleTagRecord & { tag: TagRecord }> }) | null

  return record ? toArticle(record, record.articleTags.map(at => at.tag)) : null
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

export async function createArticle(tags?: CmsTag[]) {
  return await runInCmsTransaction(async (database) => {
    const timestamp = nowIso()
    const title = `Nouvel article ${new Date().toLocaleDateString('fr-FR')}`
    const slug = await getUniqueArticleSlug(title, undefined, database)

    const created = await database.article.create({
      data: {
        slug,
        title,
        excerpt: 'Rédige un court résumé pour l\'affichage dans la liste des articles.',
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

    if (tags && tags.length > 0) {
      await syncArticleTags(created.id, tags, database)
    }

    const savedArticle = await getArticleById(created.id, database)

    if (!savedArticle) {
      notFound(`Article "${created.id}" not found.`)
    }

    return savedArticle
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
    updatedAt: nowIso(),
    tags: input.tags ?? current.tags
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

    if (input.tags !== undefined) {
      await syncArticleTags(id, input.tags, database)
    }

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

export async function deleteArticle(id: number) {
  return await runInCmsTransaction(async (database) => {
    const current = await getArticleById(id, database)

    if (!current) {
      notFound(`Article "${id}" not found.`)
    }

    await database.article.delete({
      where: { id }
    })

    return { id }
  })
}