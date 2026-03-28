<script setup lang="ts">
import { requireCmsData } from '~/utils/cmsData'

const ARTICLES_PER_PAGE = 9

const route = useRoute()

const [{ data: pageData }, { data: articles }] = await Promise.all([
  useFetch<CmsPage>('/api/pages/articles'),
  useFetch<CmsArticle[]>('/api/articles')
])

const page = computed(() => requireCmsData(pageData.value, 'Page des articles introuvable.'))
const allArticles = computed(() => articles.value || [])

function parsePage(input: string | null | Array<string | null> | undefined) {
  const rawValue = Array.isArray(input) ? input[0] : input
  const parsed = Number.parseInt(rawValue || '1', 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(allArticles.value.length / ARTICLES_PER_PAGE))
})

const currentPage = computed(() => {
  return Math.min(parsePage(route.query.page), totalPages.value)
})

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * ARTICLES_PER_PAGE
  return allArticles.value.slice(start, start + ARTICLES_PER_PAGE)
})

useSeoMeta({
  title: page.value.title,
  description: page.value.description
})
</script>

<template>
  <SiteArticlesPageView
    :page="page"
    :articles="paginatedArticles"
    :current-page="currentPage"
    :total-pages="totalPages"
  />
</template>
