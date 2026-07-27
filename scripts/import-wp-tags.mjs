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

  if (DRY_RUN) {
    const sample = [...tags.entries()].slice(0, 10)
    for (const [slug, tag] of sample) {
      console.log(`  Tag: ${tag.name} (${slug})`)
    }
    console.log('(dry run - no changes made)')
    await prisma.$disconnect()
    return
  }

  let imported = 0

  for (const [slug, tag] of tags) {
    await prisma.tag.upsert({
      where: { slug },
      update: { name: tag.name },
      create: { name: tag.name, slug }
    })
    imported++
  }

  console.log(`Imported ${imported} tags into CMS database`)
  await prisma.$disconnect()
}

function stripQuotes(value) {
  if (value === undefined || value === null) return null
  const str = String(value).trim()
  if (str === 'NULL') return null
  if (str.startsWith("'") && str.endsWith("'")) {
    let inner = str.slice(1, -1)
    inner = inner.replace(/\\\\/g, '\\')
    inner = inner.replace(/\\'/g, "'")
    return inner
  }
  return str
}

function splitSqlFields(row) {
  const fields = []
  let current = ''
  let inString = false
  let escapeNext = false

  for (let i = 0; i < row.length; i++) {
    const char = row[i]

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

    if (char === "'") {
      inString = !inString
      current += char
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
  return fields
}

function extractTags(sqlContent) {
  const tags = new Map()

  const taxonomyRegex = /INSERT INTO `wp_term_taxonomy` \([^)]+\) VALUES\n([\s\S]*?);/g
  const taxonomyMatches = [...sqlContent.matchAll(taxonomyRegex)]

  const postTagTermTaxonomyIds = new Set()

  for (const match of taxonomyMatches) {
    const block = match[1]

    let rowStart = 0
    let inString = false
    let escapeNext = false
    let parenDepth = 0

    for (let i = 0; i < block.length; i++) {
      const char = block[i]

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

      if (!inString) {
        if (char === '(') {
          if (parenDepth === 0) rowStart = i
          parenDepth++
        } else if (char === ')') {
          parenDepth--
          if (parenDepth === 0) {
            const rowStr = block.substring(rowStart + 1, i)
            const fields = splitSqlFields(rowStr)
            if (fields.length >= 3) {
              const taxonomy = stripQuotes(fields[2])
              if (taxonomy === 'post_tag') {
                const termTaxonomyId = stripQuotes(fields[0])
                postTagTermTaxonomyIds.add(termTaxonomyId)
              }
            }
          }
        }
      }
    }
  }

  const termsRegex = /INSERT INTO `wp_terms` \([^)]+\) VALUES\n([\s\S]*?);/g
  const termsMatches = [...sqlContent.matchAll(termsRegex)]

  for (const match of termsMatches) {
    const block = match[1]

    let rowStart = 0
    let inString = false
    let escapeNext = false
    let parenDepth = 0

    for (let i = 0; i < block.length; i++) {
      const char = block[i]

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

      if (!inString) {
        if (char === '(') {
          if (parenDepth === 0) rowStart = i
          parenDepth++
        } else if (char === ')') {
          parenDepth--
          if (parenDepth === 0) {
            const rowStr = block.substring(rowStart + 1, i)
            const fields = splitSqlFields(rowStr)
            if (fields.length >= 3) {
              const termId = stripQuotes(fields[0])
              const name = stripQuotes(fields[1])
              const slug = stripQuotes(fields[2])

              if (name && slug) {
                tags.set(slug, { name, slug })
              }
            }
          }
        }
      }
    }
  }

  return tags
}

main().catch((error) => {
  console.error('Error:', error.message)
  process.exit(1)
})