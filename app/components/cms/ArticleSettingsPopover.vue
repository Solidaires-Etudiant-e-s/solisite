<script setup lang="ts">
import { ref } from 'vue'
import type { CmsArticle } from '~~/lib/cms'
import { slugify } from '~~/lib/cms'

const article = defineModel<CmsArticle>('article', {
  required: true
})

const newTag = ref('')

function addTag() {
  const value = newTag.value.trim()
  if (!value) return
  if (!article.value.tags) article.value.tags = []
  if (!article.value.tags.some(t => t.slug === slugify(value))) {
    article.value.tags.push({ id: 0, name: value, slug: slugify(value) })
  }
  newTag.value = ''
}

function removeTag(tag: { slug: string }) {
  article.value.tags = (article.value.tags ?? []).filter(t => t.slug !== tag.slug)
}
</script>

<template>
  <UPopover>
    <UButton
      label="Paramètres de l'article"
      color="neutral"
      variant="outline"
    />

    <template #content>
      <div class="w-[24rem] space-y-4 p-4">
        <UFormField label="Slug">
          <UInput v-model="article.slug" />
        </UFormField>

        <UFormField label="Tags">
          <div class="flex gap-2">
            <UInput
              v-model="newTag"
              placeholder="ajouter un tag"
              @keydown.enter.prevent="addTag"
            />
            <UButton
              label="Ajouter"
              color="neutral"
              variant="outline"
              @click="addTag"
            />
          </div>
          <div class="mt-2 flex flex-wrap gap-1">
            <UBadge
              v-for="tag in article.tags"
              :key="tag.slug"
              color="neutral"
              variant="subtle"
              class="cursor-pointer"
              @click="removeTag(tag)"
            >
              {{ tag.name }}
              <UIcon name="mingcute:close-line" class="ml-1 h-3 w-3" />
            </UBadge>
          </div>
        </UFormField>
      </div>
    </template>
  </UPopover>
</template>
