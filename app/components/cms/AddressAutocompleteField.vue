<script setup lang="ts">
interface AddressSuggestion {
  address: string
  city: string
  label: string
  latitude: number
  longitude: number
}

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  select: [value: AddressSuggestion]
}>()

const query = ref(props.modelValue)
const suggestions = ref<AddressSuggestion[]>([])
const loading = ref(false)
const error = ref('')
const menuOpen = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | null = null
let activeRequest: AbortController | null = null

watch(() => props.modelValue, (value) => {
  query.value = value
})

const selectionPending = computed(() => query.value.trim() !== props.modelValue.trim())

function clearSuggestions() {
  suggestions.value = []
  menuOpen.value = false
}

async function searchAddress(value: string) {
  activeRequest?.abort()

  const term = value.trim()

  if (term.length < 3) {
    loading.value = false
    error.value = ''
    clearSuggestions()
    return
  }

  loading.value = true
  error.value = ''
  const controller = new AbortController()
  activeRequest = controller

  try {
    const url = new URL('https://api-adresse.data.gouv.fr/search/')
    url.searchParams.set('q', term)
    url.searchParams.set('limit', '6')
    url.searchParams.set('autocomplete', '1')

    const response = await fetch(url.toString(), {
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error('Search failed.')
    }

    const payload = await response.json() as {
      features?: Array<{
        geometry?: { coordinates?: [number, number] }
        properties?: {
          city?: string
          label?: string
        }
      }>
    }

    suggestions.value = (payload.features || [])
      .map((feature) => {
        const label = feature.properties?.label || ''
        const city = feature.properties?.city || ''
        const coordinates = feature.geometry?.coordinates || [0, 0]
        const longitude = Number(coordinates[0])
        const latitude = Number(coordinates[1])

        if (!label || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null
        }

        return {
          address: label,
          city,
          label,
          latitude,
          longitude
        }
      })
      .filter((entry): entry is AddressSuggestion => Boolean(entry))

    menuOpen.value = true
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === 'AbortError') {
      return
    }

    suggestions.value = []
    menuOpen.value = true
    error.value = 'Recherche indisponible.'
  } finally {
    if (activeRequest === controller) {
      activeRequest = null
    }

    loading.value = false
  }
}

function handleQueryChange(value: string) {
  query.value = value

  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    void searchAddress(value)
  }, 180)
}

function selectSuggestion(entry: AddressSuggestion) {
  query.value = entry.address
  emit('select', entry)
  clearSuggestions()
}

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  activeRequest?.abort()
})
</script>

<template>
  <div class="relative space-y-2">
    <UInput
      class="w-full"
      :model-value="query"
      placeholder="Chercher une adresse"
      icon="mingcute:search-line"
      @update:model-value="handleQueryChange(String($event || ''))"
      @focus="menuOpen = suggestions.length > 0 || loading || Boolean(error)"
    />

    <p
      v-if="selectionPending"
      class="text-xs text-warning"
    >
      Choisis une suggestion pour enregistrer l’adresse et ses coordonnées.
    </p>
    <p
      v-else-if="modelValue"
      class="text-xs text-muted"
    >
      Adresse sélectionnée depuis l’autocomplétion.
    </p>

    <div
      v-if="menuOpen"
      class="max-h-64 overflow-y-auto rounded-xl border border-default bg-default shadow-lg"
    >
      <div
        v-if="loading"
        class="px-3 py-2 text-sm text-muted"
      >
        Recherche en cours…
      </div>

      <div
        v-else-if="error"
        class="px-3 py-2 text-sm text-error"
      >
        {{ error }}
      </div>

      <div
        v-else-if="!suggestions.length"
        class="px-3 py-2 text-sm text-muted"
      >
        Aucune adresse trouvée.
      </div>

      <button
        v-for="(entry, index) in suggestions"
        :key="`${entry.address}-${index}`"
        type="button"
        class="block w-full border-b border-default px-3 py-2 text-left last:border-b-0 hover:bg-muted"
        @click="selectSuggestion(entry)"
      >
        <span class="block text-sm text-highlighted">
          {{ entry.label }}
        </span>
        <span
          v-if="entry.city"
          class="block text-xs text-muted"
        >
          {{ entry.city }}
        </span>
      </button>
    </div>
  </div>
</template>
