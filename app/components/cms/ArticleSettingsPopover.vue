<script setup lang="ts">
const article = defineModel<CmsArticle>('article', {
  required: true
})
</script>

<template>
  <UPopover>
    <UButton
      label="Paramètres de l’article"
      color="neutral"
      variant="outline"
    />

    <template #content>
      <div class="w-[24rem] space-y-4 p-4">
        <UFormField label="Slug">
          <UInput v-model="article.slug" />
        </UFormField>
      </div>
    </template>
  </UPopover>
</template>
