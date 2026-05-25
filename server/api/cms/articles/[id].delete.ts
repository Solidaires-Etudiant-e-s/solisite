import { requireAdminAccess } from '~~/server/utils/auth'
import { deleteArticle } from '~~/server/utils/cms/articles'
import { requirePositiveIntParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const id = requirePositiveIntParam(event, 'id', 'Invalid article id.')

  return await deleteArticle(id)
})
