import { listSyndicats } from '~~/server/utils/cms/syndicats'

export default defineEventHandler(async () => {
  const syndicats = await listSyndicats()
  return syndicats.filter(s => s.enabled)
})
