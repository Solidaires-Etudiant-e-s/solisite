<script setup lang="ts">
const guide = defineModel<CmsGuide>('guide', {
  required: true
})
</script>

<template>
  <UPopover>
    <UButton
      label="Paramètres du guide"
      color="neutral"
      variant="outline"
    />

    <template #content>
      <div class="w-[24rem] space-y-4 p-4">
        <UFormField label="Slug">
          <UInput v-model="guide.slug" />
        </UFormField>

        <UFormField label="Archivé">
          <UButton
            :label="guide.archived ? 'Archivé' : 'Actif'"
            :color="guide.archived ? 'warning' : 'success'"
            variant="soft"
            :icon="guide.archived ? 'mingcute:archive-line' : 'mingcute:archive-fill'"
            @click="guide.archived = !guide.archived"
          />
        </UFormField>
      </div>
    </template>
  </UPopover>
</template>
