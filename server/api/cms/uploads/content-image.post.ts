import { resolveCmsAccess } from '~~/server/utils/auth'
import { uploadImage } from '~~/server/utils/cms/uploads'

export default defineEventHandler(async (event) => {
  await resolveCmsAccess(event)
  return await uploadImage(event, 'content-images')
})
