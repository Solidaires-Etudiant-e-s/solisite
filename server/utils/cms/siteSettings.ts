import { createDefaultSiteSettings, createEmptySiteSettings, normalizeSocialLinks, type CmsSiteSettings } from '~~/lib/cms'
import { createSiteSettingsRevision } from './revisions'
import { runInCmsTransaction, useCmsDatabase } from './database'
import { toSiteSettings } from './mappers'
import { nowIso } from './shared'
import type { SiteSettingsRecord } from './types'

export function getSiteSettings() {
  const defaultSiteSettings = createDefaultSiteSettings()
  const record = useCmsDatabase().query(`
    SELECT id, union_name, site_description, contact_email, contact_phone, address, socials_json, updated_at
    FROM site_settings
    WHERE id = 1
  `).get() as SiteSettingsRecord | null

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

export function updateSiteSettings(input: Partial<CmsSiteSettings>, options: UpdateSiteSettingsOptions = {}) {
  return runInCmsTransaction(() => {
    const current = getSiteSettings()
    const updated = normalizeSiteSettingsUpdate(current, input)

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
      unionName: updated.unionName,
      siteDescription: updated.siteDescription,
      contactEmail: updated.contactEmail,
      contactPhone: updated.contactPhone,
      address: updated.address,
      socialsJson: JSON.stringify(updated.socials),
      updatedAt: updated.updatedAt
    })

    const savedSettings = getSiteSettings()

    if (!options.skipRevision) {
      createSiteSettingsRevision(savedSettings)
    }

    return savedSettings
  })
}
