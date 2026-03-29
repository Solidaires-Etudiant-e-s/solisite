import type { Ref } from 'vue'
import { cloneCmsValue, createEmptyArticle, createEmptyGuide, createEmptyPage, createEmptySiteSettings, createEmptySyndicat, slugify } from '~~/lib/cms'
import type { CmsArticle, CmsBootstrap, CmsGuide, CmsPage, CmsRevision, CmsRevisionEntityType, CmsSiteSettings, CmsSyndicat } from '~~/lib/cms'

type CmsAdminSection = 'pages' | 'articles' | 'guides' | 'syndicats' | 'site-settings'

export function useCmsAdmin(data: Ref<CmsBootstrap | null | undefined>) {
  const activeSection = ref<CmsAdminSection>('pages')
  const expandedGroups = ref(['site-settings', 'pages', 'articles', 'guides', 'syndicats'])
  const toast = useToast()
  const savingPage = ref(false)
  const savingArticle = ref(false)
  const savingGuide = ref(false)
  const savingSyndicat = ref(false)
  const savingSiteSettings = ref(false)
  const creatingArticle = ref(false)
  const creatingGuide = ref(false)
  const creatingSyndicat = ref(false)
  const historyOpen = ref(false)
  const historyLoading = ref(false)
  const restoringRevision = ref(false)
  const syncingArticleSlug = ref(false)
  const articleSlugManuallyEdited = ref(false)
  const syncingGuideSlug = ref(false)
  const guideSlugManuallyEdited = ref(false)
  const revisions = ref<CmsRevision[]>([])
  const selectedRevisionId = ref<number | null>(null)
  const userRole = computed(() => data.value?.auth.user.role ?? 'admin')
  const managedSyndicatId = computed(() => data.value?.auth.managedSyndicatId ?? null)
  const isAdmin = computed(() => userRole.value === 'admin')
  const showSidebar = computed(() => isAdmin.value)

  const pages = ref<CmsPage[]>([])
  const articles = ref<CmsArticle[]>([])
  const guides = ref<CmsGuide[]>([])
  const syndicats = ref<CmsSyndicat[]>([])
  const selectedPageSlug = ref('')
  const selectedArticleId = ref<number | null>(null)
  const selectedGuideId = ref<number | null>(null)
  const selectedSyndicatId = ref<number | null>(null)

  const pageDraft = reactive(createEmptyPage())
  const articleDraft = reactive(createEmptyArticle())
  const guideDraft = reactive(createEmptyGuide())
  const syndicatDraft = reactive(createEmptySyndicat())
  const siteSettingsDraft = reactive(createEmptySiteSettings())

  function applyPageDraft(source: CmsPage) {
    Object.assign(pageDraft, cloneCmsValue(source))
  }

  function applyArticleDraft(source: CmsArticle) {
    Object.assign(articleDraft, cloneCmsValue(source))
  }

  function applyGuideDraft(source: CmsGuide) {
    Object.assign(guideDraft, cloneCmsValue(source))
  }

  function applySyndicatDraft(source: CmsSyndicat) {
    Object.assign(syndicatDraft, cloneCmsValue(source))
  }

  function applySiteSettingsDraft(source: CmsSiteSettings) {
    Object.assign(siteSettingsDraft, cloneCmsValue(source))
  }

  function sortArticles(items: CmsArticle[]) {
    return [...items].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || right.id - left.id)
  }

  function sortGuides(items: CmsGuide[]) {
    return [...items].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || right.id - left.id)
  }

  function sortSyndicats(items: CmsSyndicat[]) {
    return [...items].sort((left, right) => {
      return left.city.localeCompare(right.city, 'fr', { sensitivity: 'base' })
        || left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' })
        || left.id - right.id
    })
  }

  function getSyndicatNavigationLabel(syndicat: CmsSyndicat) {
    const city = syndicat.city.trim()
    const name = syndicat.name.trim()

    if (!city) {
      return name || 'Syndicat sans nom'
    }

    if (!name || city.localeCompare(name, 'fr', { sensitivity: 'base' }) === 0) {
      return city
    }

    return `${city} - ${name}`
  }

  watch(data, (value) => {
    if (!value) {
      return
    }

    pages.value = value.pages
    articles.value = sortArticles(value.articles)
    guides.value = sortGuides(value.guides)
    syndicats.value = sortSyndicats(value.syndicats)
    applySiteSettingsDraft(value.siteSettings)

    if (!selectedPageSlug.value) {
      selectedPageSlug.value = value.pages[0]?.slug || ''
    }

    if (!selectedArticleId.value) {
      selectedArticleId.value = value.articles[0]?.id || null
    }

    if (!selectedGuideId.value) {
      selectedGuideId.value = value.guides[0]?.id || null
    }

    if (!selectedSyndicatId.value) {
      selectedSyndicatId.value = value.syndicats[0]?.id || null
    }

    if (!isAdmin.value) {
      activeSection.value = 'syndicats'
      selectedSyndicatId.value = managedSyndicatId.value
    }
  }, { immediate: true })

  const selectedPage = computed(() => pages.value.find(page => page.slug === selectedPageSlug.value) || null)
  const selectedArticle = computed(() => articles.value.find(article => article.id === selectedArticleId.value) || null)
  const selectedGuide = computed(() => guides.value.find(guide => guide.id === selectedGuideId.value) || null)
  const selectedSyndicat = computed(() => syndicats.value.find(syndicat => syndicat.id === selectedSyndicatId.value) || null)
  const selectedSiteSettings = computed(() => data.value?.siteSettings || null)
  const activeEntityType = computed<CmsRevisionEntityType>(() => {
    if (activeSection.value === 'pages') {
      return 'page'
    }

    if (activeSection.value === 'articles') {
      return 'article'
    }

    if (activeSection.value === 'guides') {
      return 'guide'
    }

    if (activeSection.value === 'site-settings') {
      return 'site-settings'
    }

    return 'syndicat'
  })
  const activeEntityId = computed(() => {
    if (activeSection.value === 'pages') {
      return selectedPageSlug.value
    }

    if (activeSection.value === 'articles') {
      return selectedArticleId.value ? String(selectedArticleId.value) : ''
    }

    if (activeSection.value === 'guides') {
      return selectedGuideId.value ? String(selectedGuideId.value) : ''
    }

    if (activeSection.value === 'site-settings') {
      return 'global'
    }

    return selectedSyndicatId.value ? String(selectedSyndicatId.value) : ''
  })
  const canManageHistory = computed(() => {
    if (isAdmin.value) {
      return true
    }

    return activeSection.value === 'syndicats'
      && managedSyndicatId.value !== null
      && selectedSyndicatId.value === managedSyndicatId.value
  })
  const selectedRevision = computed(() => revisions.value.find(revision => revision.id === selectedRevisionId.value) || null)
  const pageDirty = computed(() => JSON.stringify(pageDraft) !== JSON.stringify(selectedPage.value))
  const articleDirty = computed(() => JSON.stringify(articleDraft) !== JSON.stringify(selectedArticle.value))
  const guideDirty = computed(() => JSON.stringify(guideDraft) !== JSON.stringify(selectedGuide.value))
  const syndicatDirty = computed(() => JSON.stringify(syndicatDraft) !== JSON.stringify(selectedSyndicat.value))
  const siteSettingsDirty = computed(() => JSON.stringify(siteSettingsDraft) !== JSON.stringify(selectedSiteSettings.value))
  const currentDraftIsDirty = computed(() => {
    if (activeSection.value === 'pages') {
      return pageDirty.value
    }

    if (activeSection.value === 'articles') {
      return articleDirty.value
    }

    if (activeSection.value === 'guides') {
      return guideDirty.value
    }

    if (activeSection.value === 'site-settings') {
      return siteSettingsDirty.value
    }

    return syndicatDirty.value
  })
  const pagePreview = computed(() => {
    if (activeSection.value !== 'pages') {
      return pageDraft
    }

    return selectedRevision.value?.entityType === 'page'
      ? cloneCmsValue(selectedRevision.value.snapshot as CmsPage)
      : pageDraft
  })
  const articlePreview = computed(() => selectedRevision.value?.entityType === 'article'
    ? cloneCmsValue(selectedRevision.value.snapshot as CmsArticle)
    : articleDraft)
  const guidePreview = computed(() => selectedRevision.value?.entityType === 'guide'
    ? cloneCmsValue(selectedRevision.value.snapshot as CmsGuide)
    : guideDraft)
  const syndicatPreview = computed(() => selectedRevision.value?.entityType === 'syndicat'
    ? cloneCmsValue(selectedRevision.value.snapshot as CmsSyndicat)
    : syndicatDraft)

  watch(selectedPage, (page) => {
    if (!page) {
      return
    }

    applyPageDraft(page)
  }, { immediate: true })

  watch(selectedArticle, (article) => {
    if (!article) {
      return
    }

    applyArticleDraft(article)
    articleSlugManuallyEdited.value = false
  }, { immediate: true })

  watch(selectedGuide, (guide) => {
    if (!guide) {
      return
    }

    applyGuideDraft(guide)
    guideSlugManuallyEdited.value = false
  }, { immediate: true })

  watch(selectedSyndicat, (syndicat) => {
    if (!syndicat) {
      return
    }

    applySyndicatDraft(syndicat)
  }, { immediate: true })

  watch(selectedSiteSettings, (siteSettings) => {
    if (!siteSettings) {
      return
    }

    applySiteSettingsDraft(siteSettings)
  }, { immediate: true })

  watch(() => articleDraft.slug, (slug) => {
    if (syncingArticleSlug.value || !selectedArticle.value) {
      return
    }

    articleSlugManuallyEdited.value = slug !== selectedArticle.value.slug
  })

  watch(() => articleDraft.title, (title) => {
    if (articleSlugManuallyEdited.value) {
      return
    }

    const nextSlug = slugify(title.trim())

    if (nextSlug) {
      syncingArticleSlug.value = true
      articleDraft.slug = nextSlug
      syncingArticleSlug.value = false
    }
  })

  watch(() => guideDraft.slug, (slug) => {
    if (syncingGuideSlug.value || !selectedGuide.value) {
      return
    }

    guideSlugManuallyEdited.value = slug !== selectedGuide.value.slug
  })

  watch(() => guideDraft.title, (title) => {
    if (guideSlugManuallyEdited.value) {
      return
    }

    const nextSlug = slugify(title.trim())

    if (nextSlug) {
      syncingGuideSlug.value = true
      guideDraft.slug = nextSlug
      syncingGuideSlug.value = false
    }
  })

  const orderedPages = computed(() => {
    const homepage = pages.value.find(page => page.slug === 'home')
    const otherPages = pages.value.filter(page => page.slug !== 'home')

    return homepage ? [homepage, ...otherPages] : otherPages
  })

  const navigationItems = computed(() => [{
    label: 'Paramètres du site',
    icon: 'mingcute:settings-2-line',
    value: 'site-settings',
    active: activeSection.value === 'site-settings',
    onSelect: () => {
      activeSection.value = 'site-settings'
    }
  }, {
    label: 'Pages',
    icon: 'mingcute:doc-line',
    value: 'pages',
    type: 'trigger' as const,
    defaultOpen: true,
    children: orderedPages.value.map(page => ({
      label: page.name,
      icon: page.slug === 'home'
        ? 'mingcute:home-2-line'
        : page.slug === 'syndicats'
          ? 'mingcute:map-line'
          : page.slug === 'guides'
            ? 'mingcute:book-2-line'
            : 'mingcute:file-line',
      value: `page:${page.slug}`,
      active: activeSection.value === 'pages' && selectedPageSlug.value === page.slug,
      onSelect: () => {
        activeSection.value = 'pages'
        selectedPageSlug.value = page.slug
      }
    }))
  }, {
    label: 'Articles',
    icon: 'mingcute:news-line',
    slot: 'articles',
    value: 'articles',
    type: 'trigger' as const,
    defaultOpen: true,
    children: articles.value.map(article => ({
      label: article.title,
      value: `article:${article.id}`,
      active: activeSection.value === 'articles' && selectedArticleId.value === article.id,
      onSelect: () => {
        activeSection.value = 'articles'
        selectedArticleId.value = article.id
      }
    }))
  }, {
    label: 'Guides',
    icon: 'mingcute:book-2-line',
    slot: 'guides',
    value: 'guides',
    type: 'trigger' as const,
    defaultOpen: true,
    children: guides.value.map(guide => ({
      label: guide.title,
      value: `guide:${guide.id}`,
      active: activeSection.value === 'guides' && selectedGuideId.value === guide.id,
      onSelect: () => {
        activeSection.value = 'guides'
        selectedGuideId.value = guide.id
      }
    }))
  }, {
    label: 'Syndicats',
    icon: 'mingcute:map-pin-line',
    slot: 'syndicats',
    value: 'syndicats',
    type: 'trigger' as const,
    defaultOpen: true,
    children: syndicats.value.map(syndicat => ({
      label: getSyndicatNavigationLabel(syndicat),
      value: `syndicat:${syndicat.id}`,
      active: activeSection.value === 'syndicats' && selectedSyndicatId.value === syndicat.id,
      onSelect: () => {
        activeSection.value = 'syndicats'
        selectedSyndicatId.value = syndicat.id
      }
    }))
  }])

  function mergePage(savedPage: CmsPage) {
    pages.value = pages.value.map(page => page.slug === savedPage.slug ? savedPage : page)
    selectedPageSlug.value = savedPage.slug
    activeSection.value = 'pages'
    applyPageDraft(savedPage)
  }

  function resetPageDraft() {
    if (selectedPage.value) {
      applyPageDraft(selectedPage.value)
    }
  }

  function mergeArticle(savedArticle: CmsArticle) {
    const nextArticles = articles.value.some(article => article.id === savedArticle.id)
      ? articles.value.map(article => article.id === savedArticle.id ? savedArticle : article)
      : [savedArticle, ...articles.value]

    articles.value = sortArticles(nextArticles)
    selectedArticleId.value = savedArticle.id
    activeSection.value = 'articles'
    applyArticleDraft(savedArticle)
  }

  function mergeGuide(savedGuide: CmsGuide) {
    const nextGuides = guides.value.some(guide => guide.id === savedGuide.id)
      ? guides.value.map(guide => guide.id === savedGuide.id ? savedGuide : guide)
      : [savedGuide, ...guides.value]

    guides.value = sortGuides(nextGuides)
    selectedGuideId.value = savedGuide.id
    activeSection.value = 'guides'
    applyGuideDraft(savedGuide)
  }

  function mergeSyndicat(savedSyndicat: CmsSyndicat) {
    const nextSyndicats = syndicats.value.some(syndicat => syndicat.id === savedSyndicat.id)
      ? syndicats.value.map(syndicat => syndicat.id === savedSyndicat.id ? savedSyndicat : syndicat)
      : [savedSyndicat, ...syndicats.value]

    syndicats.value = sortSyndicats(nextSyndicats)
    selectedSyndicatId.value = savedSyndicat.id
    activeSection.value = 'syndicats'
    applySyndicatDraft(savedSyndicat)
  }

  function mergeSiteSettings(savedSiteSettings: CmsSiteSettings) {
    if (data.value) {
      data.value.siteSettings = savedSiteSettings
    }

    activeSection.value = 'site-settings'
    applySiteSettingsDraft(savedSiteSettings)
  }

  async function loadRevisions() {
    if (!canManageHistory.value || !historyOpen.value || !activeEntityId.value) {
      revisions.value = []
      selectedRevisionId.value = null
      return
    }

    historyLoading.value = true

    try {
      revisions.value = await $fetch<CmsRevision[]>('/api/cms/revisions', {
        query: {
          entityType: activeEntityType.value,
          entityId: activeEntityId.value
        }
      })

      if (!revisions.value.some(revision => revision.id === selectedRevisionId.value)) {
        selectedRevisionId.value = null
      }
    } finally {
      historyLoading.value = false
    }
  }

  function toggleHistory() {
    if (!canManageHistory.value) {
      return
    }

    historyOpen.value = !historyOpen.value

    if (!historyOpen.value) {
      selectedRevisionId.value = null
      revisions.value = []
      return
    }

    void loadRevisions()
  }

  function selectRevision(id: number | null) {
    selectedRevisionId.value = id
  }

  watch([historyOpen, activeSection, selectedPageSlug, selectedArticleId, selectedGuideId, selectedSyndicatId], ([open]) => {
    if (!open) {
      return
    }

    selectedRevisionId.value = null
    void loadRevisions()
  })

  watch(canManageHistory, (enabled) => {
    if (enabled) {
      return
    }

    historyOpen.value = false
    revisions.value = []
    selectedRevisionId.value = null
  }, { immediate: true })

  async function savePage() {
    if (!isAdmin.value) {
      return
    }

    savingPage.value = true

    try {
      const savedPage = await $fetch<CmsPage>(`/api/cms/pages/${pageDraft.slug}`, {
        method: 'PUT',
        body: pageDraft
      })

      mergePage(savedPage)
      selectedRevisionId.value = null
      await loadRevisions()
      toast.add({
        title: 'Page enregistree',
        color: 'success',
        icon: 'mingcute:check-circle-line'
      })
    } finally {
      savingPage.value = false
    }
  }

  async function createArticleRecord() {
    if (!isAdmin.value) {
      return
    }

    creatingArticle.value = true

    try {
      const savedArticle = await $fetch<CmsArticle>('/api/cms/articles', {
        method: 'POST'
      })

      mergeArticle(savedArticle)
      toast.add({
        title: 'Article cree',
        color: 'success',
        icon: 'mingcute:check-circle-line'
      })
    } finally {
      creatingArticle.value = false
    }
  }

  async function createGuideRecord() {
    if (!isAdmin.value) {
      return
    }

    creatingGuide.value = true

    try {
      const savedGuide = await $fetch<CmsGuide>('/api/cms/guides', {
        method: 'POST'
      })

      mergeGuide(savedGuide)
      toast.add({
        title: 'Guide cree',
        color: 'success',
        icon: 'mingcute:check-circle-line'
      })
    } finally {
      creatingGuide.value = false
    }
  }

  async function createSyndicatRecord() {
    if (!isAdmin.value) {
      return
    }

    creatingSyndicat.value = true

    try {
      const savedSyndicat = await $fetch<CmsSyndicat>('/api/cms/syndicats', {
        method: 'POST'
      })

      mergeSyndicat(savedSyndicat)
      toast.add({
        title: 'Syndicat cree',
        color: 'success',
        icon: 'mingcute:check-circle-line'
      })
    } finally {
      creatingSyndicat.value = false
    }
  }

  async function saveArticle() {
    if (!isAdmin.value || !articleDraft.id) {
      return
    }

    savingArticle.value = true

    try {
      const savedArticle = await $fetch<CmsArticle>(`/api/cms/articles/${articleDraft.id}`, {
        method: 'PUT',
        body: articleDraft
      })

      mergeArticle(savedArticle)
      selectedRevisionId.value = null
      await loadRevisions()
      toast.add({
        title: 'Article enregistre',
        color: 'success',
        icon: 'mingcute:check-circle-line'
      })
    } finally {
      savingArticle.value = false
    }
  }

  async function saveGuide() {
    if (!isAdmin.value || !guideDraft.id) {
      return
    }

    savingGuide.value = true

    try {
      const savedGuide = await $fetch<CmsGuide>(`/api/cms/guides/${guideDraft.id}`, {
        method: 'PUT',
        body: guideDraft
      })

      mergeGuide(savedGuide)
      selectedRevisionId.value = null
      await loadRevisions()
      toast.add({
        title: 'Guide enregistre',
        color: 'success',
        icon: 'mingcute:check-circle-line'
      })
    } finally {
      savingGuide.value = false
    }
  }

  async function saveSyndicat() {
    if (!syndicatDraft.id) {
      return
    }

    savingSyndicat.value = true

    try {
      const savedSyndicat = await $fetch<CmsSyndicat>(`/api/cms/syndicats/${syndicatDraft.id}`, {
        method: 'PUT',
        body: syndicatDraft
      })

      mergeSyndicat(savedSyndicat)
      selectedRevisionId.value = null
      await loadRevisions()
      toast.add({
        title: 'Syndicat enregistre',
        color: 'success',
        icon: 'mingcute:check-circle-line'
      })
    } finally {
      savingSyndicat.value = false
    }
  }

  async function saveSiteSettings() {
    if (!isAdmin.value) {
      return
    }

    savingSiteSettings.value = true

    try {
      const savedSiteSettings = await $fetch<CmsSiteSettings>('/api/cms/site-settings', {
        method: 'PUT',
        body: siteSettingsDraft
      })

      mergeSiteSettings(savedSiteSettings)
      selectedRevisionId.value = null
      await loadRevisions()
      toast.add({
        title: 'Parametres enregistres',
        color: 'success',
        icon: 'mingcute:check-circle-line'
      })
    } finally {
      savingSiteSettings.value = false
    }
  }

  async function restoreSelectedRevision() {
    if (!canManageHistory.value || !selectedRevision.value) {
      return
    }

    if (currentDraftIsDirty.value && !window.confirm('You have unsaved changes. Restore this revision and discard the current draft?')) {
      return
    }

    restoringRevision.value = true

    try {
      const response = await $fetch<
        { entityType: 'page', entity: CmsPage }
        | { entityType: 'article', entity: CmsArticle }
        | { entityType: 'guide', entity: CmsGuide }
        | { entityType: 'syndicat', entity: CmsSyndicat }
        | { entityType: 'site-settings', entity: CmsSiteSettings }
      >(`/api/cms/revisions/${selectedRevision.value.id}/restore`, {
        method: 'POST'
      })

      if (response.entityType === 'page') {
        mergePage(response.entity)
      } else if (response.entityType === 'article') {
        mergeArticle(response.entity)
      } else if (response.entityType === 'guide') {
        mergeGuide(response.entity)
      } else if (response.entityType === 'site-settings') {
        mergeSiteSettings(response.entity)
      } else {
        mergeSyndicat(response.entity)
      }

      selectedRevisionId.value = null
      await loadRevisions()
      toast.add({
        title: 'Revision restauree',
        color: 'success',
        icon: 'mingcute:check-circle-line'
      })
    } finally {
      restoringRevision.value = false
    }
  }

  return {
    activeSection,
    articleDirty,
    articleDraft,
    articlePreview,
    articles,
    canManageHistory,
    createArticleRecord,
    createGuideRecord,
    createSyndicatRecord,
    creatingArticle,
    creatingGuide,
    creatingSyndicat,
    currentDraftIsDirty,
    expandedGroups,
    guideDirty,
    guideDraft,
    guidePreview,
    guides,
    historyLoading,
    historyOpen,
    isAdmin,
    navigationItems,
    pageDirty,
    pageDraft,
    pagePreview,
    resetPageDraft,
    restoreSelectedRevision,
    restoringRevision,
    revisions,
    saveArticle,
    saveGuide,
    savePage,
    saveSiteSettings,
    saveSyndicat,
    savingArticle,
    savingGuide,
    savingPage,
    savingSiteSettings,
    savingSyndicat,
    selectedRevision,
    selectedRevisionId,
    selectRevision,
    showSidebar,
    siteSettingsDraft,
    syndicatDirty,
    syndicatDraft,
    syndicatPreview,
    syndicats,
    toggleHistory
  }
}
