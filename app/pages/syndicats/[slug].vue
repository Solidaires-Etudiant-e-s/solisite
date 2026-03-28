<script setup lang="ts">
import { requireCmsData } from '~/utils/cmsData'
import { formatSyndicatDisplayName } from '~~/lib/cms'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const [{ data: syndicatData }, { data: siteSettingsData }] = await Promise.all([
  useFetch<CmsSyndicat>(() => `/api/syndicats/${slug.value}`),
  useFetch<CmsSiteSettings>('/api/site-settings')
])

const syndicat = computed(() => requireCmsData(syndicatData.value, 'Syndicat introuvable.'))
const unionName = computed(() => siteSettingsData.value?.unionName || '')

useSeoMeta({
  title: formatSyndicatDisplayName(syndicat.value.name, unionName.value),
  description: syndicat.value.city
})
</script>

<template>
  <SiteSyndicatPageView
    :syndicat="syndicat"
    :union-name="unionName"
  />
</template>
