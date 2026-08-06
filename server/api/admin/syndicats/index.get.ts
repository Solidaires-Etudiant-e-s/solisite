import { requireAdminAccess, getLdapBindCredentials } from '~~/server/utils/auth'
import { listSyndicats } from '~~/server/utils/cms/syndicats'
import { getSyndicatUsersFromLdap } from '~~/server/utils/ldap'
import { useCmsDatabase } from '~~/server/utils/cms/database'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)

  const bindCredentials = getLdapBindCredentials(event)
  const database = await useCmsDatabase()
  const cmsSyndicats = await listSyndicats(database)

  const authLinks = await database.syndicatAuth.findMany({
    select: { syndicatId: true, ldapUid: true }
  })

  const authBySyndicatId = new Map(authLinks.map(l => [l.syndicatId, l.ldapUid]))

  const linkedLdapUids = new Set(authLinks.map(l => l.ldapUid))

  let ldapUsers: Awaited<ReturnType<typeof getSyndicatUsersFromLdap>> = []

  try {
    ldapUsers = await getSyndicatUsersFromLdap(bindCredentials)
  } catch (error) {
    console.error('[admin/syndicats] LDAP fetch failed:', error)
    // LDAP not reachable (e.g. local dev) — gracefully return no Intranet data
  }

  const ldapByUid = new Map(ldapUsers.map(u => [u.uid, u]))

  const syndicats = cmsSyndicats.map((s) => {
    const linkedUid = authBySyndicatId.get(s.id) || null
    const ldapUser = linkedUid ? ldapByUid.get(linkedUid) : null

    return {
      ...s,
      linkedIntranetUid: linkedUid,
      linkedIntranetEmail: ldapUser?.mail || null
    }
  })

  const unlinkedLdapUsers = ldapUsers.filter(u => !linkedLdapUids.has(u.uid))

  return {
    syndicats,
    unlinkedLdapUsers
  }
})
