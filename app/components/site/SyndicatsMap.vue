<script setup lang="ts">
import { nextTick } from 'vue'
import { toLinkTarget } from '~/utils/cmsUi'
import { formatSyndicatDisplayName, getPrimarySyndicatAddress, resolveSyndicatAddresses } from '~~/lib/cms'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const BASE = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/'

// Corsica + overseas territories, to exclude
const excludedDepts = ['2A', '2B', '971', '972', '973', '974', '976']
const excludedRegions = ['01', '02', '03', '04', '06', '94']

// Below this zoom level, city labels are deduped (one label per city); above it, each syndicat gets its full name
const ZOOM_LABEL_THRESHOLD = 7

const props = defineProps<{
  syndicats: CmsSyndicat[]
  activeSyndicatSlug?: string | null
  interactiveLinks?: boolean
  unionName?: string
}>()

const emit = defineEmits<{
  select: [syndicatSlug: string]
}>()

const colorMode = useColorMode()

const mapContainer = ref<HTMLElement | null>(null)
let map: maplibregl.Map | null = null
const markers = new Map<string, maplibregl.Marker>()
const popupContainers = new Map<string, HTMLDivElement>()

function getPopupContainer(slug: string) {
  let el = popupContainers.get(slug)

  if (!el) {
    el = document.createElement('div')
    popupContainers.set(slug, el)
  }

  return el
}

// Marker colors follow the site's solired/stone palette (app/assets/css/main.css)
const markerStrokeColor = computed(() => colorMode.value === 'dark' ? '#57534e' : '#fee2e2')
const markerActiveStrokeColor = computed(() => colorMode.value === 'dark' ? '#e7e5e4' : '#ffffff')
const markerFillColor = computed(() => colorMode.value === 'dark' ? '#f87171' : '#d20808')
const markerActiveFillColor = computed(() => colorMode.value === 'dark' ? '#fca5a5' : '#9a0606')

// Map chrome colors mirror the site's stone neutral scale for each theme
const mapTheme = computed(() => {
  const dark = colorMode.value === 'dark'

  return {
    background: dark ? '#0c0a09' : '#f5f5f4',
    land: dark ? '#1c1917' : '#fafaf9',
    deptLine: dark ? '#44403c' : '#d6d3d1',
    regionLine: dark ? '#e7e5e4' : '#292524'
  }
})

let stylesReady = false

function applyMapTheme() {
  if (!map || !stylesReady) return

  const theme = mapTheme.value

  map.setPaintProperty('bg', 'background-color', theme.background)
  map.setPaintProperty('regions-fill', 'fill-color', theme.land)
  map.setPaintProperty('departements-line', 'line-color', theme.deptLine)
  map.setPaintProperty('regions-line', 'line-color', theme.regionLine)
  applyCityLabelTheme()
}

const cityLabelColor = computed(() => colorMode.value === 'dark' ? '#d6d3d1' : '#44403c')
const cityLabelHaloColor = computed(() => colorMode.value === 'dark' ? '#0c0a09' : '#fafaf9')
const cityLabelElements: HTMLElement[] = []

function applyCityLabelTheme() {
  const color = cityLabelColor.value
  const halo = cityLabelHaloColor.value
  const shadow = [-1, 1].flatMap(x => [-1, 1].map(y => `${x}px ${y}px 0 ${halo}`)).join(', ')

  for (const el of cityLabelElements) {
    el.style.color = color
    el.style.textShadow = shadow
  }
}

function createCityLabelElement(name: string) {
  const el = document.createElement('div')

  el.textContent = name
  el.style.fontSize = '1rem'
  el.style.fontFamily = 'var(--font-serif)'
  el.style.fontWeight = '600'
  el.style.whiteSpace = 'nowrap'
  el.style.pointerEvents = 'none'
  el.style.userSelect = 'none'

  return el
}

let labelMarkers: maplibregl.Marker[] = []

function clearLabels() {
  for (const marker of labelMarkers) {
    marker.remove()
  }
  labelMarkers = []
  cityLabelElements.length = 0
}

// One label per city, deduped (e.g. several Paris syndicats share a single "Paris" label)
const cityLabelEntries = computed(() => {
  const grouped = new Map<string, { name: string, lngLat: [number, number] }>()

  for (const syndicat of props.syndicats) {
    const city = syndicat.city?.trim()
    if (!city) continue

    const primaryAddress = getPrimarySyndicatAddress(resolveSyndicatAddresses(syndicat))
    if (!primaryAddress?.latitude || !primaryAddress.longitude) continue

    const key = city.toLocaleLowerCase('fr')
    if (!grouped.has(key)) {
      grouped.set(key, { name: city, lngLat: [primaryAddress.longitude, primaryAddress.latitude] })
    }
  }

  return [...grouped.values()]
})

