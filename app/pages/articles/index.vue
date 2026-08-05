<script setup lang="ts">
import { useFuse } from '@vueuse/integrations/useFuse'
import type { CmsTag } from '~~/lib/cms'

const ARTICLES_PER_PAGE = 9

const route = useRoute()
const runtimeConfig = useRuntimeConfig()

const [{ data: pageData }, articlesState, { data: siteSettingsData }] = await Promise.all([
  useFetch<CmsPage>('/api/pages/articles'),
  useArticles(),
  useFetch<CmsSiteSettings>('/api/site-settings')
])

const { data: articles, refresh: refreshArticles } = articlesState
const page = computed(() => requireCmsData(pageData.value, 'Page des articles introuvable.'))
const allArticles = computed(() => articles.value || [])
const siteSettings = computed(() => resolveSiteSettings(siteSettingsData.value))
const siteUrl = computed(() => resolveSiteUrl(runtimeConfig.public.siteUrl))
const siteName = computed(() => siteSettings.value.unionName || 'Solidaires Étudiant·es')
const socialImage = computed(() => resolveSeoImage({
  image: paginatedArticles.value[0]?.coverImage || allArticles.value[0]?.coverImage,
  fallbackImage: '/hero.jpg',
  siteUrl: siteUrl.value
}))

function parsePage(input: string | null | Array<string | null> | undefined) {
  const rawValue = Array.isArray(input) ? input[0] : input
  const parsed = Number.parseInt(rawValue || '1', 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const search = ref('')
const selectedTag = computed<string | null>({
  get: () => typeof route.query.tag === 'string' ? route.query.tag : null,
  set: (value: string | null) => {
    const query = { ...route.query }
    delete query.page
    if (value) {
      query.tag = value
    } else {
      delete query.tag
    }
    void navigateTo({ query })
  }
})

// Get all unique tags from articles
const allTags = computed(() => {
  const tags = new Map<string, CmsTag>()
  allArticles.value.forEach((article) => {
    article.tags.forEach((tag) => {
      if (!tags.has(tag.slug)) {
        tags.set(tag.slug, tag)
      }
    })
  })
  return Array.from(tags.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const articlesFiltered = useFuse(search, allArticles, { fuseOptions: { keys: ['title'] } }).results

const filteredByTag = computed(() => {
  if (!selectedTag.value) return articlesFiltered.value
  return articlesFiltered.value.filter(a => a.item.tags.some(t => t.slug === selectedTag.value))
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredByTag.value.length / ARTICLES_PER_PAGE))
})

const currentPage = computed(() => {
  return Math.min(parsePage(route.query.page), totalPages.value)
})

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * ARTICLES_PER_PAGE
  return filteredByTag.value.slice(start, start + ARTICLES_PER_PAGE).map(a => a.item)
})
const title = computed(() => currentPage.value > 1 ? `${page.value.title} - Page ${currentPage.value}` : page.value.title)
const seoDescription = computed(() => {
  const articleCount = filteredByTag.value.length
  const pageLabel = currentPage.value > 1 ? ` Page ${currentPage.value} sur ${totalPages.value}.` : ''
  const tagLabel = selectedTag.value ? ` - ${allTags.value.find(t => t.slug === selectedTag.value)?.name || ''}` : ''

  return truncateText(firstNonEmpty(
    articleCount
      ? `${page.value.description} ${articleCount} article${articleCount > 1 ? 's' : ''} publié${articleCount > 1 ? 's' : ''}.${pageLabel}${tagLabel}`
      : page.value.description,
    page.value.subheadline
  ))
})

useSeoMeta({
  title,
  description: seoDescription,
  ogTitle: () => buildSeoTitle(title.value, siteName.value),
  ogDescription: seoDescription,
  ogImage: socialImage,
  twitterTitle: () => buildSeoTitle(title.value, siteName.value),
  twitterDescription: seoDescription,
  twitterImage: socialImage
})

if (import.meta.client) {
  onMounted(() => {
    void refreshArticles()
  })
}
</script>

<template>
  <SiteArticlesPageView
    v-model:search="search"
    v-model:selected-tag="selectedTag"
    :page="page"
    :articles="paginatedArticles"
    :current-page="currentPage"
    :total-pages="totalPages"
    :all-tags="allTags"
  />
</template>
