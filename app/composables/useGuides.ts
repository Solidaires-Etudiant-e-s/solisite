export function useGuides() {
  const sharedGuides = useNuxtData<CmsGuide[]>('guides')

  return useAsyncData<CmsGuide[]>(
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
