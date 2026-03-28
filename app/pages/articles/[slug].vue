<script setup lang="ts">
import { requireCmsData } from '~/utils/cmsData'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const { data: articleData } = await useFetch<CmsArticle>(() => `/api/articles/${slug.value}`)

const article = computed(() => requireCmsData(articleData.value, 'Article introuvable.'))

useSeoMeta({
  title: article.value.title,
  description: article.value.excerpt
})
</script>

<template>
  <SiteArticlePageView :article="article" />
</template>
