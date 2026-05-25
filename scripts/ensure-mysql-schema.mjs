import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const [, , dbArg] = process.argv

const databaseUrl = dbArg || process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to sync the MySQL schema.')
}

const adapter = new PrismaMariaDb(databaseUrl)
const prisma = new PrismaClient({ adapter })

async function columnExists(table, column) {
  const rows = await prisma.$queryRaw`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${table}
      AND COLUMN_NAME = ${column}
    LIMIT 1
  `

  return Array.isArray(rows) && rows.length > 0
}

async function ensureColumn(table, column, definition) {
  if (await columnExists(table, column)) {
    return
  }

  await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

async function indexExists(table, index) {
  const rows = await prisma.$queryRaw`
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${table}
      AND INDEX_NAME = ${index}
    LIMIT 1
  `

  return Array.isArray(rows) && rows.length > 0
}

async function ensureIndex(table, index, definition) {
  if (await indexExists(table, index)) {
    return
  }

  await prisma.$executeRawUnsafe(`CREATE INDEX ${index} ON ${table} ${definition}`)
}

async function readRows(sql) {
  const rows = await prisma.$queryRawUnsafe(sql)
  return Array.isArray(rows) ? rows : []
}

try {
  await prisma.$connect()

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS pages (
      slug VARCHAR(191) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      headline VARCHAR(512) NOT NULL,
      subheadline TEXT NOT NULL,
      cta_label VARCHAR(255) NOT NULL DEFAULT '',
      cta_href VARCHAR(512) NOT NULL DEFAULT '',
      content_json LONGTEXT NOT NULL,
      updated_at VARCHAR(64) NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(191) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      excerpt TEXT NOT NULL,
      content LONGTEXT NOT NULL,
      cover_image VARCHAR(512) NOT NULL DEFAULT '/hero.jpg',
      published_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS guides (
      id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(191) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      excerpt TEXT NOT NULL,
      content LONGTEXT NOT NULL,
      cover_image VARCHAR(512) NOT NULL DEFAULT '/hero.jpg',
      pdf_file VARCHAR(512) NOT NULL DEFAULT '',
      published_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS syndicats (
      id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(191) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL DEFAULT '',
      email VARCHAR(255) NOT NULL DEFAULT '',
      addresses_json LONGTEXT NOT NULL,
      socials_json LONGTEXT NOT NULL,
      content LONGTEXT NOT NULL,
      updated_at VARCHAR(64) NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
      union_name VARCHAR(255) NOT NULL DEFAULT '',
      site_description TEXT NOT NULL,
      contact_email VARCHAR(255) NOT NULL DEFAULT '',
      contact_phone VARCHAR(64) NOT NULL DEFAULT '',
      address TEXT NOT NULL,
      socials_json LONGTEXT NOT NULL,
      updated_at VARCHAR(64) NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS cms_revisions (
      id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
      entity_type VARCHAR(64) NOT NULL,
      entity_id VARCHAR(191) NOT NULL,
      snapshot_json LONGTEXT NOT NULL,
      revision_label VARCHAR(255) NOT NULL,
      change_type VARCHAR(64) NOT NULL,
      restored_from_revision_id INTEGER,
      created_at VARCHAR(64) NOT NULL
    )
  `)

  await ensureIndex('cms_revisions', 'cms_revisions_entity_idx', '(entity_type, entity_id, created_at, id)')

  await ensureColumn('pages', 'cta_label', 'VARCHAR(255) NOT NULL DEFAULT \'\'')
  await ensureColumn('pages', 'cta_href', 'VARCHAR(512) NOT NULL DEFAULT \'\'')
  await ensureColumn('pages', 'content_json', 'LONGTEXT NOT NULL')
  await ensureColumn('articles', 'excerpt', 'TEXT NOT NULL')
  await ensureColumn('articles', 'content', 'LONGTEXT NOT NULL')
  await ensureColumn('articles', 'cover_image', 'VARCHAR(512) NOT NULL DEFAULT \'/hero.jpg\'')
  await ensureColumn('guides', 'excerpt', 'TEXT NOT NULL')
  await ensureColumn('guides', 'content', 'LONGTEXT NOT NULL')
  await ensureColumn('guides', 'cover_image', 'VARCHAR(512) NOT NULL DEFAULT \'/hero.jpg\'')
  await ensureColumn('guides', 'pdf_file', 'VARCHAR(512) NOT NULL DEFAULT \'\'')
  await ensureColumn('syndicats', 'addresses_json', 'LONGTEXT NOT NULL')
  await ensureColumn('syndicats', 'socials_json', 'LONGTEXT NOT NULL')
  await ensureColumn('syndicats', 'content', 'LONGTEXT NOT NULL')
  await ensureColumn('site_settings', 'union_name', 'VARCHAR(255) NOT NULL DEFAULT \'\'')
  await ensureColumn('site_settings', 'site_description', 'TEXT NOT NULL')
  await ensureColumn('site_settings', 'contact_email', 'VARCHAR(255) NOT NULL DEFAULT \'\'')
  await ensureColumn('site_settings', 'contact_phone', 'VARCHAR(64) NOT NULL DEFAULT \'\'')
  await ensureColumn('site_settings', 'socials_json', 'LONGTEXT NOT NULL')

  const hasLegacyAddressColumn = await columnExists('syndicats', 'address')
  const hasLegacyLatitudeColumn = await columnExists('syndicats', 'latitude')
  const hasLegacyLongitudeColumn = await columnExists('syndicats', 'longitude')

  if (hasLegacyAddressColumn && hasLegacyLatitudeColumn && hasLegacyLongitudeColumn) {
    const syndicats = await readRows(`
      SELECT id, address, addresses_json, latitude, longitude
      FROM syndicats
    `)

    for (const syndicat of syndicats) {
      let parsedAddresses = []

      try {
        const parsed = JSON.parse(String(syndicat.addresses_json || '[]'))
        parsedAddresses = Array.isArray(parsed) ? parsed : []
      } catch {
        parsedAddresses = []
      }

      const address = String(syndicat.address || '').trim()

      if (parsedAddresses.length) {
        const normalizedAddresses = parsedAddresses
          .map((entry, index) => ({
            label: String(entry?.label || '').trim(),
            address: String(entry?.address || '').trim(),
            order: Number.isFinite(Number(entry?.order)) ? Number(entry.order) : index,
            latitude: Number(entry?.latitude || 0),
            longitude: Number(entry?.longitude || 0)
          }))
          .sort((left, right) => left.order - right.order)
          .map((entry, index) => ({
            ...entry,
            order: index
          }))

        const normalizedJson = JSON.stringify(normalizedAddresses)

        if (normalizedJson !== String(syndicat.addresses_json || '[]')) {
          await prisma.$executeRawUnsafe(
            'UPDATE syndicats SET addresses_json = ? WHERE id = ?',
            normalizedJson,
            Number(syndicat.id)
          )
        }

        continue
      }

      if (!address) {
        continue
      }

      await prisma.$executeRawUnsafe(
        'UPDATE syndicats SET addresses_json = ? WHERE id = ?',
        JSON.stringify([{
          label: '',
          address,
          order: 0,
          latitude: Number(syndicat.latitude || 0),
          longitude: Number(syndicat.longitude || 0)
        }]),
        Number(syndicat.id)
      )
    }
  }

  console.log(`MySQL schema is ready at ${databaseUrl}`)
} finally {
  await prisma.$disconnect()
}
