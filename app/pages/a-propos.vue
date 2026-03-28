<script setup lang="ts">
import { requireCmsData, resolveSiteSettings } from '~/utils/cmsData'

const [{ data: pageData }, { data: siteSettingsData }, { data: syndicatsData }] = await Promise.all([
  useFetch<CmsPage>('/api/pages/a-propos'),
  useFetch<CmsSiteSettings>('/api/site-settings'),
  useFetch<CmsSyndicat[]>('/api/syndicats')
])

const page = computed(() => requireCmsData(pageData.value, 'Page À propos introuvable.'))
const siteSettings = computed(() => resolveSiteSettings(siteSettingsData.value))
const syndicats = computed(() => syndicatsData.value || [])

useSeoMeta({
  title: page.value.title,
  description: page.value.description
})
</script>

<template>
  <SiteAboutPageView
    :page="page"
    :site-settings="siteSettings"
    :syndicats="syndicats"
  />
</template>
