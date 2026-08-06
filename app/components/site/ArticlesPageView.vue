<script setup lang="ts">
const search = defineModel<string>('search')
const selectedTag = defineModel<string | null>('selected-tag')

const props = withDefaults(defineProps<{
  page: CmsPage
  articles: CmsArticleSummary[]
  currentPage: number
  totalPages: number
  allTags?: CmsTag[]
}>(), {
  allTags: () => []
})

const route = useRoute()
const content = computed(() => props.page.content as CmsArticlesPageContent)

const pageNumbers = computed(() => {
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(props.totalPages, start + 4)
  const adjustedStart = Math.max(1, end - 4)

  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index)
})

function pageQuery(page: number) {
  const query = { ...route.query }
  if (page <= 1) {
    delete query.page
  } else {
    query.page = String(page)
  }
  return query
}

function tagQuery(tagSlug: string | null) {
  const query = { ...route.query }
  delete query.page
  if (tagSlug) {
    query.tag = tagSlug
  } else {
    delete query.tag
  }
  return query
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
        <UInput
          v-model="search"
          icon="mingcute:search-line"
          placeholder="Rechercher..."
          class="w-full mb-4"
        />

        <div class="flex flex-wrap gap-2 mb-4">
          <UButton
            :to="{ query: tagQuery(null) }"
            :variant="!selectedTag ? 'solid' : 'outline'"
            :color="!selectedTag ? 'primary' : 'neutral'"
            class="whitespace-nowrap"
          >
            Tout
          </UButton>
          <UButton
            v-for="tag in allTags"
            :key="tag.slug"
            :to="{ query: tagQuery(tag.slug) }"
            :variant="selectedTag === tag.slug ? 'solid' : 'outline'"
            :color="selectedTag === tag.slug ? 'primary' : 'neutral'"
            class="whitespace-nowrap flex items-center gap-1.5"
          >
            <UIcon
              v-if="tag.icon"
              :name="tag.icon"
              class="h-4 w-4"
            />
            {{ tag.name }}
          </UButton>
        </div>

        <div
          v-if="articles.length"
          class="grid gap-8 md:grid-cols-2 xl:grid-cols-3"
        >
          <CmsArticleSummaryCard
            v-for="article in articles"
            :key="article.id"
            class="overflow-hidden"
            :article="article"
            :immersive="true"
          />
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
              Précédente
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
