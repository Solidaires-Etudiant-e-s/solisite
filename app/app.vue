<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

import { toLinkTarget } from '~/utils/cmsUi'
import { resolveSeoImage, resolveSiteUrl, useCanonicalHead } from '~/utils/seo'
import { createEmptySiteSettings } from '~~/lib/cms'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const toast = useToast()
const { data: siteSettingsData } = await useFetch<CmsSiteSettings>('/api/site-settings')
const themeColor = '#d20808'

const siteSettings = computed(() => siteSettingsData.value ?? createEmptySiteSettings())
const siteName = computed(() => siteSettings.value.unionName || 'Solidaires Étudiant·es')
const description = computed(() => siteSettings.value.siteDescription || 'Syndicats de luttes, militant pour une université gratuite, ouverte à tous·tes, de qualité, émancipatrice et autogérée.')
const siteUrl = computed(() => resolveSiteUrl(runtimeConfig.public.siteUrl))
const defaultSocialImage = computed(() => resolveSeoImage({ image: '/hero.jpg', siteUrl: siteUrl.value }))
const gitRepositoryUrl = computed(() => runtimeConfig.public.gitRepositoryUrl || 'https://github.com/Solidaires-Etudiant-e-s/solisite')
const gitCommitShort = computed(() => runtimeConfig.public.gitCommitShort || '')
const gitCommitUrl = computed(() => {
  if (!gitRepositoryUrl.value || !gitCommitShort.value) {
    return ''
  }

  return `${gitRepositoryUrl.value.replace(/\.git$/, '')}/commit/${gitCommitShort.value}`
})

const showSiteHeader = computed(() => !route.path.startsWith('/admin'))
const showSiteFooter = computed(() => !route.path.startsWith('/admin'))
const navigationLinks = computed<NavigationMenuItem[]>(() => [{
  label: 'Accueil',
  to: '/',
  active: route.path === '/'
}, {
  label: 'À propos',
  to: '/a-propos',
  active: route.path.startsWith('/a-propos')
}, {
  label: 'International',
  to: '/international',
  active: route.path.startsWith('/international')
}, {
  label: 'Articles',
  to: '/articles',
  active: route.path.startsWith('/articles')
}, {
  label: 'Guides',
  to: '/guides',
  active: route.path.startsWith('/guides')
}, {
  label: 'Syndicats',
  to: '/syndicats',
  active: route.path.startsWith('/syndicats')
}])
const headerButtons = computed(() => {
  const buttons: Array<{ icon: string, href: string, target?: string, label: string }> = []

  if (siteSettings.value.contactEmail) {
    buttons.push({
      icon: 'mingcute:mail-line',
      href: `mailto:${siteSettings.value.contactEmail}`,
      label: 'Email'
    })
  }

  if (siteSettings.value.contactPhone) {
    buttons.push({
      icon: 'mingcute:phone-line',
      href: `tel:${siteSettings.value.contactPhone.replace(/\s+/g, '')}`,
      label: 'Téléphone'
    })
  }

  for (const social of siteSettings.value.socials) {
    if (!social.href) {
      continue
    }

    buttons.push({
      icon: social.icon || 'mingcute:link-line',
      href: social.href,
      target: toLinkTarget(social.href),
      label: social.label || social.href
    })
  }

  return buttons
})

onMounted(() => {
  if (route.path.startsWith('/admin')) {
    return
  }

  toast.add({
    title: 'Site en beta',
    description: 'Ce site est en beta. Attendez-vous a des bugs et merci de tous les signaler.',
    color: 'warning',
    icon: 'mingcute:alert-line'
  })
})

const canonical = useCanonicalHead(() => route.fullPath || '/', siteUrl)

useHead({
  htmlAttrs: {
    lang: 'fr'
  },
  meta: [{
    name: 'theme-color',
    content: themeColor
  }, {
    name: 'msapplication-TileColor',
    content: themeColor
  }],
  titleTemplate: (titleChunk) => {
    const cleanSiteName = siteName.value

    if (!titleChunk || titleChunk === cleanSiteName) {
      return cleanSiteName
    }

    return `${titleChunk} | ${cleanSiteName}`
  }
})

useSeoMeta({
  title: siteName,
  description,
  applicationName: siteName,
  ogSiteName: siteName,
  ogLocale: 'fr_FR',
  ogType: 'website',
  ogTitle: siteName,
  ogDescription: description,
  ogUrl: canonical,
  ogImage: defaultSocialImage,
  twitterCard: 'summary_large_image',
  twitterTitle: siteName,
  twitterDescription: description,
  twitterImage: defaultSocialImage
})
</script>

<template>
  <UApp class="site-shell">
    <UHeader
      v-if="showSiteHeader"
      :title="siteName"
      mode="drawer"
      :ui="{ container: 'sm:!px-0' }"
    >
      <template #title>
        <NuxtLink
          to="/"
          class="text-2xl font-bold font-serif"
        >
          {{ siteName }}
        </NuxtLink>
      </template>

      <UNavigationMenu :items="navigationLinks" />

      <template #right>
        <div class="hidden lg:flex items-center gap-1.5">
          <UButton
            v-for="button in headerButtons"
            :key="`${button.label}-${button.href}`"
            :icon="button.icon"
            variant="outline"
            color="neutral"
            :href="button.href"
            :target="button.target"
            :aria-label="button.label"
            :title="button.label"
          />
        </div>
      </template>

      <template #body>
        <div class="space-y-6">
          <UNavigationMenu
            :items="navigationLinks"
            orientation="vertical"
            class="-mx-2.5"
          />

          <div
            v-if="headerButtons.length"
            class="flex flex-wrap gap-2"
          >
            <UButton
              v-for="button in headerButtons"
              :key="`mobile-${button.label}-${button.href}`"
              :icon="button.icon"
              variant="outline"
              color="neutral"
              :href="button.href"
              :target="button.target"
              :aria-label="button.label"
              :title="button.label"
            />
          </div>
        </div>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <footer
      v-if="showSiteFooter"
      class="site-footer"
    >
      <div class="site-footer__inner">
        <p class="site-footer__line">
          <UIcon
            name="mingcute:world-2-line"
            class="site-footer__icon"
          />
          <span>Site web réalisé par les militant·e·s de Solidaires Étudiant·e·s publié sous licence </span>
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            AGPL-3.0
          </a>
          <span>.</span>
        </p>

        <p class="site-footer__line">
          <UIcon
            name="mingcute:github-line"
            class="site-footer__icon"
          />
          <span>Code source disponible sur </span>
          <a
            :href="gitRepositoryUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <template v-if="gitCommitShort && gitCommitUrl">
            <span>, commit actuel </span>
            <a
              :href="gitCommitUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ gitCommitShort }}
            </a>
          </template>
          <span>.</span>
        </p>
      </div>
    </footer>
  </UApp>
</template>
