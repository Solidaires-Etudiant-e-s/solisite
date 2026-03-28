<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const search = ref('')
const loading = ref(false)
const error = ref('')
const results = ref<string[]>([])
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const selectedIcon = computed(() => props.modelValue.trim())
const previewIcon = computed(() => selectedIcon.value || 'mingcute:pic-line')

async function runSearch() {
  const term = search.value.trim()

  if (term.length < 2) {
    results.value = []
    error.value = ''
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<{ icons: string[] }>('/api/iconify/search', {
      query: {
        q: term
      }
    })

    results.value = response.icons
  } catch {
    results.value = []
    error.value = 'Impossible de charger les icônes pour le moment.'
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(runSearch, 250)
})

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

function updateValue(value: string) {
  emit('update:modelValue', value)
}

function selectIcon(value: string) {
  updateValue(value)
  open.value = false
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-3 rounded-lg border border-default px-3 py-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
        <UIcon
          :name="previewIcon"
          class="h-5 w-5"
        />
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-highlighted">
          {{ selectedIcon || 'Aucune icône sélectionnée' }}
        </p>
      </div>

      <UPopover v-model:open="open">
        <UButton
          label="Choisir une icône"
          color="neutral"
          variant="outline"
        />

        <template #content>
          <div class="w-[22rem] space-y-3 p-3">
            <UInput
              v-model="search"
              :placeholder="label || 'Rechercher des icônes Mingcute...'"
              icon="mingcute:search-line"
              autofocus
            />

            <div
              v-if="loading"
              class="grid grid-cols-4 gap-2"
            >
              <div
                v-for="index in 8"
                :key="index"
                class="h-12 rounded-md border border-default bg-muted"
              />
            </div>

            <p
              v-else-if="error"
              class="text-sm text-error"
            >
              {{ error }}
            </p>

            <p
              v-else-if="search.trim().length < 2"
              class="text-sm text-dimmed"
            >
              Saisis au moins 2 caractères pour lancer la recherche.
            </p>

            <p
              v-else-if="!results.length"
              class="text-sm text-dimmed"
            >
              Aucune icône trouvée.
            </p>

            <div
              v-else
              class="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto"
            >
              <UButton
                v-for="icon in results"
                :key="icon"
                :title="icon"
                color="neutral"
                :variant="selectedIcon === icon ? 'solid' : 'outline'"
                class="h-12 justify-center"
                @click="selectIcon(icon)"
              >
                <UIcon
                  :name="icon"
                  class="h-5 w-5"
                />
              </UButton>
            </div>
          </div>
        </template>
      </UPopover>
    </div>
  </div>
</template>
