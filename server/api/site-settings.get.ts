import { getSiteSettings } from '~~/server/utils/cms/siteSettings'

export default defineEventHandler(async () => {
  return await getSiteSettings()
})
