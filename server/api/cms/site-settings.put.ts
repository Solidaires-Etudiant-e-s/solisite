import type { CmsSiteSettings } from '~~/lib/cms'
import { requireAdminAccess } from '~~/server/utils/auth'
import { readTypedBody } from '~~/server/utils/cms/http'
import { updateSiteSettings } from '~~/server/utils/cms/siteSettings'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const body = await readTypedBody<Partial<CmsSiteSettings>>(event)
  return await updateSiteSettings(body)
})
