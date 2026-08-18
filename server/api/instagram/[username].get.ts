import { requireRouteParam } from '~~/server/utils/cms/http'
import { getInstagramFeed } from '~~/server/utils/cms/instagram'

export default defineEventHandler(async (event) => {
  const username = requireRouteParam(event, 'username', 'Nom d’utilisateur Instagram manquant.')
  const feed = await getInstagramFeed(username)

  if (!feed) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Flux Instagram introuvable.'
    })
  }

  return feed
})
