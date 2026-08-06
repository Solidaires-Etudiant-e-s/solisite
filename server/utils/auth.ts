import { Client } from 'ldapts'
import type { H3Event } from 'h3'
import { createError } from 'h3'
import type { CmsAuthenticatedUser } from '~~/lib/cms'
import { getSyndicatById } from './cms/syndicats'
import { getRevisionById } from './cms/revisions'
import { useCmsDatabase } from './cms/database'

const USER_DN = 'ou=users,dc=yunohost,dc=org'
const GROUPS_DN = 'ou=groups,dc=yunohost,dc=org'
const LDAP_URL = process.env.LDAP_URL || 'ldap://127.0.0.1:10389'
const ADMIN_GROUPS = ['admins', 'commissions'] as const

export const enum CmsRole {
  ADMIN = 'admin',
  SYNDICAT = 'syndicat'
}

interface CmsAccessContext {
  user: CmsAuthenticatedUser
  managedSyndicatId: number | null
}

function getAuthorizationToken(event: H3Event) {
  const authHeader = event.node.req.headers.authorization

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing authorization header.'
    })
  }

  const token = String(authHeader).split(' ')[1]

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing authorization token.'
    })
  }

  return token
}

export function getLdapBindCredentials(event: H3Event): { bindDn: string, bindPassword: string } {
  const token = getAuthorizationToken(event)
  const [uid, password] = Buffer.from(token, 'base64').toString().split(':')

  if (!uid || !password) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid authorization token.'
    })
  }

  return {
    bindDn: `uid=${uid},${USER_DN}`,
    bindPassword: password
  }
}

function matchesGroup(value: unknown, expected: string) {
  if (Array.isArray(value)) {
    return value.includes(expected)
  }

  return typeof value === 'string' && value === expected
}

function getYunohostUserName(event: H3Event, fallbackName: string) {
  const ynhUser = String(event.node.req.headers.ynh_user ?? '').trim()
  return ynhUser || fallbackName
}

export async function getAuthenticatedUser(event: H3Event): Promise<CmsAuthenticatedUser> {
  const token = getAuthorizationToken(event)
  const [uid, password] = Buffer.from(token, 'base64').toString().split(':')

  if (!uid || !password) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid authorization token.'
    })
  }

  const client = new Client({
    url: LDAP_URL,
    timeout: 10000,
    connectTimeout: 10000
  })

  try {
    await client.bind(`uid=${uid},${USER_DN}`, password)

    const result = await client.search(GROUPS_DN, {
      filter: `(&(objectClass=posixGroup)(memberUid=${uid}))`,
      scope: 'sub',
      attributes: ['cn']
    })

    const entries = result.searchEntries ?? []

    if (entries.some(entry => ADMIN_GROUPS.some(group => matchesGroup(entry.cn, group)))) {
      return { name: uid, role: CmsRole.ADMIN }
    }

    if (entries.some(entry => matchesGroup(entry.cn, 'syndicats'))) {
      return { name: uid, role: CmsRole.SYNDICAT }
    }

    throw createError({
      statusCode: 403,
      statusMessage: 'No matching LDAP group.'
    })
  } finally {
    try {
      await client.unbind()
    } catch {
      // ignore LDAP disconnect failures
    }
  }
}

export async function resolveCmsAccess(event: H3Event): Promise<CmsAccessContext> {
  const user = await getAuthenticatedUser(event)

  if (user.role === CmsRole.ADMIN) {
    return {
      user,
      managedSyndicatId: null
    }
  }

  const ldapUid = getYunohostUserName(event, user.name)

  const database = await useCmsDatabase()
  const authLink = await database.syndicatAuth.findUnique({
    where: { ldapUid },
    include: { syndicat: { select: { id: true, enabled: true } } }
  })

  if (!authLink) {
    throw createError({
      statusCode: 403,
      statusMessage: `Aucun syndicat lié à l'utilisateur Intranet "${ldapUid}". Contactez un administrateur.`
    })
  }

  if (!authLink.syndicat.enabled) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Votre syndicat a été désactivé. Contactez un administrateur.'
    })
  }

  return {
    user,
    managedSyndicatId: authLink.syndicat.id
  }
}

export async function requireAdminAccess(event: H3Event) {
  const access = await resolveCmsAccess(event)

  if (access.user.role !== CmsRole.ADMIN) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required.'
    })
  }

  return access
}

export async function requireSyndicatWriteAccess(event: H3Event, syndicatId: number) {
  const access = await resolveCmsAccess(event)

  if (access.user.role === CmsRole.ADMIN) {
    return access
  }

  if (access.managedSyndicatId !== syndicatId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You may only update your own syndicat page.'
    })
  }

  return access
}

export async function requireRevisionReadAccess(event: H3Event, entityType: string, entityId: string) {
  const access = await resolveCmsAccess(event)

  if (access.user.role === CmsRole.ADMIN) {
    return access
  }

  if (entityType !== 'syndicat' || access.managedSyndicatId !== Number(entityId)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You may only access revisions for your own syndicat page.'
    })
  }

  return access
}

export async function requireRevisionRestoreAccess(event: H3Event, revisionId: number) {
  const access = await resolveCmsAccess(event)

  if (access.user.role === CmsRole.ADMIN) {
    return access
  }

  const revision = await getRevisionById(revisionId)

  if (!revision || revision.entityType !== 'syndicat' || access.managedSyndicatId !== Number(revision.entityId)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You may only restore revisions for your own syndicat page.'
    })
  }

  return access
}

export async function getManagedSyndicatById(managedSyndicatId: number | null) {
  if (!managedSyndicatId) {
    return null
  }

  return await getSyndicatById(managedSyndicatId)
}
