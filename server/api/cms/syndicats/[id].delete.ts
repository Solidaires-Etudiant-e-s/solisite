import { requireSyndicatWriteAccess } from '~~/server/utils/auth'
import { deleteSyndicat } from '~~/server/utils/cms/syndicats'
import { requirePositiveIntParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  const id = requirePositiveIntParam(event, 'id', 'Invalid syndicat id.')
  await requireSyndicatWriteAccess(event, id)

  return await deleteSyndicat(id)
})
