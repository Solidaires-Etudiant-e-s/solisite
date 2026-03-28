<script setup lang="ts">
import { formatFrenchDateTime } from '~/utils/cmsUi'
import type { CmsRevision } from '~~/lib/cms'

const props = defineProps<{
  activeSection: 'pages' | 'articles' | 'syndicats' | 'site-settings'
  currentDraftIsDirty: boolean
  historyLoading: boolean
  revisions: CmsRevision[]
  selectedRevision: CmsRevision | null
  selectedRevisionId: number | null
  restoringRevision: boolean
}>()

const emit = defineEmits<{
  toggleHistory: []
  selectRevision: [id: number | null]
  restoreRevision: []
}>()
</script>

<template>
  <UDashboardPanel class="w-full max-w-sm shrink-0 overflow-hidden border-s border-default bg-muted/60">
    <template #header>
      <div class="flex items-start justify-between gap-3 border-b border-default px-4 py-4">
        <div>
          <h2 class="text-xl text-highlighted">
            Historique des versions
          </h2>
          <p class="text-sm text-dimmed">
            Parcours les sauvegardes et restaure-en une comme nouvel état courant.
          </p>
        </div>

        <UButton
          icon="mingcute:layout-rightbar-close-line"
          color="neutral"
          variant="ghost"
          square
          @click="emit('toggleHistory')"
        />
      </div>
    </template>

    <template #body>
      <div class="flex h-full min-h-0 flex-col">
        <div class="space-y-3 border-b border-default px-4 py-4">
          <UAlert
            v-if="currentDraftIsDirty"
            color="warning"
            variant="soft"
            description="Restaurer une version supprimera le brouillon non enregistré actuellement affiché dans l’éditeur."
          />

          <div class="flex flex-wrap gap-2">
            <UButton
              label="Brouillon actuel"
              :color="selectedRevisionId ? 'neutral' : 'primary'"
              :variant="selectedRevisionId ? 'outline' : 'solid'"
              @click="emit('selectRevision', null)"
            />

            <UButton
              label="Restaurer la sélection"
              color="primary"
              icon="mingcute:history-anticlockwise-line"
              :disabled="!selectedRevision"
              :loading="restoringRevision"
              @click="emit('restoreRevision')"
            />
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <div
            v-if="historyLoading"
            class="px-5 py-6 text-sm text-dimmed"
          >
            Chargement de l’historique…
          </div>

          <div
            v-else-if="!revisions.length"
            class="px-5 py-6 text-sm text-dimmed"
          >
            Aucune version enregistrée pour {{ props.activeSection === 'pages' ? 'cette page' : props.activeSection === 'articles' ? 'cet article' : props.activeSection === 'site-settings' ? 'ces paramètres du site' : 'ce syndicat' }}.
          </div>

          <div
            v-else
            class="divide-y divide-default"
          >
            <button
              v-for="revision in revisions"
              :key="revision.id"
              type="button"
              class="flex w-full flex-col gap-1 px-4 py-4 text-left transition hover:bg-default/80"
              :class="revision.id === selectedRevisionId ? 'bg-default shadow-sm' : ''"
              @click="emit('selectRevision', revision.id)"
            >
              <div class="flex items-center justify-between gap-3">
                <span class="font-medium text-highlighted">
                  {{ revision.revisionLabel || 'Version sans titre' }}
                </span>

                <UBadge
                  :label="revision.changeType"
                  :color="revision.changeType === 'restore' ? 'warning' : 'neutral'"
                  variant="soft"
                />
              </div>

              <p class="text-sm text-dimmed">
                {{ formatFrenchDateTime(revision.createdAt) }}
              </p>
            </button>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
