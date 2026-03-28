<script setup lang="ts">
const { data, refresh } = await useFetch<CmsBootstrap>('/api/cms/bootstrap')
const {
  activeSection,
  articleDraft,
  articlePreview,
  articleStatus,
  articles,
  createArticleRecord,
  createSyndicatRecord,
  creatingArticle,
  creatingSyndicat,
  currentDraftIsDirty,
  expandedGroups,
  canManageHistory,
  historyLoading,
  historyOpen,
  isAdmin,
  navigationItems,
  pageDraft,
  pagePreview,
  pageStatus,
  resetPageDraft,
  restoreSelectedRevision,
  restoringRevision,
  revisions,
  saveArticle,
  savePage,
  saveSiteSettings,
  saveSyndicat,
  savingArticle,
  savingPage,
  savingSiteSettings,
  savingSyndicat,
  showSidebar,
  selectedRevision,
  selectedRevisionId,
  selectRevision,
  siteSettingsDraft,
  syndicatDraft,
  syndicatPreview,
  syndicatStatus,
  syndicats,
  toggleHistory
} = useCmsAdmin(data)

await refresh()

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!currentDraftIsDirty.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

if (import.meta.client) {
  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
}

useSeoMeta({
  title: 'CMS',
  description: 'Gérer les pages et articles stockés dans SQLite.'
})

useHead({
  meta: [{
    name: 'robots',
    content: 'noindex, nofollow, noarchive, nosnippet'
  }, {
    name: 'googlebot',
    content: 'noindex, nofollow, noarchive, nosnippet'
  }]
})
</script>

<template>
  <div class="flex min-h-screen bg-white">
    <UDashboardGroup class="flex-1">
      <CmsSidebar
        v-if="showSidebar"
        :expanded-groups="expandedGroups"
        :navigation-items="navigationItems"
        :creating-article="creatingArticle"
        :creating-syndicat="creatingSyndicat"
        @update:expanded-groups="expandedGroups = $event"
        @create-article="createArticleRecord"
        @create-syndicat="createSyndicatRecord"
      />

      <div class="flex min-w-0 flex-1 gap-0 bg-white">
        <CmsEditorPanel
          v-model:page-draft="pageDraft"
          v-model:article-draft="articleDraft"
          v-model:site-settings-draft="siteSettingsDraft"
          v-model:syndicat-draft="syndicatDraft"
          :articles="articles"
          :active-section="activeSection"
          :article-preview="articlePreview"
          :can-manage-history="canManageHistory"
          :history-open="historyOpen"
          :is-admin="isAdmin"
          :page-preview="pagePreview"
          :page-status="pageStatus"
          :selected-revision="selectedRevision"
          :article-status="articleStatus"
          :syndicats="syndicats"
          :syndicat-preview="syndicatPreview"
          :syndicat-status="syndicatStatus"
          :saving-page="savingPage"
          :saving-article="savingArticle"
          :saving-site-settings="savingSiteSettings"
          :saving-syndicat="savingSyndicat"
          @toggle-history="toggleHistory"
          @save-page="savePage"
          @reset-page="resetPageDraft"
          @save-article="saveArticle"
          @save-site-settings="saveSiteSettings"
          @save-syndicat="saveSyndicat"
        />

        <CmsRevisionSidebar
          v-if="historyOpen"
          :active-section="activeSection"
          :current-draft-is-dirty="currentDraftIsDirty"
          :history-loading="historyLoading"
          :revisions="revisions"
          :selected-revision="selectedRevision"
          :selected-revision-id="selectedRevisionId"
          :restoring-revision="restoringRevision"
          @toggle-history="toggleHistory"
          @select-revision="selectRevision"
          @restore-revision="restoreSelectedRevision"
        />
      </div>
    </UDashboardGroup>
  </div>
</template>
