import { listSyndicats } from '~~/server/utils/cms/syndicats'

export default defineEventHandler(() => {
  return listSyndicats()
})
