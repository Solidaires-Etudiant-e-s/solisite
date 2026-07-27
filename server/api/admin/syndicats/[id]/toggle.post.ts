import { requireAdminAccess } from '~~/server/utils/auth'
import { updateSyndicat } from '~~/server/utils/cms/syndicats'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)

  const id = Number(event.context.params?.id)

  if (!Number.isFinite(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid syndicat id'
    })
  }

  const body = await readBody<{ enabled: boolean }>(event)
  const { enabled } = body

  if (typeof enabled !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'enabled (boolean) is required'
    })
  }

  const updated = await updateSyndicat(id, { enabled }, { skipRevision: true })

  return updated
})
