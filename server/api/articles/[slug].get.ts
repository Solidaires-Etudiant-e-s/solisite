import { getArticleBySlug } from '~~/server/utils/cms/articles'
import { notFound, requireRouteParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  const slug = requireRouteParam(event, 'slug', 'Missing article slug.')

  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound(`Article "${slug}" not found.`)
  }

  return article
})
