<script setup lang="ts">
import { createEditableTarget } from '~/utils/cmsEditor'
import type { CmsPage } from '~~/lib/cms'

defineProps<{
  page: CmsPage
  titleTag?: string
  titleClass?: string
  descriptionClass?: string
}>()
</script>

<template>
  <div class="space-y-4">
    <CmsEditableNode
      :tag="titleTag || 'h1'"
      :class="titleClass || 'text-4xl text-highlighted'"
      :target="createEditableTarget(`${page.slug}:headline`, 'headline', 'Titre principal')"
    >
      {{ page.headline }}
    </CmsEditableNode>

    <CmsEditableNode
      tag="div"
      :class="descriptionClass || 'max-w-3xl text-lg text-toned'"
      :target="createEditableTarget(`${page.slug}:subheadline`, 'subheadline', 'Sous-titre', true)"
    >
      {{ page.subheadline }}
    </CmsEditableNode>
  </div>
</template>
