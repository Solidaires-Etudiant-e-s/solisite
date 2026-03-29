import { PrismaClient } from '@prisma/client'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve, dirname } from 'node:path'
import { mkdirSync } from 'node:fs'

const [, , dbArg] = process.argv

const databaseUrl = dbArg
  ? pathToFileURL(resolve(process.cwd(), dbArg)).toString()
  : (process.env.DATABASE_URL || pathToFileURL(resolve(process.cwd(), 'data/cms.sqlite')).toString())

const sqlitePath = databaseUrl.startsWith('file://')
  ? fileURLToPath(databaseUrl)
  : null

if (sqlitePath) {
  mkdirSync(dirname(sqlitePath), { recursive: true })
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

async function columnExists(table, column) {
  const rows = await prisma.$queryRawUnsafe(`PRAGMA table_info(${table})`)
  return Array.isArray(rows) && rows.some(entry => entry?.name === column)
}

async function ensureColumn(table, column, definition) {
  if (await columnExists(table, column)) {
    return
  }

  await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

try {
  await prisma.$connect()

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS pages (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      headline TEXT NOT NULL,
      subheadline TEXT NOT NULL,
      cta_label TEXT NOT NULL DEFAULT '',
      cta_href TEXT NOT NULL DEFAULT '',
      content_json TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      cover_image TEXT NOT NULL DEFAULT '/hero.jpg',
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS guides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      cover_image TEXT NOT NULL DEFAULT '/hero.jpg',
      pdf_file TEXT NOT NULL DEFAULT '',
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS syndicats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      socials_json TEXT NOT NULL DEFAULT '[]',
      content TEXT NOT NULL DEFAULT '',
      latitude REAL NOT NULL DEFAULT 0,
      longitude REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      union_name TEXT NOT NULL DEFAULT '',
      site_description TEXT NOT NULL DEFAULT '',
      contact_email TEXT NOT NULL DEFAULT '',
      contact_phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      socials_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS cms_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      revision_label TEXT NOT NULL,
      change_type TEXT NOT NULL,
      restored_from_revision_id INTEGER,
      created_at TEXT NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS cms_revisions_entity_idx
    ON cms_revisions (entity_type, entity_id, created_at DESC, id DESC)
  `)

  await ensureColumn('pages', 'cta_label', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('pages', 'cta_href', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('pages', 'content_json', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('articles', 'excerpt', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('articles', 'content', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('articles', 'cover_image', 'TEXT NOT NULL DEFAULT \'/hero.jpg\'')
  await ensureColumn('guides', 'excerpt', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('guides', 'content', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('guides', 'cover_image', 'TEXT NOT NULL DEFAULT \'/hero.jpg\'')
  await ensureColumn('guides', 'pdf_file', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('syndicats', 'socials_json', 'TEXT NOT NULL DEFAULT \'[]\'')
  await ensureColumn('syndicats', 'content', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('syndicats', 'latitude', 'REAL NOT NULL DEFAULT 0')
  await ensureColumn('syndicats', 'longitude', 'REAL NOT NULL DEFAULT 0')
  await ensureColumn('site_settings', 'union_name', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('site_settings', 'site_description', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('site_settings', 'contact_email', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('site_settings', 'contact_phone', 'TEXT NOT NULL DEFAULT \'\'')
  await ensureColumn('site_settings', 'socials_json', 'TEXT NOT NULL DEFAULT \'[]\'')

  console.log(`SQLite schema is ready at ${databaseUrl}`)
} finally {
  await prisma.$disconnect()
}
