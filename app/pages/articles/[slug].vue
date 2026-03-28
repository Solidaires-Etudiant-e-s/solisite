<script setup lang="ts">
import { requireCmsData, resolveSiteSettings } from '~/utils/cmsData'
import { buildSeoTitle, firstNonEmpty, resolveSeoImage, resolveSiteUrl, stripHtml, truncateText } from '~/utils/seo'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const slug = computed(() => String(route.params.slug || ''))
const [{ data: articleData }, { data: siteSettingsData }] = await Promise.all([
  useFetch<CmsArticle>(() => `/api/articles/${slug.value}`),
  useFetch<CmsSiteSettings>('/api/site-settings')
])

const article = computed(() => requireCmsData(articleData.value, 'Article introuvable.'))
const siteSettings = computed(() => resolveSiteSettings(siteSettingsData.value))
const siteUrl = computed(() => resolveSiteUrl(runtimeConfig.public.siteUrl))
const siteName = computed(() => siteSettings.value.unionName || 'Solidaires Étudiant·es')
const seoDescription = computed(() => truncateText(firstNonEmpty(
  article.value.excerpt,
  stripHtml(article.value.content)
)))
const socialImage = computed(() => resolveSeoImage({
  image: article.value.coverImage,
  fallbackImage: '/hero.jpg',
  siteUrl: siteUrl.value
}))

useSeoMeta({
  title: article.value.title,
  description: seoDescription,
  ogType: 'article',
  ogTitle: () => buildSeoTitle(article.value.title, siteName.value),
  ogDescription: seoDescription,
  ogImage: socialImage,
  articlePublishedTime: () => article.value.publishedAt || undefined,
  articleModifiedTime: () => article.value.updatedAt || undefined,
  twitterTitle: () => buildSeoTitle(article.value.title, siteName.value),
  twitterDescription: seoDescription,
  twitterImage: socialImage
})
</script>

<template>
  <SiteArticlePageView :article="article" />
</template>
