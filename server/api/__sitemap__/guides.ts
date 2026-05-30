import type { SitemapUrlInput } from '#sitemap/types'
import { defineSitemapEventHandler } from '#imports'

export default defineSitemapEventHandler(async () => {
  const client = await useCmsDatabase()
  const guides = await client.guide.findMany({})

  const articles_sitemap = guides.map(guide => ({
    loc: `/guides/${guide.slug}`,
    _sitemap: 'guides',
    lastmod: guide.updatedAt,
    images: [{
      loc: guide.coverImage,
      title: guide.title
    }],
    news: {
      title: guide.title,
      publication_date: guide.publishedAt,
      publication: {
        name: guide.title,
        language: 'fr'
      }
    },
    priority: 1.0
  }) satisfies SitemapUrlInput)

  return articles_sitemap satisfies SitemapUrlInput[]
})
