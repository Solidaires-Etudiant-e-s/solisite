import type { Prisma } from '@prisma/client'
import type { CmsGuide } from '~~/lib/cms'
import { createGuideRevision } from './revisions'
import type { GuideRecord } from './types'
import { runInCmsTransaction, useCmsDatabase } from './database'
import { notFound } from './http'
import { toGuide } from './mappers'
import { nowIso, resolveUniqueSlug } from './shared'

type CmsDatabaseClient = Prisma.TransactionClient | Awaited<ReturnType<typeof useCmsDatabase>>

export async function listGuides(database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const records = await client.guide.findMany({
    orderBy: [
      { publishedAt: 'desc' },
      { id: 'desc' }
    ]
  }) as GuideRecord[]

  return records.map(toGuide)
}

export async function getGuideById(id: number, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const record = await client.guide.findUnique({
    where: { id }
  }) as GuideRecord | null

  return record ? toGuide(record) : null
}

export async function getGuideBySlug(slug: string, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const record = await client.guide.findUnique({
    where: { slug }
  }) as GuideRecord | null

  return record ? toGuide(record) : null
}

async function getUniqueGuideSlug(baseTitle: string, currentId?: number, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()

  return await resolveUniqueSlug(
    baseTitle,
    'guide',
    async (slug) => {
      const existing = await client.guide.findUnique({
        where: { slug },
        select: { id: true }
      })

      return existing?.id ?? null
    },
    currentId
  )
}

export async function createGuide() {
  return await runInCmsTransaction(async (database) => {
    const timestamp = nowIso()
    const title = `Nouveau guide ${new Date().toLocaleDateString('fr-FR')}`
    const slug = await getUniqueGuideSlug(title, undefined, database)

    const created = await database.guide.create({
      data: {
        slug,
        title,
        excerpt: 'Rédige un court résumé pour l’affichage dans la liste des guides.',
        content: '<p>Commence à écrire ici.</p>',
        coverImage: '/hero.jpg',
        pdfFile: '',
        publishedAt: timestamp,
        updatedAt: timestamp
      }
    })

    const guide = await getGuideById(created.id, database)

    if (!guide) {
      notFound(`Guide "${created.id}" not found.`)
    }

    return guide
  })
}

interface UpdateGuideOptions {
  skipRevision?: boolean
}

async function normalizeGuideUpdate(current: CmsGuide, input: Partial<CmsGuide>, database?: CmsDatabaseClient): Promise<CmsGuide> {
  const title = (input.title || current.title).trim() || current.title

  return {
    ...current,
    ...input,
    id: current.id,
    title,
    slug: await getUniqueGuideSlug(input.slug?.trim() || title, current.id, database),
    excerpt: (input.excerpt ?? current.excerpt).trim(),
    content: input.content ?? current.content,
    coverImage: input.coverImage ?? current.coverImage,
    pdfFile: input.pdfFile ?? current.pdfFile,
    publishedAt: input.publishedAt ?? current.publishedAt,
    updatedAt: nowIso()
  }
}

export async function updateGuide(id: number, input: Partial<CmsGuide>, options: UpdateGuideOptions = {}) {
  return await runInCmsTransaction(async (database) => {
    const current = await getGuideById(id, database)

    if (!current) {
      notFound(`Guide "${id}" not found.`)
    }

    const updated = await normalizeGuideUpdate(current, input, database)

    await database.guide.update({
      where: { id: updated.id },
      data: {
        slug: updated.slug,
        title: updated.title,
        excerpt: updated.excerpt,
        content: updated.content,
        coverImage: updated.coverImage,
        pdfFile: updated.pdfFile,
        publishedAt: updated.publishedAt,
        updatedAt: updated.updatedAt
      }
    })

    const savedGuide = await getGuideById(id, database)

    if (!savedGuide) {
      notFound(`Guide "${id}" not found.`)
    }

    if (!options.skipRevision) {
      await createGuideRevision(savedGuide, 'save', undefined, database)
    }

    return savedGuide
  })
}
