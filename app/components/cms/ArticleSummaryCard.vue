<script setup lang="ts">
import { NuxtLink } from '#components'
import { formatFrenchDate } from '~/utils/cmsUi'

const props = defineProps<{
  article: CmsArticleSummary
  immersive?: boolean
}>()

const editor = useCmsPageLiveEditor()
const publishedLabel = computed(() => formatFrenchDate(props.article.publishedAt))
const articleHref = computed(() => `/articles/${props.article.slug}`)
</script>

<template>
  <component
    :is="props.immersive ? 'div' : 'UCard'"
    class="border border-default bg-elevated"
    :class="[
      props.immersive ? 'h-[28rem] overflow-hidden' : 'h-full',
      !editor && props.immersive ? 'transition-opacity hover:opacity-90' : ''
    ]"
  >
    <component
      :is="editor ? 'div' : NuxtLink"
      :to="editor ? undefined : articleHref"
      class="block h-full"
    >
      <div
        v-if="props.immersive"
        class="relative h-full"
      >
        <NuxtImg
          :src="article.coverImage || '/hero.jpg'"
          :alt="article.title"
          class="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          draggable="false"
          format="webp"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div class="absolute inset-x-0 bottom-0 flex h-full flex-col justify-end gap-4 p-6">
          <UBadge
            v-for="tag in article.tags"
            :key="tag.slug"
            color="primary"
            variant="solid"
            class="w-fit flex items-center gap-1.5"
          >
            <UIcon
              v-if="tag.icon"
              :name="tag.icon"
              class="h-3 w-3"
            />
            {{ tag.name }}
          </UBadge>
          <UBadge
            color="neutral"
            variant="solid"
            class="w-fit border border-default/70 bg-default/90 text-highlighted backdrop-blur-sm"
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
        <NuxtImg
          :src="article.coverImage || '/hero.jpg'"
          :alt="article.title"
          class="h-48 w-full object-cover"
          loading="lazy"
          decoding="async"
          draggable="false"
          format="webp"
        />

        <div class="flex items-center gap-3">
          <UBadge
            v-for="tag in article.tags"
            :key="tag.slug"
            color="primary"
            variant="soft"
            class="flex items-center gap-1.5"
          >
            <UIcon
              v-if="tag.icon"
              :name="tag.icon"
              class="h-3 w-3"
            />
            {{ tag.name }}
          </UBadge>
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
