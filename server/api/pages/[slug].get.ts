import { getPage } from '~~/server/utils/cms/pages'
import { notFound, requireRouteParam } from '~~/server/utils/cms/http'
import { redactSignalementVssPage } from '~~/server/utils/signalementCaptcha'

export default defineEventHandler(async (event) => {
  const slug = requireRouteParam(event, 'slug', 'Missing page slug.')

  const page = await getPage(slug)

  if (!page) {
    notFound(`Page "${slug}" not found.`)
  }

  if (slug === 'signalement-vss') {
    return redactSignalementVssPage(page)
  }

  return page
})
