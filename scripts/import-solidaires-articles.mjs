import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Database } from 'bun:sqlite'
import MarkdownIt from 'markdown-it'

const [, , sourceArg, dbArg] = process.argv

const sourceDir = resolve(process.cwd(), sourceArg || '/tmp/sesl-contents/articles')
const databasePath = resolve(process.cwd(), dbArg || process.env.NUXT_SQLITE_PATH || 'data/cms.sqlite')
const coversDir = resolve(process.cwd(), 'public/uploads/articles/imported')
const coversPublicBase = '/uploads/articles/imported'

if (!existsSync(sourceDir)) {
  console.error(`Source directory not found: ${sourceDir}`)
  process.exit(1)
}

if (!existsSync(databasePath)) {
  console.error(`Database not found: ${databasePath}`)
  process.exit(1)
}

mkdirSync(coversDir, { recursive: true })

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false
})

function parseFrontmatter(fileContents) {
  const match = fileContents.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)

  if (!match) {
    return {
      attributes: {},
      body: fileContents
    }
  }

  const [, rawFrontmatter, body] = match
  const attributes = {}

  for (const line of rawFrontmatter.split('\n')) {
    const keyValueMatch = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/)

    if (!keyValueMatch) {
      continue
    }

    const [, key, rawValue] = keyValueMatch
    const value = rawValue.trim()

    if (!value) {
      continue
    }

    attributes[key] = value.replace(/^['"]|['"]$/g, '')
  }

  return { attributes, body }
}

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase()
}

