import { cmsRevisionEntityTypes, type CmsRevisionEntityType } from '~~/lib/cms'
import { requireRevisionReadAccess } from '~~/server/utils/auth'
import { listRevisions } from '~~/server/utils/cms/revisions'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const entityType = query.entityType
  const entityId = query.entityId

  if (typeof entityType !== 'string' || typeof entityId !== 'string' || !entityId || !cmsRevisionEntityTypes.includes(entityType as CmsRevisionEntityType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid revision query.'
    })
  }

  await requireRevisionReadAccess(event, entityType, entityId)
  return await listRevisions(entityType as CmsRevisionEntityType, entityId)
})
