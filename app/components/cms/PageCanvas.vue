<script setup lang="ts">
import type { CmsRevision } from '~~/lib/cms'

const page = defineModel<CmsPage>('page', {
  required: true
})

const { articles, historyOpen, previewPage, selectedRevision, status, saving } = defineProps<{
  articles: CmsArticle[]
  siteSettings: CmsSiteSettings
  syndicats: CmsSyndicat[]
  historyOpen: boolean
  previewPage: CmsPage
  selectedRevision: CmsRevision | null
  status: string
  saving: boolean
}>()

const emit = defineEmits<{
  toggleHistory: []
  savePage: []
  resetPage: []
}>()

const editor = provideCmsPageLiveEditor(page.value)

watch(() => page.value.slug, () => {
  editor.closeTarget()
})
</script>

<template>
  <UDashboardPanel
    id="cms-page-canvas"
    class="min-w-0 overflow-hidden bg-white"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <h1 class="text-2xl text-highlighted">
            Modifier la page en direct
          </h1>
          <p class="text-sm text-dimmed">
            Clique sur le contenu visible pour le modifier directement.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <CmsPageSettingsPopover v-model:page="page" />

          <UButton
            :label="historyOpen ? 'Masquer l’historique' : 'Afficher l’historique'"
            color="neutral"
            variant="outline"
            icon="mingcute:history-line"
            @click="emit('toggleHistory')"
          />

          <UButton
            label="Réinitialiser le brouillon"
            color="neutral"
            variant="outline"
            @click="emit('resetPage')"
          />

          <UButton
            label="Enregistrer la page"
            color="primary"
            :loading="saving"
            @click="emit('savePage')"
          />
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-5 px-4 pb-4">
        <UAlert
          v-if="status"
          color="success"
          variant="soft"
          :description="status"
        />

        <UAlert
          v-if="selectedRevision"
          color="warning"
          variant="soft"
          title="Aperçu historique"
          description="Tu prévisualises une version enregistrée de la page. Les modifications continuent de s’appliquer au brouillon actuel jusqu’à restauration."
        />

        <CmsPagePreview
          :page="previewPage"
          :articles="articles"
          :site-settings="siteSettings"
          :syndicats="syndicats"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
