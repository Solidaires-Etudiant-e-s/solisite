<script setup lang="ts">
import { requireCmsData, resolveSiteSettings } from '~/utils/cmsData'

const [{ data: pageData }, { data: articlesData }, { data: siteSettingsData }] = await Promise.all([
  useFetch<CmsPage>('/api/pages/home'),
  useFetch<CmsArticle[]>('/api/articles'),
  useFetch<CmsSiteSettings>('/api/site-settings')
])

const page = computed(() => requireCmsData(pageData.value, 'Page d’accueil introuvable.'))
const articles = computed(() => articlesData.value || [])
const siteSettings = computed(() => resolveSiteSettings(siteSettingsData.value))

useSeoMeta({
  title: page.value.title,
  description: page.value.description
})
</script>

<template>
  <SiteHomePageView
    :page="page"
    :articles="articles"
    :site-settings="siteSettings"
  />
</template>
