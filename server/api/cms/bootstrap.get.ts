import { listArticles } from '~~/server/utils/cms/articles'
import { getManagedSyndicatById, resolveCmsAccess } from '~~/server/utils/auth'
import { listPages } from '~~/server/utils/cms/pages'
import { getSiteSettings } from '~~/server/utils/cms/siteSettings'
import { listSyndicats } from '~~/server/utils/cms/syndicats'

export default defineEventHandler(async (event) => {
  const access = await resolveCmsAccess(event)
  const managedSyndicat = getManagedSyndicatById(access.managedSyndicatId)

  return {
    auth: {
      user: access.user,
      managedSyndicatId: access.managedSyndicatId
    },
    pages: access.user.role === 'admin' ? listPages() : [],
    articles: access.user.role === 'admin' ? listArticles() : [],
    syndicats: access.user.role === 'admin'
      ? listSyndicats()
      : managedSyndicat
        ? [managedSyndicat]
        : [],
    siteSettings: getSiteSettings()
  }
})
