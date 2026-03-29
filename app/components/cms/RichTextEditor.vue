<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import ImageResize from 'tiptap-extension-resize-image'
import { cmsRichTextToolbarItems, uploadCmsFile, uploadCmsImage } from '~/utils/cmsUi'

const content = defineModel<string>({
  required: true
})

const props = withDefaults(defineProps<{
  placeholder?: string
  editorClass?: string
  toolbarClass?: string
  imageUploadEndpoint?: string
  fileUploadEndpoint?: string
}>(), {
  placeholder: '',
  editorClass: '',
  toolbarClass: '',
  imageUploadEndpoint: '/api/cms/uploads/content-image',
  fileUploadEndpoint: '/api/cms/uploads/content-file'
})

const emit = defineEmits<{
  focus: []
}>()

const toast = useToast()
const imageInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadingKind = ref<'image' | 'file' | null>(null)

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;'
  })[character] || character)
}

function openImagePicker() {
  imageInput.value?.click()
}

function openFilePicker() {
  fileInput.value?.click()
}

function resetInput(target: EventTarget | null) {
  if (target instanceof HTMLInputElement) {
    target.value = ''
  }
}

async function handleImageSelection(event: Event, editor: Editor | null) {
  const target = event.target
  const file = target instanceof HTMLInputElement ? target.files?.[0] : null

  if (!file || !editor) {
    resetInput(target)
    return
  }

  uploadingKind.value = 'image'

  try {
    const path = await uploadCmsImage(file, props.imageUploadEndpoint)
    editor.chain().focus().setImage({
      src: path,
      alt: file.name
    }).run()
  } catch (error) {
    toast.add({
      title: 'Téléversement impossible',
      description: error instanceof Error ? error.message : 'Erreur inconnue.',
      color: 'error',
      icon: 'mingcute:close-circle-line'
    })
  } finally {
    uploadingKind.value = null
    resetInput(target)
  }
}

async function handleFileSelection(event: Event, editor: Editor | null) {
  const target = event.target
  const file = target instanceof HTMLInputElement ? target.files?.[0] : null

  if (!file || !editor) {
    resetInput(target)
    return
  }

  uploadingKind.value = 'file'

  try {
    const path = await uploadCmsFile(file, props.fileUploadEndpoint)
    const escapedPath = escapeHtml(path)
    const escapedName = escapeHtml(file.name)

    editor.chain().focus().insertContent(
      `<p><a href="${escapedPath}" target="_blank" rel="noopener noreferrer">${escapedName}</a></p>`
    ).run()
  } catch (error) {
    toast.add({
      title: 'Téléversement impossible',
      description: error instanceof Error ? error.message : 'Erreur inconnue.',
      color: 'error',
      icon: 'mingcute:close-circle-line'
    })
  } finally {
    uploadingKind.value = null
    resetInput(target)
  }
}

function emitFocus() {
  emit('focus')
}
</script>

<template>
  <div>
    <UEditor
      v-model="content"
      content-type="html"
      :placeholder="placeholder"
      :class="editorClass"
      :extensions="[ImageResize]"
      @focus="emitFocus"
    >
      <template #default="{ editor }">
        <div :class="toolbarClass">
          <div class="flex flex-wrap items-center gap-2">
            <UEditorToolbar
              :editor="editor"
              :items="cmsRichTextToolbarItems"
            />

            <div class="ml-auto flex items-center gap-1">
              <input
                ref="imageInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageSelection($event, editor)"
              >
              <input
                ref="fileInput"
                type="file"
                accept=".pdf,.doc,.docx,.odt,.ods,.odp,.xls,.xlsx,.csv,.txt,.rtf,.zip,.png,.jpg,.jpeg,.webp"
                class="hidden"
                @change="handleFileSelection($event, editor)"
              >

              <UButton
                icon="mingcute:pic-line"
                color="neutral"
                variant="ghost"
                size="sm"
                :loading="uploadingKind === 'image'"
                :disabled="uploadingKind !== null"
                title="Ajouter une image"
                aria-label="Ajouter une image"
                @click="openImagePicker"
              />
              <UButton
                icon="mingcute:attachment-2-line"
                color="neutral"
                variant="ghost"
                size="sm"
                :loading="uploadingKind === 'file'"
                :disabled="uploadingKind !== null"
                title="Ajouter un fichier"
                aria-label="Ajouter un fichier"
                @click="openFilePicker"
              />
            </div>
          </div>
        </div>
      </template>
    </UEditor>
  </div>
</template>