function normalizeMarkdownBody(body, title) {
  const normalizedTitle = normalizeText(title)
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const result = []
  let skippedLeadingBlock = false

  for (const line of lines) {
    if (!skippedLeadingBlock) {
      const trimmed = line.trim()

      if (!trimmed) {
        continue
      }

      const headingMatch = trimmed.match(/^#\s+(.*)$/)

      if (headingMatch && normalizeText(headingMatch[1]) === normalizedTitle) {
        skippedLeadingBlock = true
        continue
      }

      skippedLeadingBlock = true
    }

    result.push(line)
  }

  return result.join('\n')
    .replaceAll('http://www.solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replaceAll('http://solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replaceAll('https://www.solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replaceAll('https://solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replaceAll('http://www.solidaires-etudiant-e-s.org', 'https://solidaires-etudiant-e-s.org')
    .replaceAll('http://solidaires-etudiant-e-s.org', 'https://solidaires-etudiant-e-s.org')
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
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

function normalizeRenderedHtml(html) {
  return html
    .replaceAll('http://www.solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replaceAll('http://solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replaceAll('https://www.solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replaceAll('https://solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replaceAll('www.solidaires-etudiant.org/', 'solidaires-etudiant-e-s.org/')
    .replaceAll('www.solidaires-etudiant.org', 'solidaires-etudiant-e-s.org')
    .replaceAll('solidaires-etudiant.org/', 'solidaires-etudiant-e-s.org/')
    .replaceAll('>solidaires-etudiant.org<', '>solidaires-etudiant-e-s.org<')
}

function deriveSlug(filename) {
  return filename
    .replace(/\.md$/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
}

function deriveIsoDate(rawDate, filename) {
  const source = rawDate || filename.slice(0, 10)
  const match = source.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    throw new Error(`Missing valid date for ${filename}`)
  }

  return `${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`
}

function normalizeSiteUrl(value) {
  return value
    .replace(/^http:\/\//i, 'https://')
    .replace('https://www.solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replace('https://solidaires-etudiant.org', 'https://solidaires-etudiant-e-s.org')
    .replace('https://www.solidaires-etudiant-e-s.org', 'https://solidaires-etudiant-e-s.org')
}

function toUploadsUrl(value) {
  const normalized = normalizeSiteUrl(value)

  return normalized
    .replace('https://solidaires-etudiant-e-s.org/wp-content/uploads/', 'https://solidaires-etudiant-e-s.org/site/wp-content/uploads/')
    .replace('https://solidaires-etudiant-e-s.org/site/site/wp-content/uploads/', 'https://solidaires-etudiant-e-s.org/site/wp-content/uploads/')
}

function toDownloadUrl(value) {
  const uploadsUrl = toUploadsUrl(value)

  if (!uploadsUrl.includes('/site/wp-content/uploads/')) {
    return uploadsUrl
  }

  return `https://solidaires-etudiant-e-s.org/site/wp-content/webpc-passthru.php?src=${encodeURIComponent(uploadsUrl)}&nocache=1`
}

function deriveCoverImage(rawCoverImage, publishedAt) {
  const coverImage = (rawCoverImage || '').trim()

  if (!coverImage) {
    return '/hero.jpg'
  }

  if (/^https?:\/\//i.test(coverImage)) {
    return normalizeSiteUrl(coverImage)
  }

  const [year, month] = publishedAt.slice(0, 7).split('-')

  return `https://solidaires-etudiant-e-s.org/site/wp-content/uploads/${year}/${month}/${encodeURIComponent(coverImage)}`
}

function extensionFromContentType(contentType) {
  const normalized = (contentType || '').split(';')[0].trim().toLowerCase()

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

  if (normalized === 'image/x-icon' || normalized === 'image/vnd.microsoft.icon') {
    return '.ico'
  }

  return ''
}

function extensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const match = pathname.match(/\.(avif|gif|ico|jpe?g|png|svg|webp)$/)

    return match ? `.${match[1] === 'jpeg' ? 'jpg' : match[1]}` : ''
  } catch {
    return ''
  }
}

const coverCache = new Map()

async function downloadCoverImage(remoteUrl) {
  if (!remoteUrl.startsWith('https://')) {
    return '/hero.jpg'
  }

  const cached = coverCache.get(remoteUrl)

  if (cached) {
    return cached
  }

  const hash = createHash('sha1').update(remoteUrl).digest('hex')

  try {
    const normalizedUrl = normalizeSiteUrl(remoteUrl)
    const downloadUrl = toDownloadUrl(normalizedUrl)
    const response = await fetch(downloadUrl, {
      redirect: 'follow'
    })
    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    if (!contentType.startsWith('image/')) {
      throw new Error(`Expected image content-type, received ${contentType || 'unknown'}`)
    }

    const bytes = Buffer.from(await response.arrayBuffer())
    const extension = extensionFromContentType(contentType) || extensionFromUrl(normalizedUrl) || '.jpg'
    const filename = `${hash}${extension}`
    const absolutePath = resolve(coversDir, filename)
    const publicPath = `${coversPublicBase}/${filename}`

    if (!existsSync(absolutePath)) {
      writeFileSync(absolutePath, bytes)
    }

    coverCache.set(remoteUrl, publicPath)
    return publicPath
  } catch (error) {
    console.warn(`Failed to download cover ${remoteUrl}: ${error instanceof Error ? error.message : String(error)}`)
    coverCache.set(remoteUrl, '/hero.jpg')
    return '/hero.jpg'
  }
}

const files = readdirSync(sourceDir)
  .filter(file => file.endsWith('.md'))
  .sort((a, b) => a.localeCompare(b))

const articles = files.map((filename) => {
  const fileContents = readFileSync(resolve(sourceDir, filename), 'utf8')
  const { attributes, body } = parseFrontmatter(fileContents)
  const title = (attributes.title || deriveSlug(filename)).trim()
  const publishedAt = deriveIsoDate(attributes.date, filename)
  const content = normalizeRenderedHtml(markdown.render(normalizeMarkdownBody(body, title)).trim())

  if (!content) {
    throw new Error(`Rendered HTML is empty for ${filename}`)
  }

  return {
    slug: deriveSlug(filename),
    title,
    excerpt: createExcerpt(content),
    content,
    coverImage: deriveCoverImage(attributes.coverImage, publishedAt),
    publishedAt,
    updatedAt: publishedAt
  }
})

for (const article of articles) {
  article.coverImage = await downloadCoverImage(article.coverImage)
}

const database = new Database(databasePath)

database.exec('BEGIN')

try {
  database.exec('DELETE FROM articles')
  database.exec('DELETE FROM sqlite_sequence WHERE name = \'articles\'')

  const insertArticle = database.query(`
    INSERT INTO articles (slug, title, excerpt, content, cover_image, published_at, updated_at)
    VALUES ($slug, $title, $excerpt, $content, $coverImage, $publishedAt, $updatedAt)
  `)

  for (const article of articles) {
    insertArticle.run({
      $slug: article.slug,
      $title: article.title,
      $excerpt: article.excerpt,
      $content: article.content,
      $coverImage: article.coverImage,
      $publishedAt: article.publishedAt,
      $updatedAt: article.updatedAt
    })
  }

  database.exec('COMMIT')
} catch (error) {
  database.exec('ROLLBACK')
  throw error
} finally {
  database.close()
}

console.log(`Imported ${articles.length} articles into ${databasePath}`)
