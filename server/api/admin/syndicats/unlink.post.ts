import { requireAdminAccess } from '~~/server/utils/auth'
import { useCmsDatabase } from '~~/server/utils/cms/database'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)

  const body = await readBody<{ cmsId: number }>(event)
  const { cmsId } = body

  if (!cmsId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'cmsId is required'
    })
  }

  const database = await useCmsDatabase()

  await database.syndicatAuth.deleteMany({
    where: { syndicatId: cmsId }
  })

  return { id: cmsId }
})
