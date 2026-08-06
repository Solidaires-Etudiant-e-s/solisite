export function useGuides() {
  const sharedGuides = useNuxtData<CmsGuideSummary[]>('guides')

  return useAsyncData<CmsGuideSummary[]>(
    'guides',
    () => $fetch('/api/guides'),
    {
      default: () => sharedGuides.data.value ?? [],
      getCachedData: (key) => {
        return useNuxtApp().payload.data[key] as CmsGuide[] | undefined
          || sharedGuides.data.value
      }
    }
  )
}
