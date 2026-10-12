import type { CmsArticle } from '~~/lib/cms'
import { resolveCmsAccess } from '~~/server/utils/auth'
import { createArticle } from '~~/server/utils/cms/articles'
import { readTypedBody } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  const access = await resolveCmsAccess(event)
  const body = await readTypedBody<Partial<CmsArticle>>(event)

  const syndicatId = access.user.role === 'admin' ? null : access.managedSyndicatId

  return await createArticle(body?.tags, syndicatId)
})
