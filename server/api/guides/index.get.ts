import { listGuides } from '~~/server/utils/cms/guides'

export default defineEventHandler(async () => {
  return await listGuides()
})
