import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { PrismaClient } from '@prisma/client'

const [, , dbArg] = process.argv

const LEGACY_SITE_URL = 'https://solidaires-etudiant-e-s.org/site'
const TAG_SLUG = 'guide'
const FALLBACK_TAG_ID = 594
const databaseUrl = dbArg
  ? pathToFileURL(resolve(process.cwd(), dbArg)).toString()
  : (process.env.DATABASE_URL || pathToFileURL(resolve(process.cwd(), 'data/cms.sqlite')).toString())
const coversDir = resolve(process.cwd(), 'public/uploads/guides/imported/covers')
const pdfsDir = resolve(process.cwd(), 'public/uploads/guides/imported/pdfs')
const coversPublicBase = '/uploads/guides/imported/covers'
const pdfsPublicBase = '/uploads/guides/imported/pdfs'

const manualPdfUrls = new Map([
  [5601, 'https://solidaires-etudiant-e-s.org/site/wp-content/uploads/2020/08/Guide_de_letudiant-e_version_web_aout_2020.pdf'],
  [4775, 'https://solidaires-etudiant-e-s.org/site/wp-content/uploads/2019/08/Guide_des_etudiantes_SESL_2019.pdf']
])

mkdirSync(coversDir, { recursive: true })
mkdirSync(pdfsDir, { recursive: true })

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase()
}

function slugify(value) {
  return normalizeText(value)
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&rsquo;/g, '\'')
    .replace(/&lsquo;/g, '\'')
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&hellip;/g, '...')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&agrave;/g, 'à')
    .replace(/&ccedil;/g, 'ç')
}

