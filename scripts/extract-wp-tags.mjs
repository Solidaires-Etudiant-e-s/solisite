import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { resolve } from 'node:path'

if (existsSync('.env')) {
  loadEnvFile('.env')
}

const WP_SQL_PATH = resolve(process.cwd(), process.argv[2] || '/home/eban/Downloads/wordpress.sql')
const OUTPUT_PATH = resolve(process.cwd(), process.argv[3] || '/home/eban/Downloads/wordpress-tags.json')

if (!existsSync(WP_SQL_PATH)) {
  throw new Error(`WordPress SQL dump not found: ${WP_SQL_PATH}`)
}

const sqlContent = readFileSync(WP_SQL_PATH, 'utf-8')

function parseTableData(tableName) {
  const regex = new RegExp(
    `INSERT INTO \`${tableName}\` \\([^)]+\\) VALUES\\n([\\s\\S]*?);`,
    'g'
  )
  const matches = []
  let match

  while ((match = regex.exec(sqlContent)) !== null) {
    matches.push(match[1])
  }

  return matches
}

function parseValuesBlock(block) {
  const rows = []
  const valueRegex = /\(([^)]+)\)/g
  let rowMatch

  while ((rowMatch = valueRegex.exec(block)) !== null) {
    const raw = rowMatch[1]
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
        continue
      }

      if (char === "'") {
        inString = !inString
        continue
      }

      if (char === ',' && !inString) {
        fields.push(current.trim())
        current = ''
        continue
      }

      current += char
    }

    fields.push(current.trim())
    rows.push(fields)
  }

  return rows
}

function getValue(row, index) {
  const val = row[index]
  if (val === undefined || val === null) return null
  if (val === 'NULL') return null
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/\\\\/g, '\\').replace(/\\'/g, "'")
  }
  return val
}

const wpPostsBlocks = parseTableData('wp_posts')
const wpTermsBlocks = parseTableData('wp_terms')
const wpTermTaxonomyBlocks = parseTableData('wp_term_taxonomy')
const wpTermRelationshipsBlocks = parseTableData('wp_term_relationships')

const wpPosts = []
for (const block of wpPostsBlocks) {
  const rows = parseValuesBlock(block)
  for (const row of rows) {
    wpPosts.push({
      id: getValue(row, 0),
      postName: getValue(row, 11),
      postType: getValue(row, 20),
      postStatus: getValue(row, 7)
    })
  }
}

const taxonomyMap = new Map()
for (const block of wpTermTaxonomyBlocks) {
  const rows = parseValuesBlock(block)
  for (const row of rows) {
    const taxonomy = getValue(row, 2)
    if (taxonomy === 'post_tag') {
      const termTaxonomyId = getValue(row, 0)
      const termId = getValue(row, 1)
      taxonomyMap.set(termTaxonomyId, termId)
    }
  }
}

const termsMap = new Map()
for (const block of wpTermsBlocks) {
  const rows = parseValuesBlock(block)
  for (const row of rows) {
    const termId = getValue(row, 0)
    const name = getValue(row, 1)
    const slug = getValue(row, 2)
    termsMap.set(termId, { name, slug })
  }
}

const postTagMap = new Map()
for (const post of wpPosts) {
  if (post.postType !== 'post' || post.postStatus !== 'publish') continue
  postTagMap.set(post.postName, [])
}

for (const block of wpTermRelationshipsBlocks) {
  const rows = parseValuesBlock(block)
  for (const row of rows) {
    const objectId = getValue(row, 0)
    const termTaxonomyId = getValue(row, 1)

    const termId = taxonomyMap.get(termTaxonomyId)
    if (!termId) continue

    const term = termsMap.get(termId)
    if (!term) continue

    const wpPost = wpPosts.find(p => p.id === objectId)
    if (!wpPost || wpPost.postType !== 'post' || wpPost.postStatus !== 'publish') continue

    const existing = postTagMap.get(wpPost.postName)
    if (existing) {
      existing.push({ name: term.name, slug: term.slug })
    }
  }
}

const result = {}
for (const [wpSlug, tags] of postTagMap) {
  const uniqueTags = []
  const seen = new Set()
  for (const tag of tags) {
    if (!seen.has(tag.slug)) {
      seen.add(tag.slug)
      uniqueTags.push(tag)
    }
  }
  result[wpSlug] = uniqueTags
}

writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8')

const articleCount = Object.keys(result).length
const totalTags = Object.values(result).flat().length
const uniqueSlugs = new Set(Object.values(result).flat().map(t => t.slug))

console.log(`Extracted tags for ${articleCount} WordPress posts`)
console.log(`Total tag assignments: ${totalTags}`)
console.log(`Unique tags: ${uniqueSlugs.size}`)
console.log(`Output: ${OUTPUT_PATH}`)