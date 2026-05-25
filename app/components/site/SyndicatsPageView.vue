<script setup lang="ts">
import { createFieldTarget } from '~/utils/cmsEditor'
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
const showNoSyndicatModal = ref(false)
const router = useRouter()
const noSyndicatTargetFields = [{
  key: 'noSyndicatButtonLabel',
  label: 'Libellé du bouton',
  kind: 'text' as const
}, {
  key: 'noSyndicatModalTitle',
  label: 'Titre de la fenêtre',
  kind: 'text' as const
}, {
  key: 'noSyndicatModalBody',
  label: 'Texte de la fenêtre',
  kind: 'textarea' as const,
  rows: 5
}, {
  key: 'noSyndicatModalCtaLabel',
  label: 'Libellé du lien',
  kind: 'text' as const
}, {
  key: 'noSyndicatModalCtaHref',
  label: 'Lien',
  kind: 'text' as const
}]

function navigateToJoinNational() {
  const href = (content.value as CmsSyndicatsPageContent).noSyndicatModalCtaHref || ''

  if (!href) {
    showNoSyndicatModal.value = false
    return
  }

  showNoSyndicatModal.value = false

  if (href.startsWith('/')) {
    void router.push(href)
    return
  }

  window.open(href, '_blank')
}

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
        <div class="flex items-center justify-between gap-4">
          <CmsPageIntroFields :page="page" />

          <div
            v-if="content.noSyndicatButtonLabel || editor"
            class="ml-4"
          >
            <CmsEditableNode
              v-if="editor"
              tag="div"
              :target="createFieldTarget(`${page.slug}:no-syndicat-modal`, 'content', 'Bouton sans syndicat', noSyndicatTargetFields)"
            >
              <UButton
                color="primary"
                variant="solid"
                :label="content.noSyndicatButtonLabel || 'Pas de syndicat dans ta ville ?'"
              />
            </CmsEditableNode>

            <UButton
              v-else
              color="primary"
              variant="solid"
              :label="content.noSyndicatButtonLabel"
              @click="showNoSyndicatModal = true"
            />
          </div>
        </div>
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
    <UModal
      v-model:open="showNoSyndicatModal"
      :title="content.noSyndicatModalTitle"
    >
      <template #body>
        <p class="text-sm text-toned">
          {{ content.noSyndicatModalBody }}
        </p>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            label="Annuler"
            color="neutral"
            variant="ghost"
            @click="showNoSyndicatModal = false"
          />
          <UButton
            :label="content.noSyndicatModalCtaLabel"
            color="primary"
            @click="navigateToJoinNational"
          />
        </div>
      </template>
    </UModal>
  </UPage>
</template>
