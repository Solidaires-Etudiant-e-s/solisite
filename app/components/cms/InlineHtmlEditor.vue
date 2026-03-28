<script setup lang="ts">
const props = defineProps<{
  target: CmsEditableTarget
}>()

const editor = useCmsPageLiveEditor()

const content = computed({
  get: () => String((editor && readPathValue(editor.page, props.target.path)) ?? ''),
  set: (value: string) => {
    editor?.updateField(props.target.path, value)
  }
})

function activate() {
  editor?.openTarget(props.target)
}
</script>

<template>
  <div
    class="overflow-hidden rounded-sm ring-2 ring-primary/50 ring-offset-2"
    @click.stop="activate"
  >
    <CmsRichTextEditor
      v-model="content"
      placeholder="Rédige le contenu ici..."
      editor-class="min-h-[24rem] border-0 bg-white [&_.ProseMirror]:prose-content [&_.ProseMirror]:min-h-[18rem] [&_.ProseMirror]:max-w-none [&_.ProseMirror]:px-4 [&_.ProseMirror]:pb-6 [&_.ProseMirror]:pt-4 [&_.tiptap]:prose-content [&_.tiptap]:min-h-[18rem] [&_.tiptap]:max-w-none [&_.tiptap]:px-4 [&_.tiptap]:pb-6 [&_.tiptap]:pt-4"
      toolbar-class="sticky top-0 z-10 border-b border-default bg-white/95 px-3 py-2 backdrop-blur"
      @focus="activate"
    />
  </div>
</template>
