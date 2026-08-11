import { getQuery } from 'h3'
import { requireSyndicatWriteAccess } from '~~/server/utils/auth'
import { uploadImage } from '~~/server/utils/cms/uploads'
import { getSyndicatById } from '~~/server/utils/cms/syndicats'
import { notFound } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const syndicatId = Number(query.syndicatId)

  if (!Number.isInteger(syndicatId) || syndicatId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid syndicatId.'
    })
  }

  const syndicat = await getSyndicatById(syndicatId)

  if (!syndicat) {
    notFound(`Syndicat "${syndicatId}" not found.`)
  }

  await requireSyndicatWriteAccess(event, syndicat.id)
  return await uploadImage(event, 'syndicats')
})
