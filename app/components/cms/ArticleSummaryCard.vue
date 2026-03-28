<script setup lang="ts">
import { formatFrenchDate } from '~/utils/cmsUi'

const props = defineProps<{
  article: CmsArticle
  immersive?: boolean
}>()

const editor = useCmsPageLiveEditor()
const publishedLabel = computed(() => formatFrenchDate(props.article.publishedAt))
</script>

<template>
  <component
    :is="props.immersive ? 'div' : 'UCard'"
    class="border border-default bg-elevated"
    :class="props.immersive ? 'h-[28rem] overflow-hidden' : 'h-full'"
  >
    <component
      :is="editor ? 'div' : 'NuxtLink'"
      :to="editor ? undefined : `/articles/${article.slug}`"
      class="block h-full transition-opacity hover:opacity-90"
    >
      <div
        v-if="props.immersive"
        class="relative h-full"
      >
        <img
          :src="article.coverImage || '/hero.jpg'"
          :alt="article.title"
          class="absolute inset-0 h-full w-full object-cover"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div class="absolute inset-x-0 bottom-0 flex h-full flex-col justify-end gap-4 p-6">
          <UBadge
            color="neutral"
            variant="solid"
            class="w-fit bg-white/90 text-black"
          >
            {{ publishedLabel }}
          </UBadge>
          <h2 class="text-3xl leading-tight text-white">
            {{ article.title }}
          </h2>
        </div>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <img
          :src="article.coverImage || '/hero.jpg'"
          :alt="article.title"
          class="h-48 w-full object-cover"
        >

        <div class="flex items-center gap-3">
          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ publishedLabel }}
          </UBadge>
        </div>

        <div class="space-y-2">
          <h2 class="text-2xl text-highlighted">
            {{ article.title }}
          </h2>
          <p class="text-toned">
            {{ article.excerpt }}
          </p>
        </div>
      </div>
    </component>
  </component>
</template>
