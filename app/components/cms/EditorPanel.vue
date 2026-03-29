<script setup lang="ts">
import type { CmsRevision } from '~~/lib/cms'

const pageDraft = defineModel<CmsPage>('pageDraft', {
  required: true
})
const articleDraft = defineModel<CmsArticle>('articleDraft', {
  required: true
})
const guideDraft = defineModel<CmsGuide>('guideDraft', {
  required: true
})
const siteSettingsDraft = defineModel<CmsSiteSettings>('siteSettingsDraft', {
  required: true
})
const syndicatDraft = defineModel<CmsSyndicat>('syndicatDraft', {
  required: true
})

defineProps<{
  articles: CmsArticle[]
  guides: CmsGuide[]
  syndicats: CmsSyndicat[]
  activeSection: 'pages' | 'articles' | 'guides' | 'syndicats' | 'site-settings'
  articlePreview: CmsArticle
  guidePreview: CmsGuide
  canManageHistory: boolean
  syndicatPreview: CmsSyndicat
  historyOpen: boolean
  isAdmin: boolean
  pagePreview: CmsPage
  pageStatus: string
  articleStatus: string
  guideStatus: string
  syndicatStatus: string
  selectedRevision: CmsRevision | null
  savingPage: boolean
  savingArticle: boolean
  savingGuide: boolean
  savingSiteSettings: boolean
  savingSyndicat: boolean
}>()

const emit = defineEmits<{
  toggleHistory: []
  savePage: []
  resetPage: []
  saveArticle: []
  saveGuide: []
  saveSiteSettings: []
  saveSyndicat: []
}>()
</script>

<template>
  <CmsPageCanvas
    v-if="activeSection === 'pages'"
    v-model:page="pageDraft"
    :articles="articles"
    :guides="guides"
    :site-settings="siteSettingsDraft"
    :syndicats="syndicats"
    :history-open="historyOpen"
    :preview-page="pagePreview"
    :selected-revision="selectedRevision"
    :status="pageStatus"
    :saving="savingPage"
    @toggle-history="emit('toggleHistory')"
    @save-page="emit('savePage')"
    @reset-page="emit('resetPage')"
  />

  <CmsArticleCanvas
    v-else-if="activeSection === 'articles'"
    v-model:article="articleDraft"
    :can-manage-history="canManageHistory"
    :history-open="historyOpen"
    :preview-article="articlePreview"
    :saving="savingArticle"
    :selected-revision="selectedRevision"
    :status="articleStatus"
    @toggle-history="emit('toggleHistory')"
    @save-article="emit('saveArticle')"
  />

  <CmsGuideCanvas
    v-else-if="activeSection === 'guides'"
    v-model:guide="guideDraft"
    :can-manage-history="canManageHistory"
    :history-open="historyOpen"
    :preview-guide="guidePreview"
    :saving="savingGuide"
    :selected-revision="selectedRevision"
    :status="guideStatus"
    @toggle-history="emit('toggleHistory')"
    @save-guide="emit('saveGuide')"
  />

  <UDashboardPanel
    v-else-if="activeSection === 'site-settings'"
    id="cms-site-settings-editor"
    class="min-w-0 overflow-hidden bg-default"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3 px-4 py-4">
        <div>
          <h1 class="text-2xl text-highlighted">
            Paramètres du site
          </h1>
          <p class="text-sm text-dimmed">
            Nom global, contacts et réseaux sociaux utilisés par l’en-tête du site.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UButton
            v-if="canManageHistory"
            :label="historyOpen ? 'Masquer l’historique' : 'Afficher l’historique'"
            color="neutral"
            variant="outline"
            icon="mingcute:history-line"
            @click="emit('toggleHistory')"
          />

          <UButton
            label="Enregistrer les paramètres"
            color="primary"
            :loading="savingSiteSettings"
            @click="emit('saveSiteSettings')"
          />
        </div>
      </div>
    </template>

    <template #body>
      <div class="px-4 pb-4">
        <CmsSiteSettingsEditor
          v-model:site-settings="siteSettingsDraft"
          class="min-w-0"
        />
      </div>
    </template>
  </UDashboardPanel>

  <CmsSyndicatCanvas
    v-else
    v-model:syndicat="syndicatDraft"
    :can-manage-history="canManageHistory"
    :history-open="historyOpen"
    :saving="savingSyndicat"
    :selected-revision="selectedRevision"
    :union-name="siteSettingsDraft.unionName"
    @toggle-history="emit('toggleHistory')"
    @save-syndicat="emit('saveSyndicat')"
  />
</template>
