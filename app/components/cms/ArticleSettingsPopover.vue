<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CmsArticle, CmsSyndicat } from '~~/lib/cms'
import { slugify } from '~~/lib/cms'

const article = defineModel<CmsArticle>('article', {
  required: true
})

const props = defineProps<{
  isAdmin: boolean
  syndicats: CmsSyndicat[]
}>()

const newTag = ref('')

const syndicatOptions = computed<Array<{ label: string, value: number | null }>>(() => [
  { label: 'Aucun (article du site national)', value: null },
  ...props.syndicats.map(syndicat => ({
    label: syndicatNavigationLabel(syndicat),
    value: syndicat.id
  }))
])

function syndicatNavigationLabel(syndicat: CmsSyndicat) {
  const city = syndicat.city.trim()
  const name = syndicat.name.trim()

  if (!city) {
    return name || 'Syndicat sans nom'
  }

  if (!name || city.localeCompare(name, 'fr', { sensitivity: 'base' }) === 0) {
    return city
  }

  return `${city} - ${name}`
}

function addTag() {
  const value = newTag.value.trim()
  if (!value) return
  if (!article.value.tags) article.value.tags = []
  if (!article.value.tags.some(t => t.slug === slugify(value))) {
    article.value.tags.push({ id: 0, name: value, slug: slugify(value), icon: '' })
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
              <UIcon
                name="mingcute:close-line"
                class="ml-1 h-3 w-3"
              />
            </UBadge>
          </div>
        </UFormField>

        <UFormField
          v-if="isAdmin"
          label="Syndicat"
          description="Afficher cet article sur la page du syndicat choisi et le rendre modifiable par ses membres."
        >
          <USelectMenu
            v-model="article.syndicatId"
            :items="syndicatOptions"
            value-key="value"
            placeholder="Aucun syndicat"
          />
        </UFormField>
      </div>
    </template>
  </UPopover>
</template>
