export default defineEventHandler(async (event) => {
  const access = await resolveCmsAccess(event)
  const managedSyndicat = await getManagedSyndicatById(access.managedSyndicatId)

  return {
    auth: {
      user: access.user,
      managedSyndicatId: access.managedSyndicatId
    },
    pages: access.user.role === 'admin' ? await listPages() : [],
    articles: access.user.role === 'admin'
      ? await listArticles()
      : managedSyndicat
        ? await listArticlesBySyndicat(managedSyndicat.id)
        : [],
    tags: await listTags(),
    guides: access.user.role === 'admin' ? await listGuides() : [],
    syndicats: access.user.role === 'admin'
      ? await listSyndicats()
      : managedSyndicat
        ? [managedSyndicat]
        : [],
    siteSettings: await getSiteSettings()
  }
})
