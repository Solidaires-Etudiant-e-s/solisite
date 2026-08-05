import { existsSync, readFileSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

if (existsSync('.env')) {
  loadEnvFile('.env')
}

const WP_SQL_PATH = resolve(process.cwd(), process.argv[2] || '/home/eban/Downloads/wordpress.sql')
const DRY_RUN = process.argv.includes('--dry-run')

if (!existsSync(WP_SQL_PATH)) {
  throw new Error(`WordPress SQL dump not found: ${WP_SQL_PATH}`)
}

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

async function main() {
  const adapter = new PrismaMariaDb(DATABASE_URL)
  const prisma = new PrismaClient({ adapter })
  await prisma.$connect()

  console.log('Parsing WordPress SQL dump...')
  const sqlContent = readFileSync(WP_SQL_PATH, 'utf-8')

  const tags = extractTags(sqlContent)
  console.log(`Found ${tags.size} unique WordPress post tags`)

  const postSlugToPostId = extractPosts(sqlContent)
  console.log(`Found ${postSlugToPostId.size} published WordPress posts`)

  const { postTagTermTaxonomyIds, termTaxonomyIdToTermId } = extractTaxonomy(sqlContent)
  console.log(`  WordPress post_tag taxonomies: ${postTagTermTaxonomyIds.size}`)

  const termIdToSlug = new Map()
  extractTerms(sqlContent, termIdToSlug)
  console.log(`  WordPress terms: ${termIdToSlug.size}`)

  const postIdToTermTaxonomyIds = extractRelationships(sqlContent, postTagTermTaxonomyIds)
  console.log(`  Posts with tag relationships: ${postIdToTermTaxonomyIds.size}`)

  const cmsArticles = await prisma.article.findMany({
    select: { slug: true, id: true }
  })
  const cmsBySlug = new Map(cmsArticles.map(a => [a.slug, a]))
  console.log(`Found ${cmsArticles.length} CMS articles`)

  let matched = 0
  let linked = 0

  for (const [wpSlug, postId] of postSlugToPostId) {
    const termTaxonomyIds = postIdToTermTaxonomyIds.get(postId) || []
    const tagSlugs = new Set()

    for (const ttId of termTaxonomyIds) {
      const termId = termTaxonomyIdToTermId.get(ttId)
      const slug = termId && termIdToSlug.get(termId)
      if (slug && tags.has(slug)) {
        tagSlugs.add(slug)
      }
    }

    if (tagSlugs.size === 0) continue

    const article = cmsBySlug.get(wpSlug)
    if (!article) continue

    const dbTags = [...tagSlugs].map(s => tags.get(s))
    matched++

    if (DRY_RUN) {
      console.log(`  [dry] ${wpSlug} -> ${dbTags.map(t => t.name).join(', ')}`)
      continue
    }

    await syncArticleTags(prisma, article.id, dbTags)
    linked++
  }

  if (DRY_RUN) {
    console.log(`(dry run - would link tags to ${matched} articles)`)
  } else {
    console.log(`Linked tags to ${linked} CMS articles`)
  }

  await prisma.$disconnect()
}

function stripQuotes(value) {
  if (value === undefined || value === null) return null
  const str = String(value).trim()
  if (str === 'NULL') return null
  if (str.startsWith('\'') && str.endsWith('\'')) {
    let inner = str.slice(1, -1)
    inner = inner.replace(/\\\\/g, '\\')
    inner = inner.replace(/\\'/g, '\'')
    return inner
  }
  return str
}

function splitFields(raw) {
  const fields = []
  let current = ''
  let inString = false
  let escapeNext = false

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i]
    if (escapeNext) {
      current += char
      escapeNext = false
      continue
    }
    if (char === '\\') {
      escapeNext = true
      current += char
      continue
    }
    if (char === '\'') {
      inString = !inString
      current += char
      continue
    }
    if (char === ',' && !inString) {
      fields.push(current)
      current = ''
      continue
    }
    current += char
  }
  fields.push(current)
  return fields
}

function extractRows(block) {
  const rows = []
  let current = ''
  let inString = false
  let escapeNext = false
  let parenDepth = 0

  for (let i = 0; i < block.length; i++) {
    const char = block[i]
    if (escapeNext) {
      current += char
      escapeNext = false
      continue
    }
    if (char === '\\') {
      escapeNext = true
      current += char
      continue
    }
    if (char === '\'') {
      inString = !inString
      current += char
      continue
    }
    if (!inString) {
      if (char === '(') {
        if (parenDepth === 0) current = ''
        parenDepth++
        if (parenDepth > 1) current += char
        continue
      }
      if (char === ')') {
        parenDepth--
        if (parenDepth === 0) {
          rows.push(splitFields(current))
          current = ''
          continue
        }
        current += char
        continue
      }
    }
    current += char
  }

  return rows
}

