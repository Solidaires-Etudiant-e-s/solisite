<script setup lang="ts">
import { requireCmsData, resolveSiteSettings } from '~/utils/cmsData'
import { buildSeoTitle, firstNonEmpty, resolveSeoImage, resolveSiteUrl, truncateText } from '~/utils/seo'
import type { CmsAboutPageContent } from '~~/lib/cms'

const [{ data: pageData }, { data: siteSettingsData }, { data: syndicatsData }] = await Promise.all([
  useFetch<CmsPage>('/api/pages/a-propos'),
  useFetch<CmsSiteSettings>('/api/site-settings'),
  useFetch<CmsSyndicat[]>('/api/syndicats')
])

const page = computed(() => requireCmsData(pageData.value, 'Page À propos introuvable.'))
const siteSettings = computed(() => resolveSiteSettings(siteSettingsData.value))
const syndicats = computed(() => syndicatsData.value || [])
const runtimeConfig = useRuntimeConfig()
const content = computed(() => page.value.content as CmsAboutPageContent)
const siteName = computed(() => siteSettings.value.unionName || 'Solidaires Étudiant·es')
const siteUrl = computed(() => resolveSiteUrl(runtimeConfig.public.siteUrl))
const socialImage = computed(() => resolveSeoImage({
  image: content.value.heroImage,
  fallbackImage: '/hero.jpg',
  siteUrl: siteUrl.value
}))
const seoDescription = computed(() => truncateText(firstNonEmpty(
  page.value.description,
  `${siteName.value} fédère ${syndicats.value.length} syndicats locaux et présente son réseau, ses missions et son fonctionnement.`,
  page.value.subheadline
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
  <SiteAboutPageView
    :page="page"
    :site-settings="siteSettings"
    :syndicats="syndicats"
  />
</template>
