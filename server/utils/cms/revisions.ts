import { normalizeSocialLinks, normalizeSyndicatName, type CmsArticle, type CmsPage, type CmsRevision, type CmsRevisionChangeType, type CmsRevisionEntityType, type CmsSiteSettings, type CmsSocialLink, type CmsSyndicat } from '~~/lib/cms'
import { useCmsDatabase, runInCmsTransaction } from './database'
import { notFound } from './http'
import { toArticle, toPage, toSiteSettings, toSyndicat } from './mappers'
import { nowIso, resolveUniqueSlug } from './shared'
import type { ArticleRecord, PageRecord, RevisionRecord, SiteSettingsRecord, SyndicatRecord } from './types'

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
  return JSON.parse(record.snapshot_json) as CmsRevisionSnapshot
}

function toRevision(record: RevisionRecord): CmsRevision {
  return {
    id: record.id,
    entityType: record.entity_type,
    entityId: record.entity_id,
    revisionLabel: record.revision_label,
    changeType: record.change_type,
    restoredFromRevisionId: record.restored_from_revision_id,
    createdAt: record.created_at,
    snapshot: parseRevisionSnapshot(record)
  }
}

function getUniqueRestoredArticleSlug(baseValue: string, currentId: number) {
  const database = useCmsDatabase()
  return resolveUniqueSlug(
    baseValue,
    'article',
    slug => (database.query<{ id: number }>('SELECT id FROM articles WHERE slug = $slug').get({ slug })?.id ?? null),
    currentId
  )
}

function getUniqueRestoredSyndicatSlug(baseValue: string, currentId: number) {
  const database = useCmsDatabase()
  return resolveUniqueSlug(
    baseValue,
    'syndicat',
    slug => (database.query<{ id: number }>('SELECT id FROM syndicats WHERE slug = $slug').get({ slug })?.id ?? null),
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

function restorePageSnapshot(snapshot: CmsPage, revisionId: number) {
  const updatedAt = nowIso()

  useCmsDatabase().query(`
    UPDATE pages
    SET title = $title,
        description = $description,
        headline = $headline,
        subheadline = $subheadline,
        cta_label = $ctaLabel,
        cta_href = $ctaHref,
        content_json = $contentJson,
        updated_at = $updatedAt
    WHERE slug = $slug
  `).run({
    slug: snapshot.slug,
    title: snapshot.title,
    description: snapshot.description,
    headline: snapshot.headline,
    subheadline: snapshot.subheadline,
    ctaLabel: snapshot.ctaLabel,
    ctaHref: snapshot.ctaHref,
    contentJson: JSON.stringify(snapshot.content),
    updatedAt
  })

  const restoredRecord = useCmsDatabase().query(`
    SELECT slug, name, title, description, headline, subheadline, cta_label, cta_href, content_json, updated_at
    FROM pages
    WHERE slug = $slug
  `).get({ slug: snapshot.slug }) as PageRecord | null

  if (!restoredRecord) {
    notFound(`Page "${snapshot.slug}" not found.`)
  }

  const entity = toPage(restoredRecord)
  createPageRevision(entity, 'restore', revisionId)

  return {
    entityType: 'page' as const,
    entity
  }
}

function restoreArticleSnapshot(snapshot: CmsArticle, revisionId: number) {
  const updatedAt = nowIso()

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
    id: snapshot.id,
    slug: getUniqueRestoredArticleSlug(snapshot.slug || snapshot.title, snapshot.id),
    title: snapshot.title,
    excerpt: snapshot.excerpt,
    content: snapshot.content,
    coverImage: snapshot.coverImage,
    publishedAt: snapshot.publishedAt,
    updatedAt
  })

  const restoredRecord = useCmsDatabase().query(`
    SELECT id, slug, title, excerpt, content, cover_image, published_at, updated_at
    FROM articles
    WHERE id = $id
  `).get({ id: snapshot.id }) as ArticleRecord | null

  if (!restoredRecord) {
    notFound(`Article "${snapshot.id}" not found.`)
  }

  const entity = toArticle(restoredRecord)
  createArticleRevision(entity, 'restore', revisionId)

  return {
    entityType: 'article' as const,
    entity
  }
}

function restoreSiteSettingsSnapshot(snapshot: CmsSiteSettings, revisionId: number) {
  const updatedAt = nowIso()

  useCmsDatabase().query(`
    UPDATE site_settings
    SET union_name = $unionName,
        site_description = $siteDescription,
        contact_email = $contactEmail,
        contact_phone = $contactPhone,
        address = $address,
        socials_json = $socialsJson,
        updated_at = $updatedAt
    WHERE id = 1
  `).run({
    unionName: snapshot.unionName,
    siteDescription: snapshot.siteDescription,
    contactEmail: snapshot.contactEmail,
    contactPhone: snapshot.contactPhone,
    address: snapshot.address,
    socialsJson: JSON.stringify(snapshot.socials),
    updatedAt
  })

  const restoredRecord = useCmsDatabase().query(`
    SELECT id, union_name, site_description, contact_email, contact_phone, address, socials_json, updated_at
    FROM site_settings
    WHERE id = 1
  `).get() as SiteSettingsRecord | null

  if (!restoredRecord) {
    notFound('Site settings not found.')
  }

  const entity = toSiteSettings(restoredRecord)
  createSiteSettingsRevision(entity, 'restore', revisionId)

  return {
    entityType: 'site-settings' as const,
    entity
  }
}

