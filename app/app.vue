<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'fr'
  }
})

const title = 'Solidaires Étudiant·es'
const description = 'Syndicats de luttes, militant pour une université gratuite, ouverte à tous·tes,  de  qualité,  émancipatrice  et  autogérée.'

useSeoMeta({ title, description, ogTitle: title, ogDescription: description })
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        <span />
      </template>

      <template #right>
        <UButton
          icon="mingcute:bluesky-social-line"
          variant="outline"
          color="neutral"
          size="md"
          href="https://bsky.app/profile/solidaires-etudiant-e-s.org"
          target="_blank"
        />
        <UButton
          icon="mingcute:facebook-line"
          variant="outline"
          color="neutral"
          size="md"
          href="https://www.facebook.com/solidairesetudiantes"
          target="_blank"
        />
        <UButton
          icon="mingcute:instagram-line"
          variant="outline"
          color="neutral"
          size="md"
          href="https://www.instagram.com/solidairesetu"
          target="_blank"
        />
        <UButton
          icon="mingcute:mastodon-line"
          variant="outline"
          color="neutral"
          size="md"
          href="https://mastodon.social/@solidairesetu"
          target="_blank"
        />
        <UButton
          icon="mingcute:social-x-line"
          variant="outline"
          color="neutral"
          size="md"
          href="https://x.com/SolidairesEtu"
          target="_blank"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
