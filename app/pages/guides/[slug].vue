<script setup lang="ts">
import { requireCmsData, resolveSiteSettings } from '~/utils/cmsData'
import { buildSeoTitle, firstNonEmpty, resolveSeoImage, resolveSiteUrl, stripHtml, truncateText } from '~/utils/seo'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const slug = computed(() => String(route.params.slug || ''))

const [{ data: guideData }, { data: siteSettingsData }] = await Promise.all([
  useFetch<CmsGuide>(() => `/api/guides/${slug.value}`),
  useFetch<CmsSiteSettings>('/api/site-settings')
])

const guide = computed(() => requireCmsData(guideData.value, 'Guide introuvable.'))
const siteSettings = computed(() => resolveSiteSettings(siteSettingsData.value))
const siteUrl = computed(() => resolveSiteUrl(runtimeConfig.public.siteUrl))
const siteName = computed(() => siteSettings.value.unionName || 'Solidaires Étudiant·es')
const seoDescription = computed(() => truncateText(firstNonEmpty(
  guide.value.excerpt,
  stripHtml(guide.value.content)
)))
const socialImage = computed(() => resolveSeoImage({
  image: guide.value.coverImage,
  fallbackImage: '/hero.jpg',
  siteUrl: siteUrl.value
}))

useSeoMeta({
  title: guide.value.title,
  description: seoDescription,
  ogTitle: () => buildSeoTitle(guide.value.title, siteName.value),
  ogDescription: seoDescription,
  ogType: 'article',
  ogImage: socialImage,
  articlePublishedTime: () => guide.value.publishedAt || undefined,
  articleModifiedTime: () => guide.value.updatedAt || undefined,
  twitterTitle: () => buildSeoTitle(guide.value.title, siteName.value),
  twitterDescription: seoDescription,
  twitterImage: socialImage
})
</script>

<template>
  <SiteGuidePageView :guide="guide" />
</template>