function extractTags(sqlContent) {
  const tags = new Map()

  const taxonomyRegex = /INSERT INTO `wp_term_taxonomy` \([^)]+\) VALUES\n([\s\S]*?);/g
  const taxonomyMatches = [...sqlContent.matchAll(taxonomyRegex)]

  const postTagTermTaxonomyIds = new Set()

  for (const match of taxonomyMatches) {
    const block = match[1]
    for (const fields of extractRows(block)) {
      if (fields.length < 3) continue
      const taxonomy = stripQuotes(fields[2])
      if (taxonomy === 'post_tag') {
        postTagTermTaxonomyIds.add(stripQuotes(fields[0]))
      }
    }
  }

  const termsRegex = /INSERT INTO `wp_terms` \([^)]+\) VALUES\n([\s\S]*?);/g
  const termsMatches = [...sqlContent.matchAll(termsRegex)]

  for (const match of termsMatches) {
    const block = match[1]
    for (const fields of extractRows(block)) {
      if (fields.length < 3) continue
      const name = stripQuotes(fields[1])
      const slug = stripQuotes(fields[2])
      if (name && slug) {
        tags.set(slug, { name, slug })
      }
    }
  }

  return tags
}

function extractPosts(sqlContent) {
  const postSlugToId = new Map()

  const postsRegex = /INSERT INTO `wp_posts` \([^)]+\) VALUES\n([\s\S]*?);/g
  const postsMatches = [...sqlContent.matchAll(postsRegex)]

  for (const match of postsMatches) {
    const block = match[1]
    for (const fields of extractRows(block)) {
      if (fields.length < 22) continue
      const postType = stripQuotes(fields[20])
      const postName = stripQuotes(fields[11])
      const postId = stripQuotes(fields[0])
      if (postType === 'post' && postName && postId) {
        postSlugToId.set(postName, postId)
      }
    }
  }

  return postSlugToId
}

function extractTaxonomy(sqlContent) {
  const postTagTermTaxonomyIds = new Set()
  const termTaxonomyIdToTermId = new Map()

  const taxonomyRegex = /INSERT INTO `wp_term_taxonomy` \([^)]+\) VALUES\n([\s\S]*?);/g
  const taxonomyMatches = [...sqlContent.matchAll(taxonomyRegex)]

  for (const match of taxonomyMatches) {
    const block = match[1]
    for (const fields of extractRows(block)) {
      if (fields.length < 3) continue
      const taxonomy = stripQuotes(fields[2])
      if (taxonomy === 'post_tag') {
        postTagTermTaxonomyIds.add(stripQuotes(fields[0]))
        termTaxonomyIdToTermId.set(
          stripQuotes(fields[0]),
          stripQuotes(fields[1])
        )
      }
    }
  }

  return { postTagTermTaxonomyIds, termTaxonomyIdToTermId }
}

function extractTerms(sqlContent, termIdToSlug) {
  const termsRegex = /INSERT INTO `wp_terms` \([^)]+\) VALUES\n([\s\S]*?);/g
  const termsMatches = [...sqlContent.matchAll(termsRegex)]

  for (const match of termsMatches) {
    const block = match[1]
    for (const fields of extractRows(block)) {
      if (fields.length < 3) continue
      const termId = stripQuotes(fields[0])
      const slug = stripQuotes(fields[2])
      if (termId && slug) {
        termIdToSlug.set(termId, slug)
      }
    }
  }
}

function extractRelationships(sqlContent, postTagTermTaxonomyIds) {
  const postIdToTermTaxonomyIds = new Map()

  const relRegex = /INSERT INTO `wp_term_relationships` \([^)]+\) VALUES\n([\s\S]*?);/g
  const relMatches = [...sqlContent.matchAll(relRegex)]

  for (const match of relMatches) {
    const block = match[1]
    for (const fields of extractRows(block)) {
      if (fields.length < 2) continue
      const objectId = stripQuotes(fields[0])
      const termTaxonomyId = stripQuotes(fields[1])
      if (postTagTermTaxonomyIds.has(termTaxonomyId)) {
        const existing = postIdToTermTaxonomyIds.get(objectId) || []
        existing.push(termTaxonomyId)
        postIdToTermTaxonomyIds.set(objectId, existing)
      }
    }
  }

  return postIdToTermTaxonomyIds
}

async function syncArticleTags(prisma, articleId, tags) {
  const existing = await prisma.articleTag.findMany({
    where: { articleId },
    select: { tagId: true }
  })
  const existingTagIds = existing.map(e => e.tagId)

  const dbTags = await prisma.tag.findMany({
    where: { slug: { in: tags.map(t => t.slug) } }
  })
  const dbTagIds = new Set(dbTags.map(t => t.id))
  const dbTagSlugs = new Set(dbTags.map(t => t.slug))

  for (const tag of tags) {
    if (!dbTagSlugs.has(tag.slug)) {
      const created = await prisma.tag.create({ data: { name: tag.name, slug: tag.slug } })
      dbTagIds.add(created.id)
    }
  }

  const targetTagIds = new Set(dbTagIds)
  const tagsToRemove = existingTagIds.filter(id => !targetTagIds.has(id))
  if (tagsToRemove.length) {
    await prisma.articleTag.deleteMany({
      where: { articleId, tagId: { in: tagsToRemove } }
    })
  }

  const tagsToAdd = [...targetTagIds].filter(id => !existingTagIds.includes(id))
  for (const tagId of tagsToAdd) {
    await prisma.articleTag.create({ data: { articleId, tagId } })
  }
}

main().catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})
