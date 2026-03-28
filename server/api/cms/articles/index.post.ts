import { requireAdminAccess } from '~~/server/utils/auth'
import { createArticle } from '~~/server/utils/cms/articles'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  return await createArticle()
})
