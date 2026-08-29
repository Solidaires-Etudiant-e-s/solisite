import { listArticles } from '~~/server/utils/cms/articles'
import { getSiteSettings } from '~~/server/utils/cms/siteSettings'
import { buildRssXml, resolveSiteUrlFromConfig } from '~~/server/utils/rss'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  const rawSiteUrl = runtimeConfig.public.siteUrl as string | undefined
  const siteUrl = resolveSiteUrlFromConfig(rawSiteUrl)
  const selfLink = `${siteUrl}/rss/articles.xml`

  const [siteSettings, articles] = await Promise.all([
    getSiteSettings(),
    listArticles()
  ])

  const unionName = siteSettings.unionName || 'Solidaires Étudiant·es'
  const channelTitle = `Articles — ${unionName}`
  const channelDescription = siteSettings.siteDescription || 'Actualités et communiqués de Solidaires Étudiant·es'
  const channelLink = `${siteUrl}/articles`

  const lastBuildDate = articles[0]?.updatedAt || articles[0]?.publishedAt || new Date().toISOString()

  const items = articles.slice(0, 50).map(article => ({
    title: article.title,
    link: `${siteUrl}/articles/${article.slug}`,
    guid: `${siteUrl}/articles/${article.slug}`,
    description: article.excerpt || '',
    content: article.content || article.excerpt || '',
    pubDate: article.publishedAt || article.updatedAt || null,
    categories: article.tags?.map(tag => tag.name) || [],
    enclosureUrl: article.coverImage || null,
    author: unionName
  }))

  const xml = buildRssXml({
    title: channelTitle,
    description: channelDescription,
    link: channelLink,
    atomSelfLink: selfLink,
    language: 'fr',
    lastBuildDate,
    generator: 'Solisite RSS',
    items
  })

  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600')

  return xml
})
