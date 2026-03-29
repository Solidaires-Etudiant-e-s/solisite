<script setup lang="ts">
import { requireCmsData, resolveSiteSettings } from '~/utils/cmsData'
import { buildSeoTitle, firstNonEmpty, resolveSeoImage, resolveSiteUrl, truncateText } from '~/utils/seo'

const [{ data: pageData }, { data: articlesData }, { data: siteSettingsData }] = await Promise.all([
  useFetch<CmsPage>('/api/pages/home'),
  useArticles(),
  useFetch<CmsSiteSettings>('/api/site-settings')
])

const page = computed(() => requireCmsData(pageData.value, 'Page d’accueil introuvable.'))
const articles = computed(() => articlesData.value || [])
const siteSettings = computed(() => resolveSiteSettings(siteSettingsData.value))
const runtimeConfig = useRuntimeConfig()
const router = useRouter()
const siteName = computed(() => siteSettings.value.unionName || 'Solidaires Étudiant·es')
const siteUrl = computed(() => resolveSiteUrl(runtimeConfig.public.siteUrl))
const socialImage = computed(() => resolveSeoImage({
  image: articles.value[0]?.coverImage,
  fallbackImage: '/hero.jpg',
  siteUrl: siteUrl.value
}))
const seoDescription = computed(() => truncateText(firstNonEmpty(
  page.value.description,
  page.value.subheadline,
  siteSettings.value.siteDescription
)))
const internationalPromptDismissedKey = 'solisite:international-prompt-dismissed'
const showInternationalRedirectPrompt = ref(false)

function isFrenchLanguage(locale: string | null | undefined) {
  return /^fr(?:[-_]|$)/i.test(String(locale || '').trim())
}

function rememberInternationalPromptDismissal() {
  localStorage.setItem(internationalPromptDismissedKey, 'true')
}

function dismissInternationalRedirectPrompt() {
  rememberInternationalPromptDismissal()
  showInternationalRedirectPrompt.value = false
}

async function acceptInternationalRedirect() {
  dismissInternationalRedirectPrompt()
  await router.push('/international')
}

onMounted(() => {
  if (localStorage.getItem(internationalPromptDismissedKey) === 'true') {
    return
  }

  const deviceLanguages = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language]
  const hasFrenchLanguage = deviceLanguages.some(language => isFrenchLanguage(language))

  if (!hasFrenchLanguage) {
    showInternationalRedirectPrompt.value = true
  }
})

useSeoMeta({
  title: page.value.title,
  description: seoDescription,
  ogTitle: () => buildSeoTitle(page.value.title, siteName.value),
  ogDescription: seoDescription,
  ogImage: socialImage,
  twitterTitle: () => buildSeoTitle(page.value.title, siteName.value),
  twitterDescription: seoDescription,
  twitterImage: socialImage
})
</script>

<template>
  <div>
    <SiteHomePageView
      :page="page"
      :articles="articles"
      :site-settings="siteSettings"
    />

    <UModal
      v-model:open="showInternationalRedirectPrompt"
      title="International version available"
      description="Your device language does not appear to be French. Do you want to open the international page instead?"
      :close="false"
      :dismissible="false"
    >
      <template #body>
        <p class="text-sm text-toned">
          You can keep browsing the French site if you prefer.
        </p>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            label="Stay here"
            color="neutral"
            variant="ghost"
            @click="dismissInternationalRedirectPrompt"
          />
          <UButton
            label="Go to international page"
            color="primary"
            @click="acceptInternationalRedirect"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
