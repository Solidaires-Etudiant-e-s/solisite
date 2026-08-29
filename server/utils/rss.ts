export interface RssItem {
  title: string
  link: string
  guid: string
  description: string
  content?: string
  pubDate?: string | Date | null
  categories?: string[]
  enclosureUrl?: string | null
  enclosureType?: string | null
  author?: string | null
}

export interface RssChannelOptions {
  title: string
  description: string
  link: string
  atomSelfLink: string
  language?: string
  lastBuildDate?: string | Date | null
  generator?: string
  items: RssItem[]
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(value: string): string {
  // CDATA sections cannot contain "]]>" — split it
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

function formatRfc822(dateInput: string | Date | null | undefined): string | null {
  if (!dateInput) {
    return null
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toUTCString()
}

function resolveAbsoluteUrl(path: string, siteUrl: string): string {
  const normalizedPath = path.trim()

  if (!normalizedPath) {
    const normalizedSiteUrl = siteUrl.replace(/\/+$/, '')
    return `${normalizedSiteUrl}/`
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath
  }

  const withLeadingSlash = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`

  // For root-absolute paths (starting with /), resolve against the origin only
  // to avoid duplicating channel sub-paths like "/articles" + "/hero.jpg"
  if (normalizedPath.startsWith('/')) {
    try {
      const origin = new URL(siteUrl).origin
      return `${origin}${withLeadingSlash}`
    } catch {
      // Fallback if siteUrl is not a valid absolute URL
      const originMatch = siteUrl.match(/^https?:\/\/[^/]+/i)
      if (originMatch) {
        return `${originMatch[0]}${withLeadingSlash}`
      }
    }
  }

  const normalizedSiteUrl = siteUrl.replace(/\/+$/, '')
  return `${normalizedSiteUrl}${withLeadingSlash}`
}

function inferEnclosureType(url: string): string | null {
  const extension = url.split('?')[0]?.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'svg':
      return 'image/svg+xml'
    case 'pdf':
      return 'application/pdf'
    default:
      return null
  }
}

export function buildRssXml(options: RssChannelOptions): string {
  const language = options.language || 'fr'
  const generator = options.generator || 'Solisite'
  const lastBuildDate = formatRfc822(options.lastBuildDate) || new Date().toUTCString()

  const itemsXml = options.items.map((item) => {
    const pubDate = formatRfc822(item.pubDate)
    const categoriesXml = (item.categories || [])
      .filter(Boolean)
      .map(category => `    <category>${escapeXml(category)}</category>`)
      .join('\n')

    const enclosureXml = item.enclosureUrl
      ? (() => {
          const type = item.enclosureType || inferEnclosureType(item.enclosureUrl!)
          const typeAttr = type ? ` type="${escapeXml(type)}"` : ''
          return `    <enclosure url="${escapeXml(resolveAbsoluteUrl(item.enclosureUrl!, options.link))}"${typeAttr} />`
        })()
      : ''

    const authorXml = item.author ? `    <dc:creator>${cdata(item.author)}</dc:creator>` : ''

    return `  <item>
    <title>${cdata(item.title)}</title>
    <link>${escapeXml(item.link)}</link>
    <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
    <description>${cdata(item.description)}</description>${item.content ? `\n    <content:encoded>${cdata(item.content)}</content:encoded>` : ''}${pubDate ? `\n    <pubDate>${escapeXml(pubDate)}</pubDate>` : ''}${authorXml ? `\n${authorXml}` : ''}${categoriesXml ? `\n${categoriesXml}` : ''}${enclosureXml ? `\n${enclosureXml}` : ''}
  </item>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>${cdata(options.title)}</title>
  <link>${escapeXml(options.link)}</link>
  <description>${cdata(options.description)}</description>
  <language>${escapeXml(language)}</language>
  <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>
  <generator>${escapeXml(generator)}</generator>
  <atom:link href="${escapeXml(options.atomSelfLink)}" rel="self" type="application/rss+xml" />
${itemsXml ? `${itemsXml}\n` : ''}</channel>
</rss>
`
}

export function resolveSiteUrlFromConfig(siteUrl: string | null | undefined, fallback = 'https://solidaires-etudiant-e-s.org'): string {
  const normalized = (siteUrl || '').trim().replace(/\/+$/, '')
  return normalized || fallback
}
