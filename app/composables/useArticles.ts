export function useArticles() {
  const nuxtApp = useNuxtApp()
  const sharedArticles = useNuxtData<CmsArticleSummary[]>('articles')

  return useAsyncData<CmsArticleSummary[]>(
    'articles',
    () => $fetch('/api/articles'),
    {
      default: () => sharedArticles.data.value ?? [],
      getCachedData(key) {
        return nuxtApp.payload.data[key]
          || nuxtApp.static.data[key]
          || sharedArticles.data.value
      }
    }
  )
}
