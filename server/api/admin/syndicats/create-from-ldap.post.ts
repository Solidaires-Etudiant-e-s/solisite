import { requireAdminAccess } from '~~/server/utils/auth'
import { createSyndicat, updateSyndicat } from '~~/server/utils/cms/syndicats'
import { fetchLdapUser } from '~~/server/utils/ldap'
import { useCmsDatabase } from '~~/server/utils/cms/database'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)

  const body = await readBody<{ ldapUid: string }>(event)
  const { ldapUid } = body

  if (!ldapUid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ldapUid is required'
    })
  }

  const ldapUser = await fetchLdapUser(ldapUid)

  if (!ldapUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'LDAP user not found'
    })
  }

  const syndicat = await createSyndicat()

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
      syndicatId: syndicat.id,
      ldapUid
    }
  })

  const updated = await updateSyndicat(syndicat.id, {
    name: ldapUser.cn || syndicat.name,
    email: ldapUser.mail || syndicat.email,
    city: ldapUser.description?.split('\n')[0] || syndicat.city
  }, { skipRevision: true })

  return updated
})
