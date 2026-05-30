import type { SitemapUrlInput } from '#sitemap/types'
import { defineSitemapEventHandler } from '#imports'

export default defineSitemapEventHandler(async () => {
  const client = await useCmsDatabase()
  const articles = await client.article.findMany({})

  const articles_sitemap = articles.map(article => ({
    loc: `/articles/${article.slug}`,
    _sitemap: 'articles',
    lastmod: article.updatedAt,
    images: [{
      loc: article.coverImage,
      title: article.title
    }],
    news: {
      title: article.title,
      publication_date: article.publishedAt,
      publication: {
        name: article.title,
        language: 'fr'
      }
    }
  }) satisfies SitemapUrlInput)

  return articles_sitemap satisfies SitemapUrlInput[]
})
