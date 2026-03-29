import { requireAdminAccess } from '~~/server/utils/auth'
import { createGuide } from '~~/server/utils/cms/guides'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  return await createGuide()
})
