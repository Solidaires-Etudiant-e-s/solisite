import type { CmsSyndicat } from '~~/lib/cms'
import { requireSyndicatWriteAccess } from '~~/server/utils/auth'
import { updateSyndicat } from '~~/server/utils/cms/syndicats'
import { readTypedBody, requirePositiveIntParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  const id = requirePositiveIntParam(event, 'id', 'Invalid syndicat id.')
  await requireSyndicatWriteAccess(event, id)
  const body = await readTypedBody<Partial<CmsSyndicat>>(event)

  return await updateSyndicat(id, body)
})
