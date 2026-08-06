import { listGuideSummaries } from '~~/server/utils/cms/guides'

export default defineEventHandler(async () => {
  return await listGuideSummaries()
})
