<script setup lang="ts">
import { createEmptySiteSettings } from '~~/lib/cms'

const props = defineProps<{
  page: CmsPage
  articles?: CmsArticle[]
  syndicats?: CmsSyndicat[]
  siteSettings?: CmsSiteSettings
}>()
</script>

<template>
  <SiteHomePageView
    v-if="props.page.slug === 'home'"
    :page="props.page"
    :articles="props.articles || []"
    :site-settings="props.siteSettings || createEmptySiteSettings()"
  />
  <SiteArticlesPageView
    v-else-if="props.page.slug === 'articles'"
    :page="props.page"
    :articles="props.articles || []"
    :current-page="1"
    :total-pages="1"
  />
  <SiteAboutPageView
    v-else-if="props.page.slug === 'a-propos'"
    :page="props.page"
    :site-settings="props.siteSettings || createEmptySiteSettings()"
    :syndicats="props.syndicats || []"
  />
  <SiteSyndicatsPageView
    v-else
    :page="props.page"
    :syndicats="props.syndicats || []"
    :union-name="props.siteSettings?.unionName"
  />
</template>
