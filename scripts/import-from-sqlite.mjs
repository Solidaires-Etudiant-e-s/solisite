import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnvFile } from 'node:process'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import Database from 'better-sqlite3'

if (existsSync('.env')) {
  loadEnvFile('.env')
}

const args = process.argv.slice(2)
const replace = args.includes('--replace')
const positionalArgs = args.filter(arg => arg !== '--replace')
const sqlitePath = resolve(process.cwd(), positionalArgs[0] || 'backup.sqlite')
const databaseUrl = positionalArgs[1] || process.env.DATABASE_URL

if (!existsSync(sqlitePath)) {
  throw new Error(`SQLite file not found: ${sqlitePath}`)
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to import from SQLite.')
}

const sqlite = new Database(sqlitePath, { readonly: true })
const adapter = new PrismaMariaDb(databaseUrl)
const prisma = new PrismaClient({ adapter })

function hasTable(name) {
  const row = sqlite
    .prepare('SELECT name FROM sqlite_master WHERE type = ? AND name = ? LIMIT 1')
    .get('table', name)

  return Boolean(row)
}

function readRows(table) {
  if (!hasTable(table)) {
    return []
  }

  return sqlite.prepare(`SELECT * FROM ${table}`).all()
}

function stringValue(value, fallback = '') {
  return value === null || value === undefined ? fallback : String(value)
}

function numberValue(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function jsonArrayValue(value) {
  try {
    const parsed = JSON.parse(stringValue(value, '[]'))
    return Array.isArray(parsed) ? JSON.stringify(parsed) : '[]'
  } catch {
    return '[]'
  }
}

async function importPages() {
  const rows = readRows('pages')

  for (const row of rows) {
    await prisma.page.upsert({
      where: { slug: stringValue(row.slug) },
      update: {
        name: stringValue(row.name),
        title: stringValue(row.title),
        description: stringValue(row.description),
        headline: stringValue(row.headline),
        subheadline: stringValue(row.subheadline),
        ctaLabel: stringValue(row.cta_label),
        ctaHref: stringValue(row.cta_href),
        contentJson: stringValue(row.content_json, '{}'),
        updatedAt: stringValue(row.updated_at)
      },
      create: {
        slug: stringValue(row.slug),
        name: stringValue(row.name),
        title: stringValue(row.title),
        description: stringValue(row.description),
        headline: stringValue(row.headline),
        subheadline: stringValue(row.subheadline),
        ctaLabel: stringValue(row.cta_label),
        ctaHref: stringValue(row.cta_href),
        contentJson: stringValue(row.content_json, '{}'),
        updatedAt: stringValue(row.updated_at)
      }
    })
  }

  return rows.length
}

async function importArticles() {
  const rows = readRows('articles')

  for (const row of rows) {
    const id = numberValue(row.id)

    await prisma.article.upsert({
      where: { id },
      update: {
        slug: stringValue(row.slug),
        title: stringValue(row.title),
        excerpt: stringValue(row.excerpt),
        content: stringValue(row.content),
        coverImage: stringValue(row.cover_image, '/hero.jpg'),
        publishedAt: stringValue(row.published_at),
        updatedAt: stringValue(row.updated_at)
      },
      create: {
        id,
        slug: stringValue(row.slug),
        title: stringValue(row.title),
        excerpt: stringValue(row.excerpt),
        content: stringValue(row.content),
        coverImage: stringValue(row.cover_image, '/hero.jpg'),
        publishedAt: stringValue(row.published_at),
        updatedAt: stringValue(row.updated_at)
      }
    })
  }

  return rows.length
}

async function importGuides() {
  const rows = readRows('guides')

  for (const row of rows) {
    const id = numberValue(row.id)

    await prisma.guide.upsert({
      where: { id },
      update: {
        slug: stringValue(row.slug),
        title: stringValue(row.title),
        excerpt: stringValue(row.excerpt),
        content: stringValue(row.content),
        coverImage: stringValue(row.cover_image, '/hero.jpg'),
        pdfFile: stringValue(row.pdf_file),
        publishedAt: stringValue(row.published_at),
        updatedAt: stringValue(row.updated_at)
      },
      create: {
        id,
        slug: stringValue(row.slug),
        title: stringValue(row.title),
        excerpt: stringValue(row.excerpt),
        content: stringValue(row.content),
        coverImage: stringValue(row.cover_image, '/hero.jpg'),
        pdfFile: stringValue(row.pdf_file),
        publishedAt: stringValue(row.published_at),
        updatedAt: stringValue(row.updated_at)
      }
    })
  }

  return rows.length
}

async function importSyndicats() {
  const rows = readRows('syndicats')

  for (const row of rows) {
    const id = numberValue(row.id)

    await prisma.syndicat.upsert({
      where: { id },
      update: {
        slug: stringValue(row.slug),
        name: stringValue(row.name),
        city: stringValue(row.city),
        email: stringValue(row.email),
        addressesJson: jsonArrayValue(row.addresses_json),
        socialsJson: jsonArrayValue(row.socials_json),
        content: stringValue(row.content),
        updatedAt: stringValue(row.updated_at)
      },
      create: {
        id,
        slug: stringValue(row.slug),
        name: stringValue(row.name),
        city: stringValue(row.city),
        email: stringValue(row.email),
        addressesJson: jsonArrayValue(row.addresses_json),
        socialsJson: jsonArrayValue(row.socials_json),
        content: stringValue(row.content),
        updatedAt: stringValue(row.updated_at)
      }
    })
  }

  return rows.length
}

async function importSiteSettings() {
  const rows = readRows('site_settings')
  const row = rows[0]

  if (!row) {
    return 0
  }

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      unionName: stringValue(row.union_name),
      siteDescription: stringValue(row.site_description),
      contactEmail: stringValue(row.contact_email),
      contactPhone: stringValue(row.contact_phone),
      address: stringValue(row.address),
      socialsJson: jsonArrayValue(row.socials_json),
      updatedAt: stringValue(row.updated_at)
    },
    create: {
      id: 1,
      unionName: stringValue(row.union_name),
      siteDescription: stringValue(row.site_description),
      contactEmail: stringValue(row.contact_email),
      contactPhone: stringValue(row.contact_phone),
      address: stringValue(row.address),
      socialsJson: jsonArrayValue(row.socials_json),
      updatedAt: stringValue(row.updated_at)
    }
  })

  return 1
}

