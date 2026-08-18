import type { CmsInstagramFeed, CmsInstagramPost } from '~~/lib/cms'

const CACHE_TTL_MS = 60 * 60 * 1000

interface InstagramCacheEntry {
  expiresAt: number
  feed: CmsInstagramFeed
}

const cache = new Map<string, InstagramCacheEntry>()

interface InstagramCaptionEdge {
  node?: {
    text?: string
  }
}

interface InstagramMediaNode {
  __typename?: string
  id?: string
  shortcode?: string
  is_video?: boolean
  display_url?: string
  taken_at_timestamp?: number
  edge_media_to_caption?: {
    edges?: InstagramCaptionEdge[]
  }
  edge_media_to_comment?: {
    count?: number
  }
  edge_liked_by?: {
    count?: number
  }
}

interface InstagramGraphqlMedia {
  shortcode_media?: InstagramMediaNode
}

interface InstagramEmbedContext {
  username?: string
  full_name?: string
  profile_pic_url?: string
  followers_count?: number
  posts_count?: number
  graphql_media?: InstagramGraphqlMedia[]
}

function extractContextJson(html: string): InstagramEmbedContext | null {
  const key = '"contextJSON":'
  let index = html.indexOf(key)

  if (index < 0) {
    return null
  }

  index += key.length

  while (html[index] === ' ') {
    index++
  }

  const open = index
  let cursor = open + 1

  while (cursor < html.length) {
    const char = html[cursor]

    if (char === '\\') {
      cursor += 2
      continue
    }

    if (char === '"') {
      break
    }

    cursor++
  }

  try {
    const token = html.slice(open, cursor + 1)
    const inner = JSON.parse(token) as string

    return (JSON.parse(inner) as { context?: InstagramEmbedContext }).context || null
  } catch {
    return null
  }
}

function toInstagramPost(media: InstagramMediaNode): CmsInstagramPost | null {
  const shortcode = media.shortcode || ''

  if (!shortcode || !media.display_url) {
    return null
  }

  const captions = media.edge_media_to_caption?.edges || []
  const caption = captions
    .map(edge => edge.node?.text || '')
    .filter(Boolean)
    .join('\n')

  return {
    id: media.id || shortcode,
    shortcode,
    permalink: `https://www.instagram.com/p/${shortcode}/`,
    imageUrl: media.display_url,
    alt: caption || shortcode,
    caption,
    likes: media.edge_liked_by?.count || 0,
    comments: media.edge_media_to_comment?.count || 0,
    takenAt: media.taken_at_timestamp
      ? new Date(media.taken_at_timestamp * 1000).toISOString()
      : '',
    isVideo: Boolean(media.is_video || media.__typename === 'GraphVideo')
  }
}

function parseEmbedFeed(username: string, html: string): CmsInstagramFeed | null {
  const context = extractContextJson(html)

  if (!context) {
    return null
  }

  const resolvedUsername = context.username || username
  const media = context.graphql_media || []
  const posts = media
    .map(entry => toInstagramPost(entry.shortcode_media || {}))
    .filter((post): post is CmsInstagramPost => post !== null)

  return {
    username: resolvedUsername,
    profileName: context.full_name || resolvedUsername,
    profilePictureUrl: context.profile_pic_url || '',
    followers: context.followers_count || 0,
    posts
  }
}

async function fetchEmbedPage(username: string): Promise<string> {
  return await $fetch<string>(`https://www.instagram.com/${username}/embed/`, {
    method: 'GET',
    headers: {
      'user-agent': 'curl/8.5.0',
      'accept': 'text/html'
    },
    responseType: 'text',
    timeout: 15000
  })
}

export async function getInstagramFeed(username: string): Promise<CmsInstagramFeed | null> {
  const normalized = (username || '').replace(/^@/, '').trim().toLowerCase()

  if (!normalized) {
    return null
  }

  const cached = cache.get(normalized)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.feed
  }

  try {
    const html = await fetchEmbedPage(normalized)
    const feed = parseEmbedFeed(normalized, html)

    if (feed) {
      cache.set(normalized, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        feed
      })
    }

    return feed
  } catch (error) {
    console.error('[instagram] failed to fetch feed:', error)
    const stale = cache.get(normalized)

    return stale ? stale.feed : null
  }
}
