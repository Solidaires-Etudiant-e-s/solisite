<script setup lang="ts">
const props = defineProps<{
  syndicat: CmsSyndicat
  unionName?: string
}>()
</script>

<template>
  <SiteSyndicatPageView
    :union-name="props.unionName"
    :syndicat="{
      ...props.syndicat,
      name: props.syndicat.name || 'Syndicat local',
      city: props.syndicat.city || 'Ville à préciser',
      content: props.syndicat.content || '<p>Ajoute une présentation pour ce syndicat.</p>'
    }"
  />
</template>
