import type { Prisma } from '@prisma/client'
import type { CmsSyndicat } from '~~/lib/cms'
import { hasInvalidSyndicatAddresses, normalizeSocialLinks, normalizeSyndicatAddresses, normalizeSyndicatName } from '~~/lib/cms'
import { createSyndicatRevision } from './revisions'
import type { SyndicatRecord } from './types'
import { runInCmsTransaction, useCmsDatabase } from './database'
import { notFound } from './http'
import { toSyndicat } from './mappers'
import { nowIso, resolveUniqueSlug } from './shared'

type CmsDatabaseClient = Prisma.TransactionClient | Awaited<ReturnType<typeof useCmsDatabase>>

const collator = new Intl.Collator('fr', {
  sensitivity: 'base'
})

function sortSyndicats(records: SyndicatRecord[]) {
  return [...records].sort((left, right) => {
    const cityOrder = collator.compare(left.city, right.city)

    if (cityOrder !== 0) {
      return cityOrder
    }

    const nameOrder = collator.compare(left.name, right.name)

    if (nameOrder !== 0) {
      return nameOrder
    }

    return left.id - right.id
  })
}

export async function listSyndicats(database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const records = await client.syndicat.findMany() as SyndicatRecord[]

  return sortSyndicats(records).map(toSyndicat)
}

export async function getSyndicatById(id: number, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const record = await client.syndicat.findUnique({
    where: { id }
  }) as SyndicatRecord | null

  return record ? toSyndicat(record) : null
}

export async function getSyndicatBySlug(slug: string, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()
  const record = await client.syndicat.findUnique({
    where: { slug }
  }) as SyndicatRecord | null

  return record ? toSyndicat(record) : null
}

async function getUniqueSyndicatSlug(baseName: string, currentId?: number, database?: CmsDatabaseClient) {
  const client = database ?? await useCmsDatabase()

  return await resolveUniqueSlug(
    baseName,
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

function cleanSyndicatName(value: string) {
  return normalizeSyndicatName(value).trim()
}

function assertValidSyndicatAddresses(addresses: CmsSyndicat['addresses']) {
  if (!hasInvalidSyndicatAddresses(addresses)) {
    return
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Each syndicat address must include a label and a selected autocomplete result with coordinates.'
  })
}

export async function createSyndicat() {
  return await runInCmsTransaction(async (database) => {
    const timestamp = nowIso()
    const name = `Nouveau syndicat ${new Date().toLocaleDateString('fr-FR')}`
    const slug = await getUniqueSyndicatSlug(name, undefined, database)

    const created = await database.syndicat.create({
      data: {
        slug,
        name,
        city: '',
        email: '',
        addressesJson: '[]',
        socialsJson: '[]',
        content: '<p>Commence à écrire ici.</p>',
        updatedAt: timestamp
      }
    })

    const syndicat = await getSyndicatById(created.id, database)

    if (!syndicat) {
      notFound(`Syndicat "${created.id}" not found.`)
    }

    return syndicat
  })
}

interface UpdateSyndicatOptions {
  skipRevision?: boolean
}

async function normalizeSyndicatUpdate(
  current: CmsSyndicat,
  input: Partial<CmsSyndicat>,
  database?: CmsDatabaseClient
): Promise<CmsSyndicat> {
  const name = cleanSyndicatName(input.name ?? current.name) || cleanSyndicatName(current.name) || current.name

  return {
    ...current,
    ...input,
    id: current.id,
    name,
    slug: await getUniqueSyndicatSlug(name, current.id, database),
    city: (input.city ?? current.city).trim(),
    email: (input.email ?? current.email).trim(),
    addresses: normalizeSyndicatAddresses(input.addresses, current.addresses),
    socials: normalizeSocialLinks(input.socials, current.socials),
    content: input.content ?? current.content,
    updatedAt: nowIso()
  }
}

export async function updateSyndicat(id: number, input: Partial<CmsSyndicat>, options: UpdateSyndicatOptions = {}) {
  const current = await getSyndicatById(id)

  if (!current) {
    notFound(`Syndicat "${id}" not found.`)
  }

  const updated = await normalizeSyndicatUpdate(current, input)
  assertValidSyndicatAddresses(updated.addresses)

  return await runInCmsTransaction(async (database) => {
    await database.syndicat.update({
      where: { id: updated.id },
      data: {
        slug: updated.slug,
        name: updated.name,
        city: updated.city,
        email: updated.email,
        addressesJson: JSON.stringify(updated.addresses),
        socialsJson: JSON.stringify(updated.socials),
        content: updated.content,
        updatedAt: updated.updatedAt
      }
    })

    const savedSyndicat = await getSyndicatById(id, database)

    if (!savedSyndicat) {
      notFound(`Syndicat "${id}" not found.`)
    }

    if (!options.skipRevision) {
      await createSyndicatRevision(savedSyndicat, 'save', undefined, database)
    }

    return savedSyndicat
  })
}
