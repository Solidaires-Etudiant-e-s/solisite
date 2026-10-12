import { requireArticleWriteAccess } from '~~/server/utils/auth'
import { deleteArticle } from '~~/server/utils/cms/articles'
import { requirePositiveIntParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  const id = requirePositiveIntParam(event, 'id', 'Invalid article id.')
  await requireArticleWriteAccess(event, id)

  return await deleteArticle(id)
})
