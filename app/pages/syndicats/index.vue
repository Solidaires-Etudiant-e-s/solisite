<script setup lang="ts">
import { requireCmsData } from '~/utils/cmsData'

const [{ data: pageData }, { data: syndicatsData }, { data: siteSettingsData }] = await Promise.all([
  useFetch<CmsPage>('/api/pages/syndicats'),
  useFetch<CmsSyndicat[]>('/api/syndicats'),
  useFetch<CmsSiteSettings>('/api/site-settings')
])

const page = computed(() => requireCmsData(pageData.value, 'Page des syndicats introuvable.'))
const syndicats = computed(() => syndicatsData.value || [])
const unionName = computed(() => siteSettingsData.value?.unionName || '')

useSeoMeta({
  title: page.value.title,
  description: page.value.description
})
</script>

<template>
  <SiteSyndicatsPageView
    :page="page"
    :syndicats="syndicats"
    :union-name="unionName"
  />
</template>
