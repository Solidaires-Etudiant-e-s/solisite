<script setup lang="ts">
import { isExternalHref } from '~/utils/cmsUi'

const props = defineProps<{
  socials: CmsSocialLink[]
}>()

const visibleSocials = computed(() => (props.socials || []).filter(social => social.href))
</script>

<template>
  <UPageSection
    v-if="visibleSocials.length"
    id="socials"
    :ui="{ container: 'px-3 sm:px-4 lg:px-5 py-10 sm:py-14 lg:py-16' }"
  >
    <UPageCTA
      title="Nos Réseaux"
      description="Retrouve Solidaires Étudiant·es sur nos différents réseaux."
      variant="subtle"
      class="rounded-none sm:rounded-xl"
      :ui="{
        container: 'px-4 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14 gap-6 sm:gap-8',
        links: 'justify-center gap-3'
      }"
    >
      <template #links>
        <UButton
          v-for="social in visibleSocials"
          :key="`${social.label}-${social.href}`"
          :label="social.label || social.href"
          :icon="social.icon || 'mingcute:link-line'"
          :to="social.href"
          :target="isExternalHref(social.href) ? '_blank' : undefined"
          color="neutral"
          variant="outline"
          size="lg"
        />
      </template>
    </UPageCTA>
  </UPageSection>
</template>
