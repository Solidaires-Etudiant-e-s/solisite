import { getGuideBySlug } from '~~/server/utils/cms/guides'
import { notFound, requireRouteParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  const slug = requireRouteParam(event, 'slug', 'Missing guide slug.')
  const guide = await getGuideBySlug(slug)

  if (!guide) {
    notFound(`Guide "${slug}" not found.`)
  }

  return guide
})
