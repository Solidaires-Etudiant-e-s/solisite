<script setup lang="ts">
import { toLinkTarget } from '~/utils/cmsUi'
import { createEmptySiteSettings } from '~~/lib/cms'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const toast = useToast()
const { data: siteSettingsData } = await useFetch<CmsSiteSettings>('/api/site-settings')

const siteSettings = computed(() => siteSettingsData.value ?? createEmptySiteSettings())
const title = computed(() => siteSettings.value.unionName || 'Solidaires Étudiant·es')
const description = computed(() => siteSettings.value.siteDescription || 'Syndicats de luttes, militant pour une université gratuite, ouverte à tous·tes, de qualité, émancipatrice et autogérée.')
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
const navigationLinks = [{
  label: 'Accueil',
  to: '/'
}, {
  label: 'À propos',
  to: '/a-propos'
}, {
  label: 'Articles',
  to: '/articles'
}, {
  label: 'Syndicats',
  to: '/syndicats'
}]
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

useSeoMeta({ title, description, ogTitle: title, ogDescription: description })
</script>

<template>
  <UApp class="site-shell">
    <UHeader v-if="showSiteHeader">
      <template #title>
        <div class="flex flex-wrap items-center gap-x-8 gap-y-2">
          <h1 class="text-2xl font-bold">
            <NuxtLink to="/">{{ siteSettings.unionName || 'Solidaires Étudiant·es' }}</NuxtLink>
          </h1>

          <nav class="flex flex-wrap items-center gap-x-5 gap-y-1">
            <NuxtLink
              v-for="link in navigationLinks"
              :key="link.to"
              :to="link.to"
              class="text-sm font-semibold text-toned transition hover:text-highlighted"
              :class="route.path === link.to || (link.to !== '/' && route.path.startsWith(`${link.to}/`)) ? 'text-highlighted' : ''"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
        </div>
      </template>

      <template #right>
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
