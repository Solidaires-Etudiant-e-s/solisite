import { getSiteSettings } from '~~/server/utils/cms/siteSettings'

export default defineEventHandler(() => {
  return getSiteSettings()
})
