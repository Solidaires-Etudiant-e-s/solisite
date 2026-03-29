<script setup lang="ts">
import { formatFrenchDate } from '~/utils/cmsUi'

const props = defineProps<{
  page: CmsPage
  articles: CmsArticle[]
  currentPage: number
  totalPages: number
}>()

const editor = useCmsPageLiveEditor()
const route = useRoute()
const content = computed(() => props.page.content as CmsArticlesPageContent)

const pageNumbers = computed(() => {
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(props.totalPages, start + 4)
  const adjustedStart = Math.max(1, end - 4)

  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index)
})

function pageQuery(page: number) {
  if (page <= 1) {
    const query = { ...route.query }
    delete query.page
    return query
  }

  return {
    ...route.query,
    page: String(page)
  }
}
</script>

<template>
  <UPage>
    <div class="border-b border-default public-section">
      <div class="public-container">
        <CmsPageIntroFields :page="page" />
      </div>
    </div>

    <UPageBody>
      <div class="public-container public-section space-y-10">
        <div
          v-if="articles.length"
          class="grid gap-8 md:grid-cols-2 xl:grid-cols-3"
        >
          <UPageCard
            v-for="article in articles"
            :key="article.id"
            :title="article.title"
            :description="article.excerpt"
            :to="editor ? undefined : `/articles/${article.slug}`"
            class="overflow-hidden"
          >
            <template #leading>
              <img
                :src="article.coverImage || '/hero.jpg'"
                :alt="article.title"
                class="mb-4 h-52 w-full object-cover"
              >
            </template>

            <template #footer>
              <span class="text-sm text-muted">{{ formatFrenchDate(article.publishedAt) }}</span>
            </template>
          </UPageCard>
        </div>

        <p
          v-else
          class="text-sm text-muted"
        >
          <CmsEditableNode
            tag="span"
            :target="{ id: `${page.slug}:empty-state`, kind: 'textarea', path: 'content.emptyStateText', label: 'Texte de l’état vide' }"
          >
            {{ content.emptyStateText }}
          </CmsEditableNode>
        </p>

        <div
          v-if="totalPages > 1"
          class="flex flex-col items-center gap-4"
        >
          <p class="text-sm text-muted">
            Page {{ currentPage }} sur {{ totalPages }}
          </p>

          <div class="flex flex-wrap items-center justify-center gap-2">
            <UButton
              :to="{ query: pageQuery(currentPage - 1) }"
              variant="outline"
              color="neutral"
              :disabled="currentPage === 1"
            >
              Precedente
            </UButton>

            <UButton
              v-for="pageNumber in pageNumbers"
              :key="pageNumber"
              :to="{ query: pageQuery(pageNumber) }"
              :variant="pageNumber === currentPage ? 'solid' : 'ghost'"
              :color="pageNumber === currentPage ? 'primary' : 'neutral'"
            >
              {{ pageNumber }}
            </UButton>

            <UButton
              :to="{ query: pageQuery(currentPage + 1) }"
              variant="outline"
              color="neutral"
              :disabled="currentPage === totalPages"
            >
              Suivante
            </UButton>
          </div>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>
