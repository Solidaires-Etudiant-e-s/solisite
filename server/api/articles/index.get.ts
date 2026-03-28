import { listArticles } from '~~/server/utils/cms/articles'

export default defineEventHandler(() => {
  return listArticles()
})
