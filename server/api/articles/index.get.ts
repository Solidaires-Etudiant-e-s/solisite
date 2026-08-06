import { listArticleSummaries } from '~~/server/utils/cms/articles'

export default defineEventHandler(async () => {
  return await listArticleSummaries()
})
