import { listGuides } from '~~/server/utils/cms/guides'
import { getSiteSettings } from '~~/server/utils/cms/siteSettings'
import { buildRssXml, resolveSiteUrlFromConfig } from '~~/server/utils/rss'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  const rawSiteUrl = runtimeConfig.public.siteUrl as string | undefined
  const siteUrl = resolveSiteUrlFromConfig(rawSiteUrl)
  const selfLink = `${siteUrl}/rss/guides.xml`

  const [siteSettings, guides] = await Promise.all([
    getSiteSettings(),
    listGuides()
  ])

  // Exclude archived guides from feed
  const visibleGuides = guides.filter(guide => !guide.archived)

  const unionName = siteSettings.unionName || 'Solidaires Étudiant·es'
  const channelTitle = `Guides — ${unionName}`
  const channelDescription = siteSettings.siteDescription || 'Guides pratiques de Solidaires Étudiant·es'
  const channelLink = `${siteUrl}/guides`

  const lastBuildDate = visibleGuides[0]?.updatedAt || visibleGuides[0]?.publishedAt || new Date().toISOString()

  const items = visibleGuides.slice(0, 50).map(guide => ({
    title: guide.title,
    link: `${siteUrl}/guides/${guide.slug}`,
    guid: `${siteUrl}/guides/${guide.slug}`,
    description: guide.excerpt || '',
    content: guide.content || guide.excerpt || '',
    pubDate: guide.publishedAt || guide.updatedAt || null,
    categories: [] as string[],
    enclosureUrl: guide.pdfFile || guide.coverImage || null,
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
