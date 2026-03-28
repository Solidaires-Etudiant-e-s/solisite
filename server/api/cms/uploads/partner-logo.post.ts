import { requireAdminAccess } from '~~/server/utils/auth'
import { uploadImage } from '~~/server/utils/cms/uploads'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  return await uploadImage(event, 'partners')
})