function restoreSyndicatSnapshot(snapshot: CmsSyndicat, revisionId: number) {
  const updatedAt = nowIso()
  const name = normalizeSyndicatName(snapshot.name) || snapshot.name
  const socials = getRestoredSyndicatSocials(snapshot as Partial<CmsSyndicat> & {
    instagram?: string
    twitter?: string
    helloAsso?: string
  })

  useCmsDatabase().query(`
    UPDATE syndicats
    SET slug = $slug,
        name = $name,
        city = $city,
        email = $email,
        address = $address,
        socials_json = $socialsJson,
        content = $content,
        latitude = $latitude,
        longitude = $longitude,
        updated_at = $updatedAt
    WHERE id = $id
  `).run({
    id: snapshot.id,
    slug: getUniqueRestoredSyndicatSlug(name, snapshot.id),
    name,
    city: snapshot.city,
    email: snapshot.email,
    address: snapshot.address,
    socialsJson: JSON.stringify(socials),
    content: snapshot.content,
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
    updatedAt
  })

  const restoredRecord = useCmsDatabase().query(`
    SELECT id, slug, name, city, email, address, socials_json, content, latitude, longitude, updated_at
    FROM syndicats
    WHERE id = $id
  `).get({ id: snapshot.id }) as SyndicatRecord | null

  if (!restoredRecord) {
    notFound(`Syndicat "${snapshot.id}" not found.`)
  }

  const entity = toSyndicat(restoredRecord)
  createSyndicatRevision(entity, 'restore', revisionId)

  return {
    entityType: 'syndicat' as const,
    entity
  }
}

export function createRevision(input: CreateRevisionInput) {
  const timestamp = nowIso()
  const database = useCmsDatabase()
  const result = database.query(`
    INSERT INTO cms_revisions (
      entity_type,
      entity_id,
      snapshot_json,
      revision_label,
      change_type,
      restored_from_revision_id,
      created_at
    ) VALUES (
      $entityType,
      $entityId,
      $snapshotJson,
      $revisionLabel,
      $changeType,
      $restoredFromRevisionId,
      $createdAt
    )
  `).run({
    entityType: input.entityType,
    entityId: input.entityId,
    snapshotJson: JSON.stringify(input.snapshot),
    revisionLabel: input.revisionLabel,
    changeType: input.changeType,
    restoredFromRevisionId: input.restoredFromRevisionId ?? null,
    createdAt: timestamp
  })

  const id = Number(result.lastInsertRowid)
  const record = database.query(`
    SELECT id, entity_type, entity_id, snapshot_json, revision_label, change_type, restored_from_revision_id, created_at
    FROM cms_revisions
    WHERE id = $id
  `).get({ id }) as RevisionRecord | null

  if (!record) {
    notFound(`Revision "${id}" not found.`)
  }

  return toRevision(record)
}

export function listRevisions(entityType: CmsRevisionEntityType, entityId: string) {
  const records = useCmsDatabase().query(`
    SELECT id, entity_type, entity_id, snapshot_json, revision_label, change_type, restored_from_revision_id, created_at
    FROM cms_revisions
    WHERE entity_type = $entityType AND entity_id = $entityId
    ORDER BY created_at DESC, id DESC
  `).all({
    entityType,
    entityId
  }) as RevisionRecord[]

  return records.map(toRevision)
}

export function getRevisionById(id: number) {
  const record = useCmsDatabase().query(`
    SELECT id, entity_type, entity_id, snapshot_json, revision_label, change_type, restored_from_revision_id, created_at
    FROM cms_revisions
    WHERE id = $id
  `).get({ id }) as RevisionRecord | null

  return record ? toRevision(record) : null
}

export function createPageRevision(page: CmsPage, changeType: CmsRevisionChangeType = 'save', restoredFromRevisionId?: number | null) {
  return createRevision({
    entityType: 'page',
    entityId: page.slug,
    revisionLabel: page.name,
    changeType,
    snapshot: page,
    restoredFromRevisionId
  })
}

export function createArticleRevision(article: CmsArticle, changeType: CmsRevisionChangeType = 'save', restoredFromRevisionId?: number | null) {
  return createRevision({
    entityType: 'article',
    entityId: String(article.id),
    revisionLabel: article.title,
    changeType,
    snapshot: article,
    restoredFromRevisionId
  })
}

export function createSyndicatRevision(syndicat: CmsSyndicat, changeType: CmsRevisionChangeType = 'save', restoredFromRevisionId?: number | null) {
  return createRevision({
    entityType: 'syndicat',
    entityId: String(syndicat.id),
    revisionLabel: syndicat.name,
    changeType,
    snapshot: syndicat,
    restoredFromRevisionId
  })
}

export function createSiteSettingsRevision(siteSettings: CmsSiteSettings, changeType: CmsRevisionChangeType = 'save', restoredFromRevisionId?: number | null) {
  return createRevision({
    entityType: 'site-settings',
    entityId: 'global',
    revisionLabel: siteSettings.unionName || 'Paramètres du site',
    changeType,
    snapshot: siteSettings,
    restoredFromRevisionId
  })
}

export function restoreRevision(id: number) {
  return runInCmsTransaction(() => {
    const revision = getRevisionById(id)

    if (!revision) {
      notFound(`Revision "${id}" not found.`)
    }

    if (revision.entityType === 'page') {
      return restorePageSnapshot(revision.snapshot as CmsPage, revision.id)
    }

    if (revision.entityType === 'article') {
      return restoreArticleSnapshot(revision.snapshot as CmsArticle, revision.id)
    }

    if (revision.entityType === 'site-settings') {
      return restoreSiteSettingsSnapshot(revision.snapshot as CmsSiteSettings, revision.id)
    }

    return restoreSyndicatSnapshot(revision.snapshot as CmsSyndicat, revision.id)
  })
}
