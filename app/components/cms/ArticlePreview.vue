<script setup lang="ts">
const props = withDefaults(defineProps<{
  article: CmsArticle
  compact?: boolean
}>(), {
  compact: false
})
</script>

<template>
  <SiteArticlePageView
    :article="{
      ...props.article,
      title: props.article.title || 'Article sans titre',
      excerpt: props.article.excerpt || 'Ajoute un extrait pour résumer le contenu de cet article.',
      content: props.article.content || '<p>Commence à écrire pour prévisualiser l’article.</p>',
      coverImage: props.article.coverImage || '/hero.jpg',
      publishedAt: props.article.publishedAt || new Date().toISOString()
    }"
  />
</template>