function renderLabels() {
  if (!map) return

  clearLabels()

  const entries = isZoomedIn.value
    ? markerEntries.value.map(entry => ({
        name: formatSyndicatDisplayName(entry.syndicat.name, props.unionName),
        lngLat: entry.lngLat
      }))
    : cityLabelEntries.value

  for (const entry of entries) {
    const el = createCityLabelElement(entry.name)
    cityLabelElements.push(el)

    const marker = new maplibregl.Marker({ element: el, anchor: 'left', offset: [5, 0] })
      .setLngLat(entry.lngLat)
      .addTo(map)

    labelMarkers.push(marker)
  }

  applyCityLabelTheme()
}

const markerEntries = computed(() => {
  const grouped = new Map<string, CmsSyndicat[]>()

  for (const syndicat of props.syndicats) {
    const primaryAddress = getPrimarySyndicatAddress(resolveSyndicatAddresses(syndicat))

    if (!primaryAddress?.latitude || !primaryAddress.longitude) {
      continue
    }

    const key = `${primaryAddress.latitude}:${primaryAddress.longitude}`
    const items = grouped.get(key) || []
    items.push(syndicat)
    grouped.set(key, items)
  }

  return [...grouped.values()].flatMap((group) => {
    return group.map((syndicat, index) => {
      const primaryAddress = getPrimarySyndicatAddress(resolveSyndicatAddresses(syndicat))
      const count = group.length
      const offsetRadius = count > 1 ? 0.12 : 0
      const angle = count > 1 ? (Math.PI * 2 * index) / count : 0

      return {
        syndicat,
        lngLat: [
          (primaryAddress?.longitude || 0) + Math.cos(angle) * offsetRadius,
          (primaryAddress?.latitude || 0) + Math.sin(angle) * offsetRadius
        ] as [number, number]
      }
    })
  })
})

function createMarkerElement(active: boolean) {
  const el = document.createElement('div')
  const size = active ? 20 : 16

  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.borderRadius = '9999px'
  el.style.cursor = 'pointer'
  el.style.boxSizing = 'border-box'
  el.style.border = `3px solid ${active ? markerActiveStrokeColor.value : markerStrokeColor.value}`
  el.style.backgroundColor = active ? markerActiveFillColor.value : markerFillColor.value
  el.style.boxShadow = '0 1px 4px rgba(15, 23, 42, 0.35)'

  return el
}

function renderMarkers() {
  if (!map) return

  const nextSlugs = new Set(markerEntries.value.map(entry => entry.syndicat.slug))

  for (const [slug, marker] of markers) {
    if (!nextSlugs.has(slug)) {
      marker.remove()
      markers.delete(slug)
    }
  }

  for (const entry of markerEntries.value) {
    const slug = entry.syndicat.slug
    markers.get(slug)?.remove()

    const active = slug === props.activeSyndicatSlug
    const el = createMarkerElement(active)

    el.addEventListener('click', (event) => {
      event.stopPropagation()
      emit('select', slug)
    })

    const popup = new maplibregl.Popup({
      offset: 18,
      closeButton: true,
      maxWidth: 'none',
      className: 'syndicat-popup'
    }).setDOMContent(getPopupContainer(slug))

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(entry.lngLat)
      .setPopup(popup)
      .addTo(map)

    markers.set(slug, marker)
  }
}

const zoomLevel = ref(0)
const isZoomedIn = computed(() => zoomLevel.value >= ZOOM_LABEL_THRESHOLD)

function openActivePopup() {
  const slug = props.activeSyndicatSlug

  for (const [markerSlug, marker] of markers) {
    if (markerSlug !== slug && marker.getPopup()?.isOpen()) {
      marker.togglePopup()
    }
  }

  if (!slug || !map) {
    return
  }

  const marker = markers.get(slug)
  if (!marker) return

  if (!marker.getPopup()?.isOpen()) {
    marker.togglePopup()
  }

  const lngLat = marker.getLngLat()
  map.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 8, duration: 350 })
}

watch(mapContainer, (container) => {
  if (!container || map) return

  const instance = new maplibregl.Map({
    container,
    style: {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'bg',
          type: 'background',
          paint: { 'background-color': mapTheme.value.background }
        }
      ]
    },
    bounds: [
      [-5.3, 41.2],
      [9.7, 51.3]
    ],
    fitBoundsOptions: { padding: 20 }
  })
  map = instance

  instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

  instance.on('zoom', () => {
    zoomLevel.value = instance.getZoom()
  })

  instance.on('load', () => {
    instance.addSource('regions', {
      type: 'geojson',
      data: BASE + 'regions-version-simplifiee.geojson'
    })
    instance.addSource('departements', {
      type: 'geojson',
      data: BASE + 'departements-version-simplifiee.geojson'
    })

    const regionFilter: maplibregl.FilterSpecification = [
      '!',
      ['in', ['get', 'code'], ['literal', excludedRegions]]
    ]
    const deptFilter: maplibregl.FilterSpecification = [
      '!',
      ['in', ['get', 'code'], ['literal', excludedDepts]]
    ]

    instance.addLayer({
      id: 'regions-fill',
      type: 'fill',
      source: 'regions',
      filter: regionFilter,
      paint: { 'fill-color': mapTheme.value.land }
    })

    instance.addLayer({
      id: 'departements-line',
      type: 'line',
      source: 'departements',
      filter: deptFilter,
      paint: { 'line-color': mapTheme.value.deptLine, 'line-width': 0.6 }
    })

    instance.addLayer({
      id: 'regions-line',
      type: 'line',
      source: 'regions',
      filter: regionFilter,
      paint: { 'line-color': mapTheme.value.regionLine, 'line-width': 1.8 }
    })

    stylesReady = true
    zoomLevel.value = instance.getZoom()
    renderLabels()
    renderMarkers()
    openActivePopup()
  })
}, { immediate: true })

