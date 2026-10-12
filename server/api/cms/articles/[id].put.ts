import type { CmsArticle } from '~~/lib/cms'
import { requireArticleWriteAccess } from '~~/server/utils/auth'
import { updateArticle } from '~~/server/utils/cms/articles'
import { readTypedBody, requirePositiveIntParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  const id = requirePositiveIntParam(event, 'id', 'Invalid article id.')
  await requireArticleWriteAccess(event, id)
  const body = await readTypedBody<Partial<CmsArticle>>(event)

  return await updateArticle(id, body)
})
