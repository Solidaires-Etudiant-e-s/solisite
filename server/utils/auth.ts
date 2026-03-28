import { Client } from 'ldapts'
import type { H3Event } from 'h3'
import { createError } from 'h3'
import type { CmsAuthenticatedUser } from '~~/lib/cms'
import { slugify } from '~~/lib/cms'
import { getSyndicatById, listSyndicats } from './cms/syndicats'
import { getRevisionById } from './cms/revisions'

const USER_DN = 'ou=users,dc=yunohost,dc=org'
const GROUPS_DN = 'ou=groups,dc=yunohost,dc=org'
const LDAP_URL = process.env.LDAP_URL || 'ldap://127.0.0.1:10389'

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

function matchesGroup(value: unknown, expected: string) {
  if (Array.isArray(value)) {
    return value.includes(expected)
  }

  return typeof value === 'string' && value === expected
}

function normalizeIdentity(value: string) {
  const trimmed = value.trim().toLocaleLowerCase('fr')

  if (!trimmed) {
    return ''
  }

  return trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

    if (entries.some(entry => matchesGroup(entry.cn, 'admins'))) {
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

  const identity = normalizeIdentity(getYunohostUserName(event, user.name))
  const syndicats = await listSyndicats()
  const syndicat = syndicats.find((entry) => {
    const candidates = [
      entry.slug,
      entry.name,
      entry.city,
      slugify(entry.name),
      slugify(entry.city)
    ]

    return candidates.some(candidate => normalizeIdentity(candidate || '') === identity)
  })

  if (!syndicat) {
    throw createError({
      statusCode: 403,
      statusMessage: `No syndicat page matches YunoHost user "${getYunohostUserName(event, user.name)}".`
    })
  }

  return {
    user,
    managedSyndicatId: syndicat.id
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
