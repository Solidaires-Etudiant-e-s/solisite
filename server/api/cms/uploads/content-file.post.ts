import { resolveCmsAccess } from '~~/server/utils/auth'
import { uploadDocument } from '~~/server/utils/cms/uploads'

export default defineEventHandler(async (event) => {
  await resolveCmsAccess(event)
  return await uploadDocument(event, 'content-files')
})
