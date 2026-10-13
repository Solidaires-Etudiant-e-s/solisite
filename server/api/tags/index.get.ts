import { listTags } from '~~/server/utils/cms/tags'

export default defineEventHandler(async () => {
  return await listTags()
})
