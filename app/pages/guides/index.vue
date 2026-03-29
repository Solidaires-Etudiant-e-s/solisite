<script setup lang="ts">
import { requireCmsData, resolveSiteSettings } from '~/utils/cmsData'
import { buildSeoTitle, firstNonEmpty, resolveSeoImage, resolveSiteUrl, truncateText } from '~/utils/seo'

const GUIDES_PER_PAGE = 9

const route = useRoute()
const runtimeConfig = useRuntimeConfig()

const [{ data: pageData }, guidesState, { data: siteSettingsData }] = await Promise.all([
  useFetch<CmsPage>('/api/pages/guides'),
  useGuides(),
  useFetch<CmsSiteSettings>('/api/site-settings')
])

const { data: guides, refresh: refreshGuides } = guidesState
const page = computed(() => requireCmsData(pageData.value, 'Page des guides introuvable.'))
const allGuides = computed(() => guides.value || [])
const siteSettings = computed(() => resolveSiteSettings(siteSettingsData.value))
const siteUrl = computed(() => resolveSiteUrl(runtimeConfig.public.siteUrl))
const siteName = computed(() => siteSettings.value.unionName || 'Solidaires Étudiant·es')
const socialImage = computed(() => resolveSeoImage({
  image: paginatedGuides.value[0]?.coverImage || allGuides.value[0]?.coverImage,
  fallbackImage: '/hero.jpg',
  siteUrl: siteUrl.value
}))

function parsePage(input: string | null | Array<string | null> | undefined) {
  const rawValue = Array.isArray(input) ? input[0] : input
  const parsed = Number.parseInt(rawValue || '1', 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const totalPages = computed(() => Math.max(1, Math.ceil(allGuides.value.length / GUIDES_PER_PAGE)))
const currentPage = computed(() => Math.min(parsePage(route.query.page), totalPages.value))
const paginatedGuides = computed(() => {
  const start = (currentPage.value - 1) * GUIDES_PER_PAGE
  return allGuides.value.slice(start, start + GUIDES_PER_PAGE)
})
const title = computed(() => currentPage.value > 1 ? `${page.value.title} - Page ${currentPage.value}` : page.value.title)
const seoDescription = computed(() => {
  const guideCount = allGuides.value.length
  const pageLabel = currentPage.value > 1 ? ` Page ${currentPage.value} sur ${totalPages.value}.` : ''

  return truncateText(firstNonEmpty(
    guideCount
      ? `${page.value.description} ${guideCount} guide${guideCount > 1 ? 's' : ''} publié${guideCount > 1 ? 's' : ''}.${pageLabel}`
      : page.value.description,
    page.value.subheadline
  ))
})

useSeoMeta({
  title,
  description: seoDescription,
  ogTitle: () => buildSeoTitle(title.value, siteName.value),
  ogDescription: seoDescription,
  ogImage: socialImage,
  twitterTitle: () => buildSeoTitle(title.value, siteName.value),
  twitterDescription: seoDescription,
  twitterImage: socialImage
})

if (import.meta.client) {
  onMounted(() => {
    void refreshGuides()
  })
}
</script>

<template>
  <SiteGuidesPageView
    :page="page"
    :guides="paginatedGuides"
    :current-page="currentPage"
    :total-pages="totalPages"
  />
</template>