function stripHtml(value) {
  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function createExcerpt(html) {
  const paragraphMatch = html.match(/<p>([\s\S]*?)<\/p>/i)
  const source = paragraphMatch ? paragraphMatch[1] : html
  const text = stripHtml(source)

  if (text.length <= 220) {
    return text
  }

  return `${text.slice(0, 217).trimEnd()}...`
}

function normalizeSiteUrl(value) {
  return String(value || '')
    .trim()
    .replace(/^http:\/\//i, 'https://')
    .replace('https://www.solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replace('https://solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replace('https://www.solidaires-etudiant-e-s.org', 'https://solidaires-etudiant-e-s.org')
    .replace('https://solidaires-etudiant-e-s.org/archive//wp-content/uploads/', 'https://solidaires-etudiant-e-s.org/site/wp-content/uploads/')
    .replace('https://solidaires-etudiant-e-s.org/wp-content/uploads/', 'https://solidaires-etudiant-e-s.org/site/wp-content/uploads/')
    .replace('https://solidaires-etudiant-e-s.org/site/site/wp-content/uploads/', 'https://solidaires-etudiant-e-s.org/site/wp-content/uploads/')
}

function normalizeRenderedHtml(html) {
  return normalizeSiteUrl(
    String(html || '')
      .replaceAll('http://www.solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
      .replaceAll('http://solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
      .replaceAll('https://www.solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
      .replaceAll('https://solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
      .replaceAll('www.solidaires-etudiant.org/', 'solidaires-etudiant-e-s.org/')
      .replaceAll('www.solidaires-etudiant.org', 'solidaires-etudiant-e-s.org')
      .replaceAll('solidaires-etudiant.org/', 'solidaires-etudiant-e-s.org/')
      .replaceAll('/archive//wp-content/uploads/', '/site/wp-content/uploads/')
  )
}

function extractPdfUrlFromHtml(html) {
  const source = decodeHtmlEntities(html)
  const match = source.match(/(?:href|src|data)=["']([^"']+\.pdf(?:\?[^"']*)?)["']/i)

  if (!match) {
    return ''
  }

  return normalizeSiteUrl(match[1])
}

function removeLegacyPdfBlocks(html) {
  return html
    .replace(/<figure[^>]*wp-block-file[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<div[^>]*wp-block-file[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<p>\s*<a[^>]+href=["']blob:[^"']+["'][\s\S]*?<\/p>/gi, '')
    .replace(/<p>\s*<a[^>]+href=["'][^"']+\.pdf(?:\?[^"']*)?["'][\s\S]*?<\/p>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, block => /pdf|blob:/i.test(block) ? '' : block)
    .replace(/<embed[^>]+(?:pdf|blob:)[^>]*>/gi, '')
    .replace(/<iframe[^>]+(?:pdf|blob:)[^>]*><\/iframe>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function resolveTitle(post) {
  return stripHtml(post?.title?.rendered || '').trim() || post.slug
}

function resolveCoverUrl(post) {
  const featured = Array.isArray(post.featured_image_src)
    ? post.featured_image_src[0]
    : post.featured_image_src

  if (!featured) {
    return '/hero.jpg'
  }

  return normalizeSiteUrl(featured)
}

function extensionFromContentType(contentType, fallback = '') {
  const normalized = String(contentType || '').split(';')[0].trim().toLowerCase()

  if (normalized === 'image/jpeg' || normalized === 'image/jpg') {
    return '.jpg'
  }

  if (normalized === 'image/png') {
    return '.png'
  }

  if (normalized === 'image/gif') {
    return '.gif'
  }

  if (normalized === 'image/webp') {
    return '.webp'
  }

  if (normalized === 'image/svg+xml') {
    return '.svg'
  }

  if (normalized === 'application/pdf') {
    return '.pdf'
  }

  return fallback
}

function extensionFromUrl(url, allowedPattern) {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const match = pathname.match(allowedPattern)
    return match ? `.${match[1] === 'jpeg' ? 'jpg' : match[1]}` : ''
  } catch {
    return ''
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
  }

  return await response.json()
}

async function fetchGuideTagId() {
  const tags = await fetchJson(`${LEGACY_SITE_URL}/wp-json/wp/v2/tags?slug=${encodeURIComponent(TAG_SLUG)}&_fields=id,slug`)
  return tags[0]?.id || FALLBACK_TAG_ID
}

async function fetchGuidePosts(tagId) {
  return await fetchJson(`${LEGACY_SITE_URL}/wp-json/wp/v2/posts?tags=${tagId}&per_page=100&_fields=id,slug,link,title,date,modified,content,excerpt,featured_media,featured_image_src`)
}

async function fetchGuideMedia() {
  return await fetchJson(`${LEGACY_SITE_URL}/wp-json/wp/v2/media?search=Guide&per_page=100&_fields=id,slug,source_url,mime_type,post,title`)
}

function selectPdfFromMedia(post, mediaItems) {
  const pdfMedia = mediaItems.filter(item => item?.mime_type === 'application/pdf' && item?.source_url)
  const attached = pdfMedia.find(item => item.post === post.id)

  if (attached) {
    return normalizeSiteUrl(attached.source_url)
  }

  const title = resolveTitle(post)
  const postTokens = new Set(normalizeText(`${post.slug} ${title}`).split(/\s+/).filter(Boolean))
  const postYears = [...title.matchAll(/\b20\d{2}\b/g)].map(match => match[0])
  let bestCandidate = ''
  let bestScore = -1

  for (const item of pdfMedia) {
    const haystack = normalizeText(`${item.slug || ''} ${item.title?.rendered || ''} ${item.source_url || ''}`)
    const tokens = haystack.split(/\s+/).filter(Boolean)
    let score = 0

    for (const token of postTokens) {
      if (token.length > 2 && tokens.includes(token)) {
        score += 2
      }
    }

    for (const year of postYears) {
      if (haystack.includes(year)) {
        score += 3
      }
    }

    if (haystack.includes(normalizeText(post.slug).replaceAll('-', ' '))) {
      score += 4
    }

    if (score > bestScore) {
      bestScore = score
      bestCandidate = item.source_url
    }
  }

  return bestScore > 0 ? normalizeSiteUrl(bestCandidate) : ''
}

function resolvePdfUrl(post, mediaItems) {
  const direct = extractPdfUrlFromHtml(`${post?.content?.rendered || ''}\n${post?.excerpt?.rendered || ''}`)

  if (direct) {
    return direct
  }

  const mediaCandidate = selectPdfFromMedia(post, mediaItems)

  if (mediaCandidate) {
    return mediaCandidate
  }

  return manualPdfUrls.get(post.id) || ''
}

const assetCache = new Map()

async function downloadAsset(remoteUrl, directory, publicBase, options = {}) {
  const normalizedUrl = normalizeSiteUrl(remoteUrl)

  if (!normalizedUrl.startsWith('https://')) {
    return options.fallback || ''
  }

  const cached = assetCache.get(normalizedUrl)

  if (cached) {
    return cached
  }

  const hash = createHash('sha1').update(normalizedUrl).digest('hex')
  const response = await fetch(normalizedUrl, { redirect: 'follow' })
  const contentType = response.headers.get('content-type') || ''

  if (!response.ok) {
    throw new Error(`Failed to download ${normalizedUrl}: HTTP ${response.status}`)
  }

  if (options.kind === 'image' && !contentType.startsWith('image/')) {
    throw new Error(`Expected image content-type for ${normalizedUrl}, received ${contentType || 'unknown'}`)
  }

  if (options.kind === 'pdf' && !contentType.includes('application/pdf')) {
    const urlLooksLikePdf = normalizedUrl.toLowerCase().includes('.pdf')

    if (!urlLooksLikePdf) {
      throw new Error(`Expected PDF content-type for ${normalizedUrl}, received ${contentType || 'unknown'}`)
    }
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  const extension = extensionFromContentType(contentType, '')
    || extensionFromUrl(normalizedUrl, /\.(avif|gif|ico|jpe?g|pdf|png|svg|webp)$/)
    || options.defaultExtension
    || ''
  const filename = `${hash}${extension}`
  const absolutePath = resolve(directory, filename)
  const publicPath = `${publicBase}/${filename}`

  if (!existsSync(absolutePath)) {
    writeFileSync(absolutePath, bytes)
  }

  assetCache.set(normalizedUrl, publicPath)
  return publicPath
}

const tagId = await fetchGuideTagId()
const [posts, mediaItems] = await Promise.all([
  fetchGuidePosts(tagId),
  fetchGuideMedia()
])

const guides = []

for (const post of posts) {
  const title = resolveTitle(post)
  const content = removeLegacyPdfBlocks(normalizeRenderedHtml(post?.content?.rendered || '')) || '<p>Commence à écrire ici.</p>'
  const coverRemoteUrl = resolveCoverUrl(post)
  const pdfRemoteUrl = resolvePdfUrl(post, mediaItems)
  const publishedAt = new Date(post.date).toISOString()
  const updatedAt = new Date(post.modified || post.date).toISOString()

  let coverImage = '/hero.jpg'
  let pdfFile = ''

  try {
    if (coverRemoteUrl.startsWith('https://')) {
      coverImage = await downloadAsset(coverRemoteUrl, coversDir, coversPublicBase, {
        kind: 'image',
        defaultExtension: '.jpg',
        fallback: '/hero.jpg'
      })
    }
  } catch (error) {
    console.warn(`Failed to import cover for "${title}": ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    if (pdfRemoteUrl) {
      pdfFile = await downloadAsset(pdfRemoteUrl, pdfsDir, pdfsPublicBase, {
        kind: 'pdf',
        defaultExtension: '.pdf'
      })
    }
  } catch (error) {
    console.warn(`Failed to import PDF for "${title}": ${error instanceof Error ? error.message : String(error)}`)
  }

  if (!pdfFile) {
    console.warn(`No PDF resolved for legacy guide "${title}" (${post.id}).`)
  }

  guides.push({
    slug: slugify(post.slug || title) || `guide-${post.id}`,
    title,
    excerpt: createExcerpt(content),
    content,
    coverImage,
    pdfFile,
    publishedAt,
    updatedAt
  })
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

try {
  await prisma.$transaction(async (transaction) => {
    await transaction.cmsRevisionRecord.deleteMany({
      where: {
        entityType: 'guide'
      }
    })

    await transaction.guide.deleteMany()

    for (const guide of guides) {
      await transaction.guide.create({
        data: guide
      })
    }
  })
} finally {
  await prisma.$disconnect()
}

console.log(`Imported ${guides.length} guides from ${LEGACY_SITE_URL}/tag/${TAG_SLUG}/ into ${databaseUrl}`)
