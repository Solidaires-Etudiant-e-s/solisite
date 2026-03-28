import type { Prisma } from '@prisma/client'
import { normalizeSocialLinks, normalizeSyndicatName, type CmsArticle, type CmsPage, type CmsRevision, type CmsRevisionChangeType, type CmsRevisionEntityType, type CmsSiteSettings, type CmsSocialLink, type CmsSyndicat } from '~~/lib/cms'
import { useCmsDatabase, runInCmsTransaction } from './database'
import { notFound } from './http'
import { toArticle, toPage, toSiteSettings, toSyndicat } from './mappers'
import { nowIso, resolveUniqueSlug } from './shared'
import type { ArticleRecord, PageRecord, RevisionRecord, SiteSettingsRecord, SyndicatRecord } from './types'

type CmsDatabaseClient = Prisma.TransactionClient | Awaited<ReturnType<typeof useCmsDatabase>>
type CmsRevisionSnapshot = CmsPage | CmsArticle | CmsSyndicat | CmsSiteSettings

interface CreateRevisionInput {
  entityType: CmsRevisionEntityType
  entityId: string
  revisionLabel: string
  changeType: CmsRevisionChangeType
  snapshot: CmsRevisionSnapshot
  restoredFromRevisionId?: number | null
}

function parseRevisionSnapshot(record: RevisionRecord) {
  return JSON.parse(record.snapshotJson) as CmsRevisionSnapshot
}

function toRevision(record: RevisionRecord): CmsRevision {
  return {
    id: record.id,
    entityType: record.entityType as CmsRevisionEntityType,
    entityId: record.entityId,
    revisionLabel: record.revisionLabel,
    changeType: record.changeType as CmsRevisionChangeType,
    restoredFromRevisionId: record.restoredFromRevisionId,
    createdAt: record.createdAt,
    snapshot: parseRevisionSnapshot(record)
  }
}

async function getUniqueRestoredArticleSlug(baseValue: string, currentId: number, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()

  return await resolveUniqueSlug(
    baseValue,
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

async function getUniqueRestoredSyndicatSlug(baseValue: string, currentId: number, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()

  return await resolveUniqueSlug(
    baseValue,
    'syndicat',
    async (slug) => {
      const existing = await client.syndicat.findUnique({
        where: { slug },
        select: { id: true }
      })

      return existing?.id ?? null
    },
    currentId
  )
}

function getRestoredSyndicatSocials(snapshot: Partial<CmsSyndicat> & {
  instagram?: string
  twitter?: string
  helloAsso?: string
}) {
  const legacySocials: CmsSocialLink[] = [{
    label: 'Instagram',
    href: snapshot.instagram || '',
    icon: 'mingcute:instagram-line'
  }, {
    label: 'X / Twitter',
    href: snapshot.twitter || '',
    icon: 'mingcute:social-x-line'
  }, {
    label: 'HelloAsso',
    href: snapshot.helloAsso || '',
    icon: 'mingcute:hand-heart-line'
  }].filter(social => social.href)

  return normalizeSocialLinks(snapshot.socials, legacySocials)
}

async function restorePageSnapshot(snapshot: CmsPage, revisionId: number, database: CmsDatabaseClient) {
  const updatedAt = nowIso()

  await database.page.update({
    where: { slug: snapshot.slug },
    data: {
      title: snapshot.title,
      description: snapshot.description,
      headline: snapshot.headline,
      subheadline: snapshot.subheadline,
      ctaLabel: snapshot.ctaLabel,
      ctaHref: snapshot.ctaHref,
      contentJson: JSON.stringify(snapshot.content),
      updatedAt
    }
  })

  const restoredRecord = await database.page.findUnique({
    where: { slug: snapshot.slug }
  }) as PageRecord | null

  if (!restoredRecord) {
    notFound(`Page "${snapshot.slug}" not found.`)
  }

  const entity = toPage(restoredRecord)
  await createPageRevision(entity, 'restore', revisionId, database)

  return {
    entityType: 'page' as const,
    entity
  }
}

async function restoreArticleSnapshot(snapshot: CmsArticle, revisionId: number, database: CmsDatabaseClient) {
  const updatedAt = nowIso()

  await database.article.update({
    where: { id: snapshot.id },
    data: {
      slug: await getUniqueRestoredArticleSlug(snapshot.slug || snapshot.title, snapshot.id, database),
      title: snapshot.title,
      excerpt: snapshot.excerpt,
      content: snapshot.content,
      coverImage: snapshot.coverImage,
      publishedAt: snapshot.publishedAt,
      updatedAt
    }
  })

  const restoredRecord = await database.article.findUnique({
    where: { id: snapshot.id }
  }) as ArticleRecord | null

  if (!restoredRecord) {
    notFound(`Article "${snapshot.id}" not found.`)
  }

  const entity = toArticle(restoredRecord)
  await createArticleRevision(entity, 'restore', revisionId, database)

  return {
    entityType: 'article' as const,
    entity
  }
}

async function restoreSiteSettingsSnapshot(snapshot: CmsSiteSettings, revisionId: number, database: CmsDatabaseClient) {
  const updatedAt = nowIso()

  await database.siteSettings.upsert({
    where: { id: 1 },
    update: {
      unionName: snapshot.unionName,
      siteDescription: snapshot.siteDescription,
      contactEmail: snapshot.contactEmail,
      contactPhone: snapshot.contactPhone,
      address: snapshot.address,
      socialsJson: JSON.stringify(snapshot.socials),
      updatedAt
    },
    create: {
      id: 1,
      unionName: snapshot.unionName,
      siteDescription: snapshot.siteDescription,
      contactEmail: snapshot.contactEmail,
      contactPhone: snapshot.contactPhone,
      address: snapshot.address,
      socialsJson: JSON.stringify(snapshot.socials),
      updatedAt
    }
  })

  const restoredRecord = await database.siteSettings.findUnique({
    where: { id: 1 }
  }) as SiteSettingsRecord | null

  if (!restoredRecord) {
    notFound('Site settings not found.')
  }

  const entity = toSiteSettings(restoredRecord)
  await createSiteSettingsRevision(entity, 'restore', revisionId, database)

  return {
    entityType: 'site-settings' as const,
    entity
  }
}

async function restoreSyndicatSnapshot(snapshot: CmsSyndicat, revisionId: number, database: CmsDatabaseClient) {
  const updatedAt = nowIso()
  const name = normalizeSyndicatName(snapshot.name) || snapshot.name
  const socials = getRestoredSyndicatSocials(snapshot as Partial<CmsSyndicat> & {
    instagram?: string
    twitter?: string
    helloAsso?: string
  })

  await database.syndicat.update({
    where: { id: snapshot.id },
    data: {
      slug: await getUniqueRestoredSyndicatSlug(name, snapshot.id, database),
      name,
      city: snapshot.city,
      email: snapshot.email,
      address: snapshot.address,
      socialsJson: JSON.stringify(socials),
      content: snapshot.content,
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
      updatedAt
    }
  })

  const restoredRecord = await database.syndicat.findUnique({
    where: { id: snapshot.id }
  }) as SyndicatRecord | null

  if (!restoredRecord) {
    notFound(`Syndicat "${snapshot.id}" not found.`)
  }

  const entity = toSyndicat(restoredRecord)
  await createSyndicatRevision(entity, 'restore', revisionId, database)

  return {
    entityType: 'syndicat' as const,
    entity
  }
}

export async function createRevision(input: CreateRevisionInput, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const record = await client.cmsRevisionRecord.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      snapshotJson: JSON.stringify(input.snapshot),
      revisionLabel: input.revisionLabel,
      changeType: input.changeType,
      restoredFromRevisionId: input.restoredFromRevisionId ?? null,
      createdAt: nowIso()
    }
  }) as RevisionRecord

  return toRevision(record)
}

