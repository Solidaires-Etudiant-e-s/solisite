import { Client } from 'ldapts'

const USER_DN = 'ou=users,dc=yunohost,dc=org'
const GROUP_DN = 'cn=syndicats,ou=groups,dc=yunohost,dc=org'
const LDAP_URL = process.env.LDAP_URL || 'ldap://127.0.0.1:10389'
const ADMIN_BIND_DN = process.env.LDAP_ADMIN_BIND_DN || `uid=admin,${USER_DN}`
const ADMIN_BIND_PASSWORD = process.env.LDAP_ADMIN_BIND_PASSWORD

export interface LdapSyndicat {
  uid: string
  cn: string
  mail: string
  description: string
}

function toString(value: unknown): string {
  if (value === undefined || value === null) {
    return ''
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('utf-8')
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : ''
  }

  return String(value)
}

async function createAdminClient(): Promise<Client> {
  const client = new Client({
    url: LDAP_URL,
    timeout: 10000,
    connectTimeout: 10000
  })

  await client.bind(ADMIN_BIND_DN, ADMIN_BIND_PASSWORD)
  return client
}

function parseMemberUid(memberDn: string): string {
  const uidPart = memberDn.split(',')[0] || ''
  return uidPart.replace(/^uid=/i, '').trim()
}

export async function fetchAllSyndicatsFromLdap(): Promise<LdapSyndicat[]> {
  const client = await createAdminClient()

  try {
    const groupResult = await client.search(GROUP_DN, {
      filter: '',
      scope: 'base',
      attributes: ['member']
    })

    const firstEntry = groupResult.searchEntries?.[0]
    if (!firstEntry || !firstEntry.member) {
      return []
    }

    const rawMembers = Array.isArray(firstEntry.member)
      ? firstEntry.member.filter((entry): entry is string => typeof entry === 'string')
      : typeof firstEntry.member === 'string'
        ? [firstEntry.member]
        : []

    const uids = [...new Set(rawMembers.map(parseMemberUid).filter(Boolean))]

    if (!uids.length) {
      return []
    }

    const syndicats: LdapSyndicat[] = []

    for (const uid of uids) {
      try {
        const userResult = await client.search(`uid=${uid},${USER_DN}`, {
          filter: '',
          scope: 'base',
          attributes: ['cn', 'mail', 'description']
        })

        const userEntry = userResult.searchEntries?.[0]
        if (userEntry) {
          syndicats.push({
            uid,
            cn: toString(userEntry.cn),
            mail: toString(userEntry.mail),
            description: toString(userEntry.description)
          })
        }
      } catch {
        // Skip users that can't be fetched
      }
    }

    return syndicats.sort((a, b) => a.cn.localeCompare(b.cn, 'fr'))
  } finally {
    try {
      await client.unbind()
    } catch {
      // ignore LDAP disconnect failures
    }
  }
}

export async function getSyndicatUsersFromLdap(): Promise<LdapSyndicat[]> {
  return fetchAllSyndicatsFromLdap()
}

export async function fetchLdapUser(uid: string): Promise<LdapSyndicat | null> {
  const client = await createAdminClient()

  try {
    const userResult = await client.search(`uid=${uid},${USER_DN}`, {
      filter: '',
      scope: 'base',
      attributes: ['cn', 'mail', 'description']
    })

    const userEntry = userResult.searchEntries?.[0]
    if (!userEntry) {
      return null
    }

    return {
      uid,
      cn: toString(userEntry.cn),
      mail: toString(userEntry.mail),
      description: toString(userEntry.description)
    }
  } finally {
    try {
      await client.unbind()
    } catch {
      // ignore LDAP disconnect failures
    }
  }
}