onBeforeUnmount(() => {
  for (const marker of markers.values()) {
    marker.remove()
  }
  markers.clear()
  clearLabels()
  map?.remove()
  map = null
})

watch([markerEntries, () => props.activeSyndicatSlug, colorMode], async () => {
  applyMapTheme()
  renderMarkers()
  renderLabels()
  await nextTick()
  openActivePopup()
})

watch(isZoomedIn, () => {
  renderLabels()
})
</script>

<template>
  <ClientOnly>
    <div
      class="relative h-[min(70vh,42rem)] min-h-96 w-full [&_.maplibregl-popup-anchor-bottom_.maplibregl-popup-tip]:!border-t-(--ui-bg) [&_.maplibregl-popup-anchor-left_.maplibregl-popup-tip]:!border-r-(--ui-bg) [&_.maplibregl-popup-anchor-right_.maplibregl-popup-tip]:!border-l-(--ui-bg) [&_.maplibregl-popup-anchor-top_.maplibregl-popup-tip]:!border-b-(--ui-bg) [&_.maplibregl-popup-close-button]:right-2 [&_.maplibregl-popup-close-button]:top-2 [&_.maplibregl-popup-close-button]:text-(--ui-text-muted) [&_.maplibregl-popup-content]:!bg-(--ui-bg) [&_.maplibregl-popup-content]:rounded-2xl [&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:shadow-[0_18px_45px_rgba(15,23,42,0.18)] [&_.maplibregl-ctrl-attrib]:!bg-white/90 [&_.maplibregl-ctrl-attrib]:!text-slate-700 [&_.maplibregl-ctrl-attrib]:text-[0.6875rem] [&_.maplibregl-ctrl-attrib_a]:!text-slate-900 [&_.maplibregl-ctrl-group]:!bg-white/90"
    >
      <div
        ref="mapContainer"
        class="h-full w-full"
      />

      <Teleport
        v-for="entry in markerEntries"
        :key="entry.syndicat.slug"
        :to="getPopupContainer(entry.syndicat.slug)"
      >
        <div class="w-[17rem] bg-default p-2.5">
          <p class="mb-1 text-sm font-semibold text-muted">
            {{ entry.syndicat.city || 'Ville à préciser' }}
          </p>
          <h3 class="m-0 text-[1.05rem] leading-snug text-highlighted">
            <NuxtImg
              :src="entry.syndicat.logo || '/logo.png'"
              :alt="formatSyndicatDisplayName(entry.syndicat.name, props.unionName)"
              class="mr-2 inline-block h-9 w-9 rounded object-cover align-text-bottom"
            />
            {{ formatSyndicatDisplayName(entry.syndicat.name, props.unionName) }}
          </h3>

          <div
            v-if="resolveSyndicatAddresses(entry.syndicat).length"
            class="mt-2 space-y-2"
          >
            <div
              v-for="(address, index) in resolveSyndicatAddresses(entry.syndicat)"
              :key="`${entry.syndicat.slug}-address-${index}`"
            >
              <p
                v-if="address.label"
                class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted"
              >
                {{ address.label }}
              </p>
              <p class="whitespace-pre-line text-sm leading-5 text-toned">
                {{ address.address }}
              </p>
            </div>
          </div>

          <div class="mt-2.5 flex flex-wrap gap-1.5">
            <UButton
              v-if="entry.syndicat.email"
              label="Mail"
              color="neutral"
              variant="outline"
              size="sm"
              class="border-default !text-toned hover:!text-highlighted [&_*]:!text-inherit"
              :to="props.interactiveLinks === false ? undefined : `mailto:${entry.syndicat.email}`"
            />
            <UButton
              v-for="(social, index) in entry.syndicat.socials || []"
              :key="`${entry.syndicat.slug}-${index}-${social.label}`"
              :label="social.label || social.href"
              color="neutral"
              variant="outline"
              size="sm"
              class="border-default !text-toned hover:!text-highlighted [&_*]:!text-inherit"
              :to="props.interactiveLinks === false ? undefined : social.href"
              :target="toLinkTarget(social.href || '')"
            />
            <UButton
              label="Voir la fiche"
              color="primary"
              size="sm"
              class="text-inverted"
              trailing-icon="mingcute:arrow-right-line"
              :to="props.interactiveLinks === false ? undefined : `/syndicats/${entry.syndicat.slug}`"
            />
          </div>
        </div>
      </Teleport>
    </div>

    <template #fallback>
      <div class="h-[min(70vh,42rem)] min-h-96 w-full animate-pulse rounded-xl bg-muted" />
    </template>
  </ClientOnly>
</template>
