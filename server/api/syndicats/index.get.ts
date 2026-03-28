import { listSyndicats } from '~~/server/utils/cms/syndicats'

export default defineEventHandler(async () => {
  return await listSyndicats()
})
