import type { CmsArticle } from '~~/lib/cms'
import { requireAdminAccess } from '~~/server/utils/auth'
import { createArticle } from '~~/server/utils/cms/articles'
import { readTypedBody } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const body = await readTypedBody<Partial<CmsArticle>>(event)

  return await createArticle(body?.tags)
})
