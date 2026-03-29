<script setup lang="ts">
import type { CmsRevision } from '~~/lib/cms'

const guide = defineModel<CmsGuide>('guide', {
  required: true
})

const { canManageHistory, historyOpen, previewGuide, saving, selectedRevision } = defineProps<{
  canManageHistory: boolean
  historyOpen: boolean
  previewGuide: CmsGuide
  saving: boolean
  selectedRevision: CmsRevision | null
}>()

const emit = defineEmits<{
  toggleHistory: []
  saveGuide: []
}>()

provideCmsPageLiveEditor(guide.value)
</script>

<template>
  <UDashboardPanel
    id="cms-guide-canvas"
    class="min-w-0 overflow-hidden bg-default"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <h1 class="text-2xl text-highlighted">
            Modifier le guide en direct
          </h1>
          <p class="text-sm text-dimmed">
            Clique sur le contenu visible pour le modifier directement.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <CmsGuideSettingsPopover v-model:guide="guide" />

          <UButton
            v-if="canManageHistory"
            :label="historyOpen ? 'Masquer l’historique' : 'Afficher l’historique'"
            color="neutral"
            variant="outline"
            icon="mingcute:history-line"
            @click="emit('toggleHistory')"
          />

          <UButton
            label="Enregistrer le guide"
            color="primary"
            :loading="saving"
            :disabled="!guide.id"
            @click="emit('saveGuide')"
          />
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-5 px-4 pb-4">
        <UAlert
          v-if="selectedRevision"
          color="warning"
          variant="soft"
          title="Aperçu historique"
          description="Tu prévisualises une version enregistrée du guide. Les clics continuent de modifier le brouillon actuel jusqu’à restauration."
        />

        <CmsGuidePreview :guide="previewGuide" />
      </div>
    </template>
  </UDashboardPanel>
</template>
