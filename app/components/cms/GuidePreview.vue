<script setup lang="ts">
const props = defineProps<{
  guide: CmsGuide
}>()
</script>

<template>
  <SiteGuidePageView
    :guide="{
      ...props.guide,
      title: props.guide.title || 'Guide sans titre',
      excerpt: props.guide.excerpt || 'Ajoute un extrait pour résumer le contenu de ce guide.',
      content: props.guide.content || '<p>Commence à écrire pour prévisualiser le guide.</p>',
      coverImage: props.guide.coverImage || '/hero.jpg',
      publishedAt: props.guide.publishedAt || new Date().toISOString()
    }"
  />
</template>
