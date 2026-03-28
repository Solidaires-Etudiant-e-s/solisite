<script setup lang="ts">
import { requireCmsData } from '~/utils/cmsData'
import { buildSeoTitle, firstNonEmpty, resolveSeoImage, resolveSiteUrl, truncateText } from '~/utils/seo'

const [{ data: pageData }, { data: syndicatsData }, { data: siteSettingsData }] = await Promise.all([
  useFetch<CmsPage>('/api/pages/syndicats'),
  useFetch<CmsSyndicat[]>('/api/syndicats'),
  useFetch<CmsSiteSettings>('/api/site-settings')
])

const page = computed(() => requireCmsData(pageData.value, 'Page des syndicats introuvable.'))
const syndicats = computed(() => syndicatsData.value || [])
const unionName = computed(() => siteSettingsData.value?.unionName || '')
const runtimeConfig = useRuntimeConfig()
const siteUrl = computed(() => resolveSiteUrl(runtimeConfig.public.siteUrl))
const cityCount = computed(() => new Set(
  syndicats.value
    .map(syndicat => syndicat.city.trim())
    .filter(Boolean)
).size)
const seoDescription = computed(() => truncateText(firstNonEmpty(
  syndicats.value.length
    ? `${page.value.description} ${syndicats.value.length} syndicat${syndicats.value.length > 1 ? 's' : ''} recensé${syndicats.value.length > 1 ? 's' : ''} dans ${cityCount.value} ville${cityCount.value > 1 ? 's' : ''}.`
    : page.value.description,
  page.value.subheadline
)))
const socialImage = computed(() => resolveSeoImage({
  fallbackImage: '/hero.jpg',
  siteUrl: siteUrl.value
}))

useSeoMeta({
  title: page.value.title,
  description: seoDescription,
  ogTitle: () => buildSeoTitle(page.value.title, unionName.value),
  ogDescription: seoDescription,
  ogImage: socialImage,
  twitterTitle: () => buildSeoTitle(page.value.title, unionName.value),
  twitterDescription: seoDescription,
  twitterImage: socialImage
})
</script>

<template>
  <SiteSyndicatsPageView
    :page="page"
    :syndicats="syndicats"
    :union-name="unionName"
  />
</template>
