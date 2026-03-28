import { createEmptySiteSettings, type CmsSiteSettings } from '~~/lib/cms'

export function requireCmsData<T>(value: T | null | undefined, statusMessage: string) {
  if (value != null) {
    return value
  }

  throw createError({
    statusCode: 404,
    statusMessage
  })
}

export function resolveSiteSettings(value: CmsSiteSettings | null | undefined) {
  return value ?? createEmptySiteSettings()
}
