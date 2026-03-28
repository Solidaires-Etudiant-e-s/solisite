export function useArticles() {
  const nuxtApp = useNuxtApp()
  const sharedArticles = useNuxtData<CmsArticle[]>('articles')

  return useAsyncData<CmsArticle[]>(
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
