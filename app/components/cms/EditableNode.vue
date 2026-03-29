<script setup lang="ts">
import { createListItemTargetFromListTarget } from '~/utils/cmsEditor'

defineOptions({
  inheritAttrs: false
})

const props = withDefaults(defineProps<{
  target: CmsEditableTarget
  tag?: string
  wrapperClass?: string
}>(), {
  tag: 'div',
  wrapperClass: ''
})

const attrs = useAttrs()
const editor = useCmsPageLiveEditor()
const isDraggableItem = computed(() => Boolean(editor && props.target.kind === 'list-item' && props.target.listPath))
const open = computed({
  get: () => editor?.selectedTarget.value?.id === props.target.id,
  set: (value: boolean) => {
    if (!editor) {
      return
    }

    if (value) {
      editor.openTarget(props.target)
      return
    }

    editor.closeTarget()
  }
})

function activate(event: MouseEvent) {
  if (!editor) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  if (props.target.kind === 'list' && props.target.itemType) {
    const index = editor.insertItem(props.target.path, props.target.itemType)

    if (index !== null) {
      const nextTarget = createListItemTargetFromListTarget(props.target, index)

      if (nextTarget) {
        editor.openTarget(nextTarget)
      }
    }

    return
  }

  editor.openTarget(props.target)
}
</script>

<template>
  <component
    :is="tag"
    v-if="!editor"
    :class="[attrs.class, wrapperClass]"
  >
    <slot />
  </component>

  <CmsInlineHtmlEditor
    v-else-if="target.kind === 'html'"
    :target="target"
    :class="[attrs.class, wrapperClass]"
  />

  <UPopover
    v-else
    v-model:open="open"
  >
    <component
      :is="tag"
      :class="[
        attrs.class,
        wrapperClass,
        'rounded-sm ring-offset-2 transition',
        isDraggableItem ? 'cursor-grab active:cursor-grabbing' : '',
        open ? 'ring-2 ring-primary' : 'cursor-pointer hover:ring-2 hover:ring-primary/40'
      ]"
      @click="activate"
    >
      <slot />
    </component>

    <template #content>
      <CmsEditablePopover :target="target" />
    </template>
  </UPopover>
</template>
