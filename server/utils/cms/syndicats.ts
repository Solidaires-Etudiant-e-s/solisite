import type { CmsSyndicat } from '~~/lib/cms'
import { normalizeSocialLinks, normalizeSyndicatName } from '~~/lib/cms'
import { createSyndicatRevision } from './revisions'
import type { SyndicatRecord } from './types'
import { runInCmsTransaction, useCmsDatabase } from './database'
import { geocodeSyndicatAddress } from './syndicatGeocoding'
import { notFound } from './http'
import { toSyndicat } from './mappers'
import { nowIso, resolveUniqueSlug } from './shared'

export function listSyndicats() {
  const records = useCmsDatabase().query(`
    SELECT id, slug, name, city, email, address, socials_json, content, latitude, longitude, updated_at
    FROM syndicats
    ORDER BY city COLLATE NOCASE ASC, name COLLATE NOCASE ASC, id ASC
  `).all() as SyndicatRecord[]

  return records.map(toSyndicat)
}

export function getSyndicatById(id: number) {
  const record = useCmsDatabase().query(`
    SELECT id, slug, name, city, email, address, socials_json, content, latitude, longitude, updated_at
    FROM syndicats
    WHERE id = $id
  `).get({ id }) as SyndicatRecord | null

  return record ? toSyndicat(record) : null
}

export function getSyndicatBySlug(slug: string) {
  const record = useCmsDatabase().query(`
    SELECT id, slug, name, city, email, address, socials_json, content, latitude, longitude, updated_at
    FROM syndicats
    WHERE slug = $slug
  `).get({ slug }) as SyndicatRecord | null

  return record ? toSyndicat(record) : null
}

function getUniqueSyndicatSlug(baseName: string, currentId?: number) {
  const database = useCmsDatabase()
  return resolveUniqueSlug(
    baseName,
    'syndicat',
    slug => (database.query<{ id: number }>('SELECT id FROM syndicats WHERE slug = $slug').get({ slug })?.id ?? null),
    currentId
  )
}

function cleanSyndicatName(value: string) {
  return normalizeSyndicatName(value).trim()
}

export function createSyndicat() {
  return runInCmsTransaction(() => {
    const timestamp = nowIso()
    const name = `Nouveau syndicat ${new Date().toLocaleDateString('fr-FR')}`
    const slug = getUniqueSyndicatSlug(name)

    useCmsDatabase().query(`
      INSERT INTO syndicats (
        slug, name, city, email, address, socials_json, content, latitude, longitude, updated_at
      ) VALUES (
        $slug, $name, $city, $email, $address, $socialsJson, $content, $latitude, $longitude, $updatedAt
      )
    `).run({
      slug,
      name,
      city: '',
      email: '',
      address: '',
      socialsJson: '[]',
      content: '<p>Commence à écrire ici.</p>',
      latitude: 0,
      longitude: 0,
      updatedAt: timestamp
    })

    const created = useCmsDatabase().query('SELECT last_insert_rowid() as id').get() as { id: number }
    const syndicat = getSyndicatById(created.id)

    if (!syndicat) {
      notFound(`Syndicat "${created.id}" not found.`)
    }

    return syndicat
  })
}

interface UpdateSyndicatOptions {
  skipRevision?: boolean
}

function normalizeSyndicatUpdate(current: CmsSyndicat, input: Partial<CmsSyndicat>): CmsSyndicat {
  const name = cleanSyndicatName(input.name ?? current.name) || cleanSyndicatName(current.name) || current.name

  return {
    ...current,
    ...input,
    id: current.id,
    name,
    slug: getUniqueSyndicatSlug(name, current.id),
    city: (input.city ?? current.city).trim(),
    email: (input.email ?? current.email).trim(),
    address: (input.address ?? current.address).trim(),
    socials: normalizeSocialLinks(input.socials, current.socials),
    content: input.content ?? current.content,
    latitude: current.latitude,
    longitude: current.longitude,
    updatedAt: nowIso()
  }
}

export async function updateSyndicat(id: number, input: Partial<CmsSyndicat>, options: UpdateSyndicatOptions = {}) {
  const current = getSyndicatById(id)

  if (!current) {
    notFound(`Syndicat "${id}" not found.`)
  }

  const updated = normalizeSyndicatUpdate(current, input)
  const coordinates = await geocodeSyndicatAddress(updated.address, updated.city)
  const syndicatToSave: CmsSyndicat = {
    ...updated,
    latitude: !updated.address ? 0 : (coordinates?.latitude ?? current.latitude),
    longitude: !updated.address ? 0 : (coordinates?.longitude ?? current.longitude)
  }

  return runInCmsTransaction(() => {
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
      id: syndicatToSave.id,
      slug: syndicatToSave.slug,
      name: syndicatToSave.name,
      city: syndicatToSave.city,
      email: syndicatToSave.email,
      address: syndicatToSave.address,
      socialsJson: JSON.stringify(syndicatToSave.socials),
      content: syndicatToSave.content,
      latitude: syndicatToSave.latitude,
      longitude: syndicatToSave.longitude,
      updatedAt: syndicatToSave.updatedAt
    })

    const savedSyndicat = getSyndicatById(id)

    if (!savedSyndicat) {
      notFound(`Syndicat "${id}" not found.`)
    }

    if (!options.skipRevision) {
      createSyndicatRevision(savedSyndicat)
    }

    return savedSyndicat
  })
}
