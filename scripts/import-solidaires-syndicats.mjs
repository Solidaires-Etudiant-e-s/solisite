import { Client } from 'ldapts'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const USER_DN = 'ou=users,dc=yunohost,dc=org'
const GROUP_DN = 'cn=syndicats,ou=groups,dc=yunohost,dc=org'

const [, , uidArg, passwordArg, dbArg] = process.argv

const ldapUrl = process.env.LDAP_URL || 'ldap://127.0.0.1:389'
const bindUid = uidArg
  || process.env.LDAP_BIND_UID
  || process.env.LDAP_UID
  || process.env.EMULATE_SSOWAT_UID1
  || ''
const bindPassword = passwordArg
  || process.env.LDAP_BIND_PASSWORD
  || process.env.LDAP_PASSWORD
  || process.env.EMULATE_SSOWAT_PWD1
  || ''
const bindDn = process.env.LDAP_BIND_DN || (bindUid ? `uid=${bindUid},${USER_DN}` : '')
const databaseUrl = dbArg
  ? pathToFileURL(resolve(process.cwd(), dbArg)).toString()
  : (process.env.DATABASE_URL || pathToFileURL(resolve(process.cwd(), 'data/cms.sqlite')).toString())

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function parseMemberUid(memberDn) {
  const uidPart = memberDn.split(',')[0] || ''
  return uidPart.replace(/^uid=/i, '').trim()
}

async function fetchSyndicatUidsFromLdap() {
  const client = new Client({
    url: ldapUrl,
    timeout: 10000,
    connectTimeout: 10000
  })

  try {
    if (bindDn && bindPassword) {
      await client.bind(bindDn, bindPassword)
    }

    const result = await client.search(GROUP_DN, {
      filter: '',
      scope: 'base',
      attributes: ['member']
    })

    const firstEntry = result.searchEntries?.[0]
    const rawMembers = (() => {
      if (!firstEntry || typeof firstEntry !== 'object') {
        return []
      }

      const value = firstEntry.member

      if (Array.isArray(value)) {
        return value.filter(entry => typeof entry === 'string')
      }

      return typeof value === 'string' ? [value] : []
    })()

    const uids = rawMembers
      .map(parseMemberUid)
      .filter(Boolean)

    return [...new Set(uids)].sort((left, right) => left.localeCompare(right, 'fr'))
  } finally {
    try {
      await client.unbind()
    } catch {
      // ignore LDAP disconnect failures
    }
  }
}

const uids = await fetchSyndicatUidsFromLdap()

if (!uids.length) {
  console.log('No syndicats found in LDAP group, nothing to import.')
  process.exit(0)
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

let createdCount = 0
let existingCount = 0

try {
  await prisma.$transaction(async (transaction) => {
    for (const uid of uids) {
      const uidSlug = slugify(uid)

      if (!uidSlug) {
        continue
      }

      const existing = await transaction.syndicat.findFirst({
        where: {
          OR: [
            { slug: uidSlug },
            { name: uid }
          ]
        },
        select: { id: true }
      })

      if (existing) {
        existingCount += 1
        continue
      }

      await transaction.syndicat.create({
        data: {
          slug: uidSlug,
          name: uid,
          city: '',
          email: '',
          address: '',
          socialsJson: '[]',
          content: '<p>Commence à écrire ici.</p>',
          latitude: 0,
          longitude: 0,
          updatedAt: new Date().toISOString()
        }
      })

      createdCount += 1
    }
  })
} finally {
  await prisma.$disconnect()
}

console.log(`LDAP syndicats imported into ${databaseUrl}: ${createdCount} created, ${existingCount} already existing.`)
