<script setup lang="ts">
import type { CmsRevision } from '~~/lib/cms'

const article = defineModel<CmsArticle>('article', {
  required: true
})

const { canManageHistory, historyOpen, previewArticle, saving, selectedRevision, status } = defineProps<{
  canManageHistory: boolean
  historyOpen: boolean
  previewArticle: CmsArticle
  saving: boolean
  selectedRevision: CmsRevision | null
  status: string
}>()

const emit = defineEmits<{
  toggleHistory: []
  saveArticle: []
}>()

provideCmsPageLiveEditor(article.value)
</script>

<template>
  <UDashboardPanel
    id="cms-article-canvas"
    class="min-w-0 overflow-hidden bg-default"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <h1 class="text-2xl text-highlighted">
            Modifier l’article en direct
          </h1>
          <p class="text-sm text-dimmed">
            Clique sur le contenu visible pour le modifier directement.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <CmsArticleSettingsPopover v-model:article="article" />

          <UButton
            v-if="canManageHistory"
            :label="historyOpen ? 'Masquer l’historique' : 'Afficher l’historique'"
            color="neutral"
            variant="outline"
            icon="mingcute:history-line"
            @click="emit('toggleHistory')"
          />

          <UButton
            label="Enregistrer l’article"
            color="primary"
            :loading="saving"
            :disabled="!article.id"
            @click="emit('saveArticle')"
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
          description="Tu prévisualises une version enregistrée de l’article. Les clics continuent de modifier le brouillon actuel jusqu’à restauration."
        />

        <CmsArticlePreview :article="previewArticle" />
      </div>
    </template>
  </UDashboardPanel>
</template>
