import type { Prisma } from '@prisma/client'
import type { CmsPage } from '~~/lib/cms'
import { createPageRevision } from './revisions'
import type { PageRecord } from './types'
import { runInCmsTransaction, useCmsDatabase } from './database'
import { notFound } from './http'
import { toPage } from './mappers'
import { nowIso } from './shared'

type CmsDatabaseClient = Prisma.TransactionClient | Awaited<ReturnType<typeof useCmsDatabase>>

export async function listPages(database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const records = await client.page.findMany({
    orderBy: { name: 'asc' }
  }) as PageRecord[]

  return records.map(toPage)
}

export async function getPage(slug: string, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const record = await client.page.findUnique({
    where: { slug }
  }) as PageRecord | null

  return record ? toPage(record) : null
}

interface UpdatePageOptions {
  skipRevision?: boolean
}

function normalizePageUpdate(current: CmsPage, input: Partial<CmsPage>): CmsPage {
  return {
    ...current,
    ...input,
    slug: current.slug,
    name: current.name,
    content: input.content ?? current.content,
    updatedAt: nowIso()
  }
}

export async function updatePage(slug: string, input: Partial<CmsPage>, options: UpdatePageOptions = {}) {
  return await runInCmsTransaction(async (database) => {
    const current = await getPage(slug, database)

    if (!current) {
      notFound(`Page "${slug}" not found.`)
    }

    const updated = normalizePageUpdate(current, input)

    await database.page.update({
      where: { slug: updated.slug },
      data: {
        title: updated.title,
        description: updated.description,
        headline: updated.headline,
        subheadline: updated.subheadline,
        ctaLabel: updated.ctaLabel,
        ctaHref: updated.ctaHref,
        contentJson: JSON.stringify(updated.content),
        updatedAt: updated.updatedAt
      }
    })

    const savedPage = await getPage(slug, database)

    if (!savedPage) {
      notFound(`Page "${slug}" not found.`)
    }

    if (!options.skipRevision) {
      await createPageRevision(savedPage, 'save', undefined, database)
    }

    return savedPage
  })
}
