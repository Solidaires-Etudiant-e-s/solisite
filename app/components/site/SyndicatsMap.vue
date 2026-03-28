<script setup lang="ts">
import { nextTick } from 'vue'
import { toLinkTarget } from '~/utils/cmsUi'
import { formatSyndicatDisplayName } from '~~/lib/cms'

const props = defineProps<{
  syndicats: CmsSyndicat[]
  activeSyndicatSlug?: string | null
  interactiveLinks?: boolean
  unionName?: string
}>()

const emit = defineEmits<{
  select: [syndicatSlug: string]
}>()

const mapRef = useTemplateRef('mapRef')
const markerRefs = new Map<string, { leafletObject?: { openPopup?: () => void, closePopup?: () => void, getLatLng?: () => unknown } }>()

const defaultCenter: [number, number] = [46.603354, 1.888334]
const defaultZoom = 5.8

const markerEntries = computed(() => {
  const grouped = new Map<string, CmsSyndicat[]>()

  for (const syndicat of props.syndicats) {
    if (!syndicat.latitude || !syndicat.longitude) {
      continue
    }

    const key = `${syndicat.latitude}:${syndicat.longitude}`
    const items = grouped.get(key) || []
    items.push(syndicat)
    grouped.set(key, items)
  }

  return [...grouped.values()].flatMap((group) => {
    return group.map((syndicat, index) => {
      const count = group.length
      const offsetRadius = count > 1 ? 0.12 : 0
      const angle = count > 1 ? (Math.PI * 2 * index) / count : 0

      return {
        syndicat,
        latLng: [
          syndicat.latitude + Math.sin(angle) * offsetRadius,
          syndicat.longitude + Math.cos(angle) * offsetRadius
        ] as [number, number]
      }
    })
  })
})

const center = computed<[number, number]>(() => {
  const active = props.syndicats.find(syndicat => syndicat.slug === props.activeSyndicatSlug)

  if (active?.latitude && active?.longitude) {
    return [active.latitude, active.longitude]
  }

  return defaultCenter
})

const zoom = computed(() => props.activeSyndicatSlug ? 8 : defaultZoom)

function setMarkerRef(slug: string, instance: unknown) {
  if (!instance) {
    markerRefs.delete(slug)
    return
  }

  markerRefs.set(slug, instance as { leafletObject?: { openPopup?: () => void, closePopup?: () => void, getLatLng?: () => unknown } })
}

watch(() => props.activeSyndicatSlug, async (slug) => {
  await nextTick()

  for (const [markerSlug, marker] of markerRefs) {
    if (markerSlug !== slug) {
      marker.leafletObject?.closePopup?.()
    }
  }

  if (!slug) {
    return
  }

  const marker = markerRefs.get(slug)
  const latLng = marker?.leafletObject?.getLatLng?.()

  marker?.leafletObject?.openPopup?.()

  if (latLng) {
    mapRef.value?.leafletObject?.flyTo?.(latLng as [number, number], zoom.value, {
      duration: 0.35
    })
  }
}, { immediate: true })
</script>

<template>
  <div
    class="h-[min(70vh,42rem)] min-h-96 w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:font-inherit [&_.leaflet-control-attribution]:text-[0.6875rem] [&_.leaflet-popup-close-button]:right-2 [&_.leaflet-popup-close-button]:top-2 [&_.leaflet-popup-close-button]:text-(--ui-text-muted) [&_.leaflet-popup-content-wrapper]:rounded-2xl [&_.leaflet-popup-content-wrapper]:p-0 [&_.leaflet-popup-content-wrapper]:shadow-[0_18px_45px_rgba(15,23,42,0.18)] [&_.leaflet-popup-content]:!m-0 [&_.leaflet-popup-content]:min-w-0 [&_.leaflet-popup-content]:w-auto [&_.leaflet-popup-tip]:shadow-none"
  >
    <LMap
      ref="mapRef"
      :zoom="zoom"
      :center="center"
      :use-global-leaflet="false"
      :options="{
        zoomControl: true,
        scrollWheelZoom: false
      }"
    >
      <LTileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
        attribution="&amp;copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a> contributors"
      />

      <LCircleMarker
        v-for="entry in markerEntries"
        :key="entry.syndicat.slug"
        :ref="instance => setMarkerRef(entry.syndicat.slug, instance)"
        :lat-lng="entry.latLng"
        :radius="entry.syndicat.slug === activeSyndicatSlug ? 10 : 8"
        :weight="3"
        :color="entry.syndicat.slug === activeSyndicatSlug ? '#ffffff' : '#fee2e2'"
        :fill-color="entry.syndicat.slug === activeSyndicatSlug ? '#b91c1c' : '#d20808'"
        :fill-opacity="0.95"
        @click="emit('select', entry.syndicat.slug)"
      >
        <LPopup :options="{ className: 'syndicat-popup', offset: [0, -8] }">
          <div class="w-[17rem] p-2.5">
            <p class="mb-1 text-sm font-semibold text-muted">
              {{ entry.syndicat.city || 'Ville à préciser' }}
            </p>
            <h3 class="m-0 text-[1.05rem] leading-snug text-highlighted">
              {{ formatSyndicatDisplayName(entry.syndicat.name, props.unionName) }}
            </h3>

            <p
              v-if="entry.syndicat.address"
              class="mt-2 whitespace-pre-line text-sm leading-5 text-toned"
            >
              {{ entry.syndicat.address }}
            </p>

            <div class="mt-2.5 flex flex-wrap gap-1.5">
              <UButton
                v-if="entry.syndicat.email"
                label="Mail"
                color="neutral"
                variant="outline"
                size="sm"
                class="border-default !text-neutral-700 hover:!text-black [&_*]:!text-inherit"
                :to="props.interactiveLinks === false ? undefined : `mailto:${entry.syndicat.email}`"
              />
              <UButton
                v-for="(social, index) in entry.syndicat.socials || []"
                :key="`${entry.syndicat.slug}-${index}-${social.label}`"
                :label="social.label || social.href"
                color="neutral"
                variant="outline"
                size="sm"
                class="border-default !text-neutral-700 hover:!text-black [&_*]:!text-inherit"
                :to="props.interactiveLinks === false ? undefined : social.href"
                :target="toLinkTarget(social.href || '')"
              />
              <UButton
                label="Voir la fiche"
                color="primary"
                size="sm"
                class="bg-[#d20808] text-white hover:bg-[#b60a0a]"
                trailing-icon="mingcute:arrow-right-line"
                :to="props.interactiveLinks === false ? undefined : `/syndicats/${entry.syndicat.slug}`"
              />
            </div>
          </div>
        </LPopup>
      </LCircleMarker>
    </LMap>
  </div>
</template>
