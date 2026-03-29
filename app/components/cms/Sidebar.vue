<script setup lang="ts">
const appConfig = useAppConfig()

const props = defineProps<{
  expandedGroups: string[]
  navigationItems: Array<Record<string, unknown>>
  creatingArticle: boolean
  creatingGuide: boolean
  creatingSyndicat: boolean
}>()

const emit = defineEmits<{
  'update:expandedGroups': [value: string[]]
  'createArticle': []
  'createGuide': []
  'createSyndicat': []
}>()
</script>

<template>
  <UDashboardSidebar
    resizable
    :ui="{ footer: 'border-t border-default' }"
  >
    <template #header>
      <h2 class="text-xl font-bold">
        Gestion Solisite
      </h2>
    </template>

    <template #default>
      <UNavigationMenu
        :model-value="expandedGroups"
        :items="navigationItems"
        orientation="vertical"
        @update:model-value="emit('update:expandedGroups', Array.isArray($event) ? $event : [])"
      >
        <template #[`articles-trailing`]="{ active, ui }">
          <UButton
            icon="mingcute:plus-line"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :loading="props.creatingArticle"
            class="-my-1"
            @click.stop="emit('createArticle')"
          />
          <UIcon
            :name="appConfig.ui.icons.chevronDown"
            data-slot="linkTrailingIcon"
            :class="ui.linkTrailingIcon({ active })"
          />
        </template>

        <template #[`guides-trailing`]="{ active, ui }">
          <UButton
            icon="mingcute:plus-line"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :loading="props.creatingGuide"
            class="-my-1"
            @click.stop="emit('createGuide')"
          />
          <UIcon
            :name="appConfig.ui.icons.chevronDown"
            data-slot="linkTrailingIcon"
            :class="ui.linkTrailingIcon({ active })"
          />
        </template>

        <template #[`syndicats-trailing`]="{ active, ui }">
          <UButton
            icon="mingcute:plus-line"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :loading="props.creatingSyndicat"
            class="-my-1"
            @click.stop="emit('createSyndicat')"
          />
          <UIcon
            :name="appConfig.ui.icons.chevronDown"
            data-slot="linkTrailingIcon"
            :class="ui.linkTrailingIcon({ active })"
          />
        </template>
      </UNavigationMenu>
    </template>
  </UDashboardSidebar>
</template>
