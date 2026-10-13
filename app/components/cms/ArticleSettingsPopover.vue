<script setup lang="ts">
import { computed } from 'vue'
import type { CmsArticle, CmsSyndicat, CmsTag } from '~~/lib/cms'
import { slugify } from '~~/lib/cms'

const article = defineModel<CmsArticle>('article', {
  required: true
})

const props = defineProps<{
  isAdmin: boolean
  syndicats: CmsSyndicat[]
  availableTags?: CmsTag[]
}>()

const availableCategories = computed<CmsTag[]>(() => props.availableTags ?? [])

const selectedCategorySlugs = computed<string[]>({
  get: () => (article.value.tags ?? []).map(tag => tag.slug),
  set: (slugs: string[]) => {
    const knownBySlug = new Map<string, CmsTag>()
    for (const tag of [...availableCategories.value, ...(article.value.tags ?? [])]) {
      if (!knownBySlug.has(tag.slug)) {
        knownBySlug.set(tag.slug, tag)
      }
    }

    article.value.tags = slugs
      .map(slug => knownBySlug.get(slug))
      .filter((tag): tag is CmsTag => Boolean(tag))
  }
})

const categoryItems = computed<Array<{ label: string, value: string, icon?: string }>>(() =>
  availableCategories.value.map(tag => ({
    label: tag.name,
    value: tag.slug,
    icon: tag.icon || undefined
  }))
)

function addCategoryFromSearch(rawValue: string) {
  const value = rawValue.trim()
  if (!value) return
  if (!article.value.tags) article.value.tags = []
  const slug = slugify(value)
  if (!slug) return
  const existing = availableCategories.value.find(tag => tag.slug === slug)
  if (existing && !article.value.tags.some(t => t.slug === slug)) {
    article.value.tags.push({ ...existing })
    return
  }
  if (!article.value.tags.some(t => t.slug === slug)) {
    article.value.tags.push({ id: 0, name: value, slug, icon: '' })
  }
}

function onCreateCategory(rawValue: string | string[]) {
  const value = Array.isArray(rawValue) ? rawValue[0] ?? '' : rawValue
  addCategoryFromSearch(value)
}

function removeCategory(category: { slug: string }) {
  article.value.tags = (article.value.tags ?? []).filter(t => t.slug !== category.slug)
}

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

        <UFormField
          label="Catégories"
          description="Sélectionne une ou plusieurs catégories existantes, ou crée-en une nouvelle."
        >
          <USelectMenu
            v-model="selectedCategorySlugs"
            :items="categoryItems"
            value-key="value"
            multiple
            :search-input="{ placeholder: 'Rechercher une catégorie...' }"
            create-item
            placeholder="Choisir des catégories..."
            @create="onCreateCategory"
          >
            <template #create-item-label="{ item }">
              <span>Créer la catégorie « {{ item }} »</span>
            </template>
          </USelectMenu>
          <div
            v-if="(article.tags ?? []).length"
            class="mt-2 flex flex-wrap gap-1"
          >
            <UBadge
              v-for="tag in article.tags"
              :key="tag.slug"
              color="neutral"
              variant="subtle"
              class="cursor-pointer"
              @click="removeCategory(tag)"
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
