import { getSyndicatBySlug } from '~~/server/utils/cms/syndicats'
import { notFound, requireRouteParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  const slug = requireRouteParam(event, 'slug', 'Missing syndicat slug.')
  const syndicat = await getSyndicatBySlug(slug)

  if (!syndicat) {
    notFound(`Syndicat "${slug}" not found.`)
  }

  return syndicat
})
