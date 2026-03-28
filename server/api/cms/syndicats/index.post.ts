import { requireAdminAccess } from '~~/server/utils/auth'
import { createSyndicat } from '~~/server/utils/cms/syndicats'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  return await createSyndicat()
})
