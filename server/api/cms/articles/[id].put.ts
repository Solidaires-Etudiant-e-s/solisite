import type { CmsArticle } from '~~/lib/cms'
import { requireArticleWriteAccess } from '~~/server/utils/auth'
import { updateArticle } from '~~/server/utils/cms/articles'
import { readTypedBody, requirePositiveIntParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  const id = requirePositiveIntParam(event, 'id', 'Invalid article id.')
  const access = await requireArticleWriteAccess(event, id)
  const body = await readTypedBody<Partial<CmsArticle>>(event)

  const options: { syndicatId?: number | null } = {}

  if (access.user.role === 'admin' && body.syndicatId !== undefined) {
    options.syndicatId = body.syndicatId
  }

  return await updateArticle(id, body, options)
})