async function importRevisions() {
  const rows = readRows('cms_revisions')

  for (const row of rows) {
    const id = numberValue(row.id)

    await prisma.cmsRevisionRecord.upsert({
      where: { id },
      update: {
        entityType: stringValue(row.entity_type),
        entityId: stringValue(row.entity_id),
        snapshotJson: stringValue(row.snapshot_json, '{}'),
        revisionLabel: stringValue(row.revision_label),
        changeType: stringValue(row.change_type),
        restoredFromRevisionId: row.restored_from_revision_id === null ? null : numberValue(row.restored_from_revision_id),
        createdAt: stringValue(row.created_at)
      },
      create: {
        id,
        entityType: stringValue(row.entity_type),
        entityId: stringValue(row.entity_id),
        snapshotJson: stringValue(row.snapshot_json, '{}'),
        revisionLabel: stringValue(row.revision_label),
        changeType: stringValue(row.change_type),
        restoredFromRevisionId: row.restored_from_revision_id === null ? null : numberValue(row.restored_from_revision_id),
        createdAt: stringValue(row.created_at)
      }
    })
  }

  return rows.length
}

async function clearCmsTables() {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')

  try {
    await prisma.cmsRevisionRecord.deleteMany()
    await prisma.siteSettings.deleteMany()
    await prisma.syndicat.deleteMany()
    await prisma.guide.deleteMany()
    await prisma.article.deleteMany()
    await prisma.page.deleteMany()
  } finally {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')
  }
}

try {
  await prisma.$connect()

  if (replace) {
    await clearCmsTables()
  }

  const counts = {
    pages: await importPages(),
    articles: await importArticles(),
    guides: await importGuides(),
    syndicats: await importSyndicats(),
    siteSettings: await importSiteSettings(),
    revisions: await importRevisions()
  }

  console.log(`Imported ${sqlitePath}`)
  console.log(counts)
} finally {
  sqlite.close()
  await prisma.$disconnect()
}