export async function listRevisions(entityType: CmsRevisionEntityType, entityId: string, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const records = await client.cmsRevisionRecord.findMany({
    where: {
      entityType,
      entityId
    },
    orderBy: [
      { createdAt: 'desc' },
      { id: 'desc' }
    ]
  }) as RevisionRecord[]

  return records.map(toRevision)
}

export async function getRevisionById(id: number, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const record = await client.cmsRevisionRecord.findUnique({
    where: { id }
  }) as RevisionRecord | null

  return record ? toRevision(record) : null
}

export async function createPageRevision(
  page: CmsPage,
  changeType: CmsRevisionChangeType = 'save',
  restoredFromRevisionId?: number | null,
  database?: CmsDatabaseClient
) {
  return await createRevision({
    entityType: 'page',
    entityId: page.slug,
    revisionLabel: page.name,
    changeType,
    snapshot: page,
    restoredFromRevisionId
  }, database)
}

export async function createArticleRevision(
  article: CmsArticle,
  changeType: CmsRevisionChangeType = 'save',
  restoredFromRevisionId?: number | null,
  database?: CmsDatabaseClient
) {
  return await createRevision({
    entityType: 'article',
    entityId: String(article.id),
    revisionLabel: article.title,
    changeType,
    snapshot: article,
    restoredFromRevisionId
  }, database)
}

export async function createSyndicatRevision(
  syndicat: CmsSyndicat,
  changeType: CmsRevisionChangeType = 'save',
  restoredFromRevisionId?: number | null,
  database?: CmsDatabaseClient
) {
  return await createRevision({
    entityType: 'syndicat',
    entityId: String(syndicat.id),
    revisionLabel: syndicat.name,
    changeType,
    snapshot: syndicat,
    restoredFromRevisionId
  }, database)
}

export async function createSiteSettingsRevision(
  siteSettings: CmsSiteSettings,
  changeType: CmsRevisionChangeType = 'save',
  restoredFromRevisionId?: number | null,
  database?: CmsDatabaseClient
) {
  return await createRevision({
    entityType: 'site-settings',
    entityId: 'global',
    revisionLabel: siteSettings.unionName || 'Paramètres du site',
    changeType,
    snapshot: siteSettings,
    restoredFromRevisionId
  }, database)
}

export async function restoreRevision(id: number) {
  return await runInCmsTransaction(async (database) => {
    const revision = await getRevisionById(id, database)

    if (!revision) {
      notFound(`Revision "${id}" not found.`)
    }

    if (revision.entityType === 'page') {
      return await restorePageSnapshot(revision.snapshot as CmsPage, revision.id, database)
    }

    if (revision.entityType === 'article') {
      return await restoreArticleSnapshot(revision.snapshot as CmsArticle, revision.id, database)
    }

    if (revision.entityType === 'site-settings') {
      return await restoreSiteSettingsSnapshot(revision.snapshot as CmsSiteSettings, revision.id, database)
    }

    return await restoreSyndicatSnapshot(revision.snapshot as CmsSyndicat, revision.id, database)
  })
}
