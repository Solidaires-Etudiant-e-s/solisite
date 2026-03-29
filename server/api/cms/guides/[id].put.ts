import type { CmsGuide } from '~~/lib/cms'
import { requireAdminAccess } from '~~/server/utils/auth'
import { updateGuide } from '~~/server/utils/cms/guides'
import { readTypedBody, requirePositiveIntParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const id = requirePositiveIntParam(event, 'id', 'Invalid guide id.')
  const body = await readTypedBody<Partial<CmsGuide>>(event)

  return await updateGuide(id, body)
})
