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
    :ui="{ container: 'py-0' }"
  >
    <div class="border-y border-default bg-elevated/30">
      <div class="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-14 text-center">
        <h2 class="font-black text-4xl uppercase tracking-tight text-highlighted sm:text-5xl">
          Nos Réseaux
        </h2>

        <div class="grid w-full grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <NuxtLink
            v-for="social in visibleSocials"
            :key="`${social.label}-${social.href}`"
            :to="social.href"
            :target="isExternalHref(social.href) ? '_blank' : undefined"
            class="group flex flex-col items-center gap-3 rounded-xl px-4 py-3 transition hover:-translate-y-0.5"
          >
            <div class="flex h-12 w-12 items-center justify-center text-4xl text-highlighted transition group-hover:text-primary">
              <UIcon
                :name="social.icon || 'mingcute:link-line'"
                class="h-9 w-9"
              />
            </div>

            <span class="text-xl font-black tracking-tight text-highlighted">
              {{ social.label || social.href }}
            </span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </UPageSection>
</template>
