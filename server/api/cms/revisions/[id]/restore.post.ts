import { requireRevisionRestoreAccess } from '~~/server/utils/auth'
import { requirePositiveIntParam } from '~~/server/utils/cms/http'
import { restoreRevision } from '~~/server/utils/cms/revisions'

export default defineEventHandler(async (event) => {
  const id = requirePositiveIntParam(event, 'id', 'Invalid revision id.')
  await requireRevisionRestoreAccess(event, id)
  return await restoreRevision(id)
})
