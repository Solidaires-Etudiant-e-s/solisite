<script setup lang="ts">
import type { CmsRevision } from '~~/lib/cms'
import { hasInvalidSyndicatAddresses } from '~~/lib/cms'

const syndicat = defineModel<CmsSyndicat>('syndicat', {
  required: true
})

const { canManageHistory, historyOpen, saving, selectedRevision, unionName } = defineProps<{
  canManageHistory: boolean
  historyOpen: boolean
  saving: boolean
  selectedRevision: CmsRevision | null
  unionName?: string
}>()

const emit = defineEmits<{
  toggleHistory: []
  saveSyndicat: []
}>()

const publicPageHref = computed(() => syndicat.value.slug ? `/syndicats/${syndicat.value.slug}` : undefined)
const hasInvalidAddresses = computed(() => hasInvalidSyndicatAddresses(syndicat.value.addresses || []))

provideCmsPageLiveEditor(syndicat.value)
</script>

<template>
  <UDashboardPanel
    id="cms-syndicat-canvas"
    class="min-w-0 overflow-hidden bg-default"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <h1 class="text-2xl text-highlighted">
            Modifier la page du syndicat
          </h1>
          <p class="text-sm text-dimmed">
            Clique sur le contenu visible pour modifier la fiche directement.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UButton
            label="Voir la page"
            color="neutral"
            variant="outline"
            icon="mingcute:external-link-line"
            :to="publicPageHref"
            target="_blank"
            :disabled="!publicPageHref"
          />

          <UButton
            v-if="canManageHistory"
            :label="historyOpen ? 'Masquer l’historique' : 'Afficher l’historique'"
            color="neutral"
            variant="outline"
            icon="mingcute:history-line"
            @click="emit('toggleHistory')"
          />

          <UButton
            label="Enregistrer"
            color="primary"
            :loading="saving"
            :disabled="!syndicat.id || hasInvalidAddresses"
            @click="emit('saveSyndicat')"
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
          description="Tu prévisualises une version enregistrée du syndicat. Les clics continuent de modifier le brouillon actuel jusqu’à restauration."
        />

        <UAlert
          v-if="hasInvalidAddresses"
          color="warning"
          variant="soft"
          title="Adresse incomplète"
          description="Chaque adresse doit avoir un libellé et être choisie dans l’autocomplétion pour enregistrer ses coordonnées."
        />

        <CmsSyndicatPreview
          :syndicat="syndicat"
          :union-name="unionName"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
