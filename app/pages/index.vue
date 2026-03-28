<script setup lang="ts">
import { requireCmsData, resolveSiteSettings } from '~/utils/cmsData'
import { buildSeoTitle, firstNonEmpty, resolveSeoImage, resolveSiteUrl, truncateText } from '~/utils/seo'

const [{ data: pageData }, { data: articlesData }, { data: siteSettingsData }] = await Promise.all([
  useFetch<CmsPage>('/api/pages/home'),
  useArticles(),
  useFetch<CmsSiteSettings>('/api/site-settings')
])

const page = computed(() => requireCmsData(pageData.value, 'Page d’accueil introuvable.'))
const articles = computed(() => articlesData.value || [])
const siteSettings = computed(() => resolveSiteSettings(siteSettingsData.value))
const runtimeConfig = useRuntimeConfig()
const siteName = computed(() => siteSettings.value.unionName || 'Solidaires Étudiant·es')
const siteUrl = computed(() => resolveSiteUrl(runtimeConfig.public.siteUrl))
const socialImage = computed(() => resolveSeoImage({
  image: articles.value[0]?.coverImage,
  fallbackImage: '/hero.jpg',
  siteUrl: siteUrl.value
}))
const seoDescription = computed(() => truncateText(firstNonEmpty(
  page.value.description,
  page.value.subheadline,
  siteSettings.value.siteDescription
)))

useSeoMeta({
  title: page.value.title,
  description: seoDescription,
  ogTitle: () => buildSeoTitle(page.value.title, siteName.value),
  ogDescription: seoDescription,
  ogImage: socialImage,
  twitterTitle: () => buildSeoTitle(page.value.title, siteName.value),
  twitterDescription: seoDescription,
  twitterImage: socialImage
})
</script>

<template>
  <SiteHomePageView
    :page="page"
    :articles="articles"
    :site-settings="siteSettings"
  />
</template>
