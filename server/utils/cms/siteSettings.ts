import type { Prisma } from '@prisma/client'
import { createDefaultSiteSettings, createEmptySiteSettings, normalizeSocialLinks, type CmsSiteSettings } from '~~/lib/cms'
import { createSiteSettingsRevision } from './revisions'
import { runInCmsTransaction, useCmsDatabase } from './database'
import { toSiteSettings } from './mappers'
import { nowIso } from './shared'
import type { SiteSettingsRecord } from './types'

type CmsDatabaseClient = Prisma.TransactionClient | Awaited<ReturnType<typeof useCmsDatabase>>

export async function getSiteSettings(database?: CmsDatabaseClient) {
  const defaultSiteSettings = createDefaultSiteSettings()
  const client = database ?? await useCmsDatabase()
  const record = await client.siteSettings.findUnique({
    where: { id: 1 }
  }) as SiteSettingsRecord | null

  if (!record) {
    return {
      ...createEmptySiteSettings(),
      ...defaultSiteSettings,
      updatedAt: nowIso()
    }
  }

  return toSiteSettings(record)
}

interface UpdateSiteSettingsOptions {
  skipRevision?: boolean
}

function normalizeSiteSettingsUpdate(current: CmsSiteSettings, input: Partial<CmsSiteSettings>) {
  return {
    ...current,
    ...input,
    unionName: (input.unionName ?? current.unionName).trim(),
    siteDescription: (input.siteDescription ?? current.siteDescription).trim(),
    contactEmail: (input.contactEmail ?? current.contactEmail).trim(),
    contactPhone: (input.contactPhone ?? current.contactPhone).trim(),
    address: (input.address ?? current.address).trim(),
    socials: normalizeSocialLinks(input.socials, current.socials),
    updatedAt: nowIso()
  } satisfies CmsSiteSettings
}

export async function updateSiteSettings(input: Partial<CmsSiteSettings>, options: UpdateSiteSettingsOptions = {}) {
  return await runInCmsTransaction(async (database) => {
    const current = await getSiteSettings(database)
    const updated = normalizeSiteSettingsUpdate(current, input)

    await database.siteSettings.upsert({
      where: { id: 1 },
      update: {
        unionName: updated.unionName,
        siteDescription: updated.siteDescription,
        contactEmail: updated.contactEmail,
        contactPhone: updated.contactPhone,
        address: updated.address,
        socialsJson: JSON.stringify(updated.socials),
        updatedAt: updated.updatedAt
      },
      create: {
        id: 1,
        unionName: updated.unionName,
        siteDescription: updated.siteDescription,
        contactEmail: updated.contactEmail,
        contactPhone: updated.contactPhone,
        address: updated.address,
        socialsJson: JSON.stringify(updated.socials),
        updatedAt: updated.updatedAt
      }
    })

    const savedSettings = await getSiteSettings(database)

    if (!options.skipRevision) {
      await createSiteSettingsRevision(savedSettings, 'save', undefined, database)
    }

    return savedSettings
  })
}
