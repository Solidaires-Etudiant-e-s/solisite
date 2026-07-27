import { requireAdminAccess } from '~~/server/utils/auth'
import { getSyndicatById, updateSyndicat } from '~~/server/utils/cms/syndicats'
import { fetchLdapUser } from '~~/server/utils/ldap'
import { useCmsDatabase } from '~~/server/utils/cms/database'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)

  const body = await readBody<{ syndicatId: number, ldapUid: string }>(event)
  const { syndicatId, ldapUid } = body

  if (!syndicatId || !ldapUid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'syndicatId and ldapUid are required'
    })
  }

  const syndicat = await getSyndicatById(syndicatId)
  if (!syndicat) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Syndicat not found'
    })
  }

  const ldapUser = await fetchLdapUser(ldapUid)
  if (!ldapUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'LDAP user not found'
    })
  }

  const database = await useCmsDatabase()

  const existing = await database.syndicatAuth.findUnique({
    where: { ldapUid }
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cet utilisateur Intranet est déjà lié à un syndicat.'
    })
  }

  await database.syndicatAuth.create({
    data: {
      syndicatId,
      ldapUid
    }
  })

  const updated = await updateSyndicat(syndicatId, {
    name: ldapUser.cn || syndicat.name,
    email: ldapUser.mail || syndicat.email
  }, { skipRevision: true })

  return updated
})
