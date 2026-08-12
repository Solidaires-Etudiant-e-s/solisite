import { requireAdminAccess } from '~~/server/utils/auth'
import { deleteGuide } from '~~/server/utils/cms/guides'
import { requirePositiveIntParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const id = requirePositiveIntParam(event, 'id', 'Invalid guide id.')

  return await deleteGuide(id)
})
