<script setup lang="ts">
import { formatFrenchDate } from '~/utils/cmsUi'

const props = defineProps<{
  guide: CmsGuide
  immersive?: boolean
}>()

const editor = useCmsPageLiveEditor()
const publishedLabel = computed(() => formatFrenchDate(props.guide.publishedAt))
const guideHref = computed(() => `/guides/${props.guide.slug}`)
const isArchived = computed(() => props.guide.archived)
const coverImgClass = computed(() => isArchived.value ? 'grayscale' : '')

function openGuide() {
  if (editor) {
    return
  }
  void navigateTo(guideHref.value)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }
  event.preventDefault()
  void openGuide()
}
</script>

<template>
  <component
    :is="props.immersive ? 'div' : 'UCard'"
    :class="[
      props.immersive ? 'h-[28rem] group group-hover:z-10' : 'h-full overflow-hidden',
      !editor && props.immersive ? 'cursor-pointer' : ''
    ]"
    :role="!editor && props.immersive ? 'link' : undefined"
    :tabindex="!editor && props.immersive ? 0 : undefined"
    @click="props.immersive ? openGuide() : undefined"
    @keydown="props.immersive ? handleKeydown($event) : undefined"
  >
    <component
      :is="editor || props.immersive ? 'div' : 'NuxtLink'"
      :to="editor || props.immersive ? undefined : guideHref"
      class="block h-full"
    >
      <div
        v-if="props.immersive"
        class="relative h-full"
      >
        <div class="absolute inset-0 fan-page fan-page-2 rounded-lg overflow-hidden">
          <NuxtImg
            :src="props.guide.coverImage || '/hero.jpg'"
            :class="coverImgClass"
            class="h-full w-full scale-110 object-cover brightness-75 saturate-50 blur-2xl"
            aria-hidden="true"
            draggable="false"
          />
        </div>
        <div class="absolute inset-0 fan-page fan-page-1 rounded-lg overflow-hidden">
          <NuxtImg
            :src="props.guide.coverImage || '/hero.jpg'"
            :class="coverImgClass"
            class="h-full w-full scale-110 object-cover brightness-75 saturate-50 blur-2xl"
            aria-hidden="true"
            draggable="false"
          />
        </div>

        <div class="relative z-10 h-full overflow-hidden rounded-lg shadow-xl ring-1 ring-black/5">
          <NuxtImg
            :src="props.guide.coverImage || '/hero.jpg'"
            :alt="props.guide.title"
            :class="coverImgClass"
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            draggable="false"
            format="webp"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div class="absolute inset-0 flex flex-col justify-end gap-4 p-6">
            <UBadge
              color="neutral"
              variant="solid"
              class="w-fit border border-default/70 bg-default/90 text-highlighted backdrop-blur-sm"
            >
              {{ publishedLabel }}
            </UBadge>

            <UBadge
              v-if="isArchived"
              color="warning"
              variant="solid"
              class="w-fit border border-default/70 bg-default/90 backdrop-blur-sm"
            >
              Archivé
            </UBadge>

            <h2 class="text-3xl leading-tight text-white">
              {{ props.guide.title }}
            </h2>

            <p class="line-clamp-2 text-sm text-white/80">
              {{ props.guide.excerpt }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div class="relative">
          <div class="absolute -inset-2 fan-page fan-page-2 rounded-lg" />
          <div class="absolute -inset-2 fan-page fan-page-1 rounded-lg" />

          <div class="relative z-10">
            <NuxtImg
              :src="props.guide.coverImage || '/hero.jpg'"
              :alt="props.guide.title"
              :class="coverImgClass"
              class="h-48 w-full object-cover"
              loading="lazy"
              decoding="async"
              draggable="false"
              format="webp"
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ publishedLabel }}
          </UBadge>

          <UBadge
            v-if="isArchived"
            color="warning"
            variant="soft"
          >
            Archivé
          </UBadge>

          <UIcon
            v-if="props.guide.pdfFile"
            name="mingcute:file-pdf-line"
            class="text-lg text-primary"
          />
        </div>

        <div class="space-y-2">
          <h2 class="text-xl text-highlighted">
            {{ props.guide.title }}
          </h2>
          <p class="text-sm text-toned line-clamp-2">
            {{ props.guide.excerpt }}
          </p>
        </div>
      </div>
    </component>
  </component>
</template>

<style scoped>
.fan-page {
  background: #e5e7eb;
  border: 1px solid #d1d5db;
  transform-origin: center left;
  will-change: transform;
}

.fan-page-1 {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
  transform: translate(5px, 3px) rotate(0.4deg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.fan-page-2 {
  background: #d4d6d9;
  border-color: #b0b2b5;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) 0.03s, box-shadow 0.25s ease 0.03s;
  transform: translate(8px, 5px) rotate(0.8deg);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.group:hover .fan-page-1 {
  transform: translate(7px, 4px) rotate(0.7deg);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
}

.group:hover .fan-page-2 {
  transform: translate(11px, 7px) rotate(1.2deg);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}
</style>
