import { listArticleSummaries, listArticleSummariesBySyndicat } from '~~/server/utils/cms/articles'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const syndicatId = Number(query.syndicatId)

  if (Number.isInteger(syndicatId) && syndicatId > 0) {
    return await listArticleSummariesBySyndicat(syndicatId)
  }

  return await listArticleSummaries()
})
