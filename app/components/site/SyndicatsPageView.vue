<script setup lang="ts">
import { formatSyndicatDisplayName } from '~~/lib/cms'

const props = defineProps<{
  page: CmsPage
  syndicats: CmsSyndicat[]
  unionName?: string
}>()

const editor = useCmsPageLiveEditor()
const content = computed(() => props.page.content as CmsSyndicatsPageContent)
const search = ref('')
const selectedSlug = ref('')

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const filteredSyndicats = computed(() => {
  const query = normalizeSearch(search.value.trim())

  if (!query) {
    return props.syndicats
  }

  return props.syndicats.filter((syndicat) => {
    const haystack = normalizeSearch([
      syndicat.name,
      syndicat.city,
      ...(syndicat.addresses || []).map(entry => `${entry.label} ${entry.address}`),
      syndicat.email
    ].join(' '))

    return haystack.includes(query)
  })
})

const selectedSyndicat = computed(() => filteredSyndicats.value.find(syndicat => syndicat.slug === selectedSlug.value) || null)

watch(filteredSyndicats, (syndicats) => {
  if (!syndicats.length) {
    selectedSlug.value = ''
    return
  }

  if (selectedSlug.value && !syndicats.some(syndicat => syndicat.slug === selectedSlug.value)) {
    selectedSlug.value = ''
  }
}, { immediate: true })
</script>

<template>
  <UPage>
    <div class="border-b border-default public-section">
      <div class="public-container">
        <CmsPageIntroFields :page="page" />
      </div>
    </div>

    <UPageBody>
      <div class="public-container public-section space-y-8">
        <div class="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <UCard>
            <div class="space-y-4">
              <CmsEditableNode
                v-if="editor"
                tag="div"
                :target="{ id: `${page.slug}:search-placeholder`, kind: 'text', path: 'content.searchPlaceholder', label: 'Texte du champ de recherche' }"
              >
                <UInput
                  :model-value="search"
                  :placeholder="content.searchPlaceholder"
                  icon="mingcute:search-line"
                  size="xl"
                />
              </CmsEditableNode>

              <UInput
                v-else
                v-model="search"
                :placeholder="content.searchPlaceholder"
                icon="mingcute:search-line"
                size="xl"
              />

              <div
                v-if="filteredSyndicats.length"
                class="max-h-[38rem] space-y-2 overflow-y-auto pr-1"
              >
                <button
                  v-for="syndicat in filteredSyndicats"
                  :key="syndicat.id"
                  type="button"
                  class="w-full rounded-lg border border-default px-4 py-3 text-left transition"
                  :class="syndicat.slug === selectedSlug ? 'bg-primary/10 border-primary/40' : 'bg-default hover:bg-muted'"
                  @click="selectedSlug = syndicat.slug"
                >
                  <p class="font-medium text-highlighted">
                    {{ syndicat.city || 'Ville à préciser' }}
                  </p>
                  <p class="mt-1 text-sm text-toned">
                    {{ formatSyndicatDisplayName(syndicat.name, props.unionName) }}
                  </p>
                </button>
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
            </div>
          </UCard>

          <div class="space-y-6">
            <UCard>
              <SiteSyndicatsMap
                :syndicats="filteredSyndicats"
                :active-syndicat-slug="selectedSyndicat?.slug"
                :interactive-links="!editor"
                :union-name="props.unionName"
                @select="selectedSlug = $event"
              />
            </UCard>
          </div>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>
