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

function extractInsertBlocks(tableName) {
  const blocks = []
  const startMarker = `INSERT INTO \`${tableName}\` (`
  let searchFrom = 0

  while (true) {
    const startIdx = sqlContent.indexOf(startMarker, searchFrom)
    if (startIdx === -1) break

    const valuesIdx = sqlContent.indexOf(') VALUES', startIdx)
    if (valuesIdx === -1) break

    const blockStart = valuesIdx + ') VALUES'.length
    let i = blockStart
    while (i < sqlContent.length && /\s/.test(sqlContent[i])) i++

    let inString = false
    let escapeNext = false
    let parenDepth = 0
    let endIdx = -1

    for (; i < sqlContent.length; i++) {
      const char = sqlContent[i]
      if (escapeNext) {
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
      if (inString) continue
      if (char === '(') {
        parenDepth++
        continue
      }
      if (char === ')') {
        parenDepth--
        continue
      }
      if (char === ';' && parenDepth === 0) {
        endIdx = i
        break
      }
    }

    if (endIdx === -1) break
    blocks.push(sqlContent.slice(blockStart, endIdx))
    searchFrom = endIdx + 1
  }

  return blocks
}

function parseTableData(tableName) {
  return extractInsertBlocks(tableName)
}

function parseValuesBlock(block) {
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
          const fields = []
          let field = ''
          let fInString = false
          let fEscapeNext = false

          for (let j = 0; j < current.length; j++) {
            const fChar = current[j]
            if (fEscapeNext) {
              field += fChar
              fEscapeNext = false
              continue
            }
            if (fChar === '\\') {
              fEscapeNext = true
              field += fChar
              continue
            }
            if (fChar === '\'') {
              fInString = !fInString
              field += fChar
              continue
            }
            if (fChar === ',' && !fInString) {
              fields.push(field.trim())
              field = ''
              continue
            }
            field += fChar
          }
          fields.push(field.trim())
          rows.push(fields)
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

function getValue(row, index) {
  const val = row[index]
  if (val === undefined || val === null) return null
  if (val === 'NULL') return null
  if (val.startsWith('\'') && val.endsWith('\'')) {
    return val.slice(1, -1).replace(/\\\\/g, '\\').replace(/\\'/g, '\'')
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
