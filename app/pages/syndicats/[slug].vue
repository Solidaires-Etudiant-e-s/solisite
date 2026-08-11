<script setup lang="ts">
import { requireCmsData } from '~/utils/cmsData'
import { buildSeoTitle, firstNonEmpty, resolveSeoImage, resolveSiteUrl, stripHtml, truncateText } from '~/utils/seo'
import { formatSyndicatDisplayName, getPrimarySyndicatAddress, resolveSyndicatAddresses } from '~~/lib/cms'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const runtimeConfig = useRuntimeConfig()
const [{ data: syndicatData }, { data: siteSettingsData }] = await Promise.all([
  useFetch<CmsSyndicat>(() => `/api/syndicats/${slug.value}`),
  useFetch<CmsSiteSettings>('/api/site-settings')
])

const syndicat = computed(() => requireCmsData(syndicatData.value, 'Syndicat introuvable.'))
const unionName = computed(() => siteSettingsData.value?.unionName || '')
const pageTitle = computed(() => formatSyndicatDisplayName(syndicat.value.name, unionName.value))
const siteUrl = computed(() => resolveSiteUrl(runtimeConfig.public.siteUrl))
const primaryAddress = computed(() => getPrimarySyndicatAddress(resolveSyndicatAddresses(syndicat.value)))
const seoDescription = computed(() => truncateText(firstNonEmpty(
  stripHtml(syndicat.value.content),
  syndicat.value.city && primaryAddress.value?.address
    ? `${pageTitle.value} est le syndicat local de ${unionName.value || 'Solidaires Étudiant·es'} à ${syndicat.value.city}. Adresse: ${primaryAddress.value.address}.`
    : syndicat.value.city
      ? `${pageTitle.value} est le syndicat local de ${unionName.value || 'Solidaires Étudiant·es'} à ${syndicat.value.city}.`
      : '',
  syndicat.value.city
)))
const socialImage = computed(() => resolveSeoImage({
  image: syndicat.value.logo || undefined,
  fallbackImage: '/hero.jpg',
  siteUrl: siteUrl.value
}))

useSeoMeta({
  title: pageTitle,
  description: seoDescription,
  ogTitle: () => buildSeoTitle(pageTitle.value, ''),
  ogDescription: seoDescription,
  ogImage: socialImage,
  twitterTitle: () => buildSeoTitle(pageTitle.value, ''),
  twitterDescription: seoDescription,
  twitterImage: socialImage
})

useHead(() => ({
  link: [{
    rel: 'icon',
    type: 'image/png',
    sizes: '128x128',
    href: syndicat.value.logo || '/logo.png'
  }, {
    rel: 'apple-touch-icon',
    href: syndicat.value.logo || '/logo.png'
  }]
}))
</script>

<template>
  <SiteSyndicatPageView
    :syndicat="syndicat"
    :union-name="unionName"
  />
</template>
