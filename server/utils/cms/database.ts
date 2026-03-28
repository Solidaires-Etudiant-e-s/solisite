import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createDefaultSiteSettings, normalizeSyndicatName, type CmsSocialLink } from '~~/lib/cms'
import { defaultPages } from './content'
import { defaultArticle, hasTableColumn, nowIso, slugify } from './shared'
import { defaultSyndicats } from './syndicatsSeed'

let db: Database | null = null

function getDatabasePath() {
  const runtimeConfig = useRuntimeConfig()
  return resolve(process.cwd(), runtimeConfig.sqlitePath)
}

function ensureRevisionsTable(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS cms_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      revision_label TEXT NOT NULL,
      change_type TEXT NOT NULL,
      restored_from_revision_id INTEGER,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE INDEX IF NOT EXISTS cms_revisions_entity_idx
    ON cms_revisions (entity_type, entity_id, created_at DESC, id DESC);
  `)
}

function createSeedSyndicatSocials(instagram: string, twitter: string, helloAsso: string) {
  return [{
    label: 'Instagram',
    href: instagram,
    icon: 'mingcute:instagram-line'
  }, {
    label: 'X / Twitter',
    href: twitter,
    icon: 'mingcute:social-x-line'
  }, {
    label: 'HelloAsso',
    href: helloAsso,
    icon: 'mingcute:hand-heart-line'
  }].filter((social): social is CmsSocialLink => Boolean(social.href))
}

function ensureSiteSettingsTable(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      union_name TEXT NOT NULL DEFAULT '',
      site_description TEXT NOT NULL DEFAULT '',
      contact_email TEXT NOT NULL DEFAULT '',
      contact_phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      socials_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL
    );
  `)
}

const requiredSchema = {
  pages: ['slug', 'name', 'title', 'description', 'headline', 'subheadline', 'cta_label', 'cta_href', 'content_json', 'updated_at'],
  articles: ['id', 'slug', 'title', 'excerpt', 'content', 'cover_image', 'published_at', 'updated_at'],
  syndicats: ['id', 'slug', 'name', 'city', 'email', 'address', 'socials_json', 'content', 'latitude', 'longitude', 'updated_at'],
  site_settings: ['id', 'union_name', 'site_description', 'contact_email', 'contact_phone', 'address', 'socials_json', 'updated_at'],
  cms_revisions: ['id', 'entity_type', 'entity_id', 'snapshot_json', 'revision_label', 'change_type', 'restored_from_revision_id', 'created_at']
} as const satisfies Record<string, string[]>

function assertCurrentSchema(database: Database) {
  for (const [table, columns] of Object.entries(requiredSchema)) {
    const missingColumns = columns.filter(column => !hasTableColumn(database, table, column))

    if (!missingColumns.length) {
      continue
    }

    throw new Error(
      `Unsupported SQLite schema for table "${table}". Missing columns: ${missingColumns.join(', ')}. `
      + 'This project no longer performs in-app schema migrations; rebuild the database in the latest schema before starting the app.'
    )
  }
}

function seedDatabase(database: Database) {
  const defaultSiteSettings = createDefaultSiteSettings()

  const insertPage = database.query(`
    INSERT OR IGNORE INTO pages (
      slug, name, title, description, headline, subheadline, cta_label, cta_href, content_json, updated_at
    ) VALUES (
      $slug, $name, $title, $description, $headline, $subheadline, $ctaLabel, $ctaHref, $contentJson, $updatedAt
    )
  `)

  for (const page of defaultPages) {
    insertPage.run({
      slug: page.slug,
      name: page.name,
      title: page.title,
      description: page.description,
      headline: page.headline,
      subheadline: page.subheadline,
      ctaLabel: page.ctaLabel,
      ctaHref: page.ctaHref,
      contentJson: JSON.stringify(page.content),
      updatedAt: nowIso()
    })
  }

  const articleCount = database.query('SELECT COUNT(*) as count FROM articles').get() as { count: number }

  if (!articleCount.count) {
    const timestamp = nowIso()
    database.query(`
      INSERT INTO articles (slug, title, excerpt, content, cover_image, published_at, updated_at)
      VALUES ($slug, $title, $excerpt, $content, $coverImage, $publishedAt, $updatedAt)
    `).run({
      slug: slugify(defaultArticle.title),
      title: defaultArticle.title,
      excerpt: defaultArticle.excerpt,
      content: defaultArticle.content,
      coverImage: defaultArticle.coverImage,
      publishedAt: timestamp,
      updatedAt: timestamp
    })
  }

  const syndicatCount = database.query('SELECT COUNT(*) as count FROM syndicats').get() as { count: number }

  if (!syndicatCount.count) {
    const insertSyndicat = database.query(`
      INSERT INTO syndicats (
        slug, name, city, email, address, socials_json, content, latitude, longitude, updated_at
      ) VALUES (
        $slug, $name, $city, $email, $address, $socialsJson, $content, $latitude, $longitude, $updatedAt
      )
    `)

    for (const syndicat of defaultSyndicats) {
      const name = normalizeSyndicatName(syndicat.name)

      insertSyndicat.run({
        slug: slugify(name),
        name,
        city: syndicat.city,
        email: syndicat.email,
        address: syndicat.address,
        socialsJson: JSON.stringify(createSeedSyndicatSocials(syndicat.instagram, syndicat.twitter, syndicat.helloAsso)),
        content: '',
        latitude: syndicat.latitude,
        longitude: syndicat.longitude,
        updatedAt: nowIso()
      })
    }
  }

  const siteSettingsCount = database.query('SELECT COUNT(*) as count FROM site_settings').get() as { count: number }

  if (!siteSettingsCount.count) {
    database.query(`
      INSERT INTO site_settings (
        id, union_name, site_description, contact_email, contact_phone, address, socials_json, updated_at
      ) VALUES (
        1, $unionName, $siteDescription, $contactEmail, $contactPhone, $address, $socialsJson, $updatedAt
      )
    `).run({
      unionName: defaultSiteSettings.unionName,
      siteDescription: defaultSiteSettings.siteDescription,
      contactEmail: defaultSiteSettings.contactEmail,
      contactPhone: defaultSiteSettings.contactPhone,
      address: defaultSiteSettings.address,
      socialsJson: JSON.stringify(defaultSiteSettings.socials),
      updatedAt: nowIso()
    })
  }
}

function initializeDatabase(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS pages (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      headline TEXT NOT NULL,
      subheadline TEXT NOT NULL,
      cta_label TEXT NOT NULL DEFAULT '',
      cta_href TEXT NOT NULL DEFAULT '',
      content_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      cover_image TEXT NOT NULL DEFAULT '/hero.jpg',
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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
    );
  `)

  ensureSiteSettingsTable(database)
  ensureRevisionsTable(database)
  assertCurrentSchema(database)
  database.run('PRAGMA journal_mode = WAL;')
  seedDatabase(database)
}

export function useCmsDatabase() {
  if (!db) {
    const databasePath = getDatabasePath()
    mkdirSync(dirname(databasePath), { recursive: true })
    db = new Database(databasePath, {
      create: true,
      strict: true
    })
    initializeDatabase(db)
  }

  return db
}

export function runInCmsTransaction<T>(callback: () => T) {
  const database = useCmsDatabase()

  database.run('BEGIN IMMEDIATE')

  try {
    const result = callback()
    database.run('COMMIT')
    return result
  } catch (error) {
    database.run('ROLLBACK')
    throw error
  }
}
