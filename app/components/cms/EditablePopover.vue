<script setup lang="ts">
import { uploadCmsImage } from '~/utils/cmsUi'

const props = defineProps<{
  target: CmsEditableTarget
}>()

const editor = useCmsPageLiveEditor()
const uploadFiles = ref<Record<string, File | null>>({})
const uploadProgress = ref<Record<string, number>>({})
const uploadingField = ref('')
const uploadError = ref('')

function fieldPath(key: string) {
  if (props.target.kind === 'list-item' || props.target.kind === 'link' || props.target.kind === 'fields') {
    return props.target.path ? `${props.target.path}.${key}` : key
  }

  return props.target.path
}

function fieldValue(key?: string) {
  if (!editor) {
    return ''
  }

  const path = key ? fieldPath(key) : props.target.path
  return readPathValue(editor.page, path) ?? ''
}

function updateValue(value: unknown, key?: string) {
  if (!editor) {
    return
  }

  editor.updateField(key ? fieldPath(key) : props.target.path, value)
}

function updateAddressSelection(value: { address: string, latitude: number, longitude: number }) {
  updateValue(value.address, 'address')
  updateValue(value.latitude, 'latitude')
  updateValue(value.longitude, 'longitude')
}

function toDateTimeInputValue(value: unknown) {
  const source = String(value || '')

  if (!source) {
    return ''
  }

  const date = new Date(source)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 16)
}

function updateDateTimeValue(value: string, key: string) {
  updateValue(value ? new Date(value).toISOString() : '', key)
}

async function uploadAsset(file: File | null | undefined, key: string, uploadEndpoint?: string) {
  if (!file || !editor || !uploadEndpoint) {
    return
  }

  uploadingField.value = key
  uploadError.value = ''
  uploadProgress.value[key] = 0

  try {
    editor.updateField(fieldPath(key), await uploadCmsImage(file, uploadEndpoint, {
      onProgress: progress => uploadProgress.value[key] = progress
    }))
    uploadProgress.value[key] = 100
  } catch {
    uploadError.value = 'Échec de l’envoi.'
  } finally {
    uploadingField.value = ''
    const { [key]: _removedProgress, ...remainingProgress } = uploadProgress.value
    uploadProgress.value = remainingProgress
    uploadFiles.value[key] = null
  }
}

function removeItem() {
  if (!editor || props.target.kind !== 'list-item' || props.target.index === undefined || !props.target.listPath) {
    return
  }

  editor.removeItem(props.target.listPath, props.target.index)
}
</script>

<template>
  <div class="w-[min(36rem,calc(100vw-2rem))] space-y-4 p-4">
    <div>
      <h3 class="text-sm font-semibold text-highlighted">
        {{ target.label }}
      </h3>
    </div>

    <template v-if="target.kind === 'text' || target.kind === 'textarea'">
      <UTextarea
        v-if="target.kind === 'textarea'"
        class="w-full"
        :model-value="String(fieldValue())"
        :rows="4"
        @update:model-value="updateValue(String($event || ''))"
      />
      <UInput
        v-else
        class="w-full"
        :model-value="String(fieldValue())"
        @update:model-value="updateValue(String($event || ''))"
      />
    </template>

    <template v-else>
      <div class="space-y-4">
        <UFormField
          v-for="field in target.fields || []"
          :key="field.key"
          :label="field.label"
        >
          <UTextarea
            v-if="field.kind === 'textarea'"
            class="w-full"
            :model-value="String(fieldValue(field.key))"
            :rows="field.rows || 3"
            @update:model-value="updateValue(String($event || ''), field.key)"
          />

          <CmsIconPicker
            v-else-if="field.kind === 'icon'"
            :model-value="String(fieldValue(field.key))"
            :label="field.label"
            @update:model-value="updateValue($event, field.key)"
          />

          <div
            v-else-if="field.kind === 'image' || field.kind === 'file'"
            class="space-y-3"
          >
            <UFileUpload
              v-model="uploadFiles[field.key]"
              :accept="field.kind === 'image' ? 'image/*' : '.pdf,application/pdf'"
              :label="field.kind === 'image' ? 'Téléverser une image' : 'Téléverser un PDF'"
              :description="field.kind === 'image' ? 'SVG, PNG, JPG, WebP ou GIF' : 'Document PDF'"
              :disabled="uploadingField === field.key"
              @update:model-value="uploadAsset($event, field.key, field.uploadEndpoint)"
            />

            <div
              v-if="uploadingField === field.key"
              class="space-y-2"
            >
              <div class="flex items-center justify-between text-xs text-muted">
                <span>Téléversement en cours…</span>
                <span>{{ uploadProgress[field.key] || 0 }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-accented">
                <div
                  class="h-full rounded-full bg-primary transition-[width] duration-200"
                  :style="{ width: `${uploadProgress[field.key] || 0}%` }"
                />
              </div>
            </div>
          </div>

          <USelect
            v-else-if="field.kind === 'select'"
            class="w-full"
            :model-value="String(fieldValue(field.key))"
            :items="field.options || []"
            @update:model-value="updateValue(String($event || ''), field.key)"
          />

          <UInput
            v-else-if="field.kind === 'datetime'"
            class="w-full"
            type="datetime-local"
            :model-value="toDateTimeInputValue(fieldValue(field.key))"
            @update:model-value="updateDateTimeValue(String($event || ''), field.key)"
          />

          <CmsAddressAutocompleteField
            v-else-if="field.kind === 'address-autocomplete'"
            :model-value="String(fieldValue(field.key))"
            @select="updateAddressSelection($event)"
          />

          <UInput
            v-else
            class="w-full"
            :model-value="String(fieldValue(field.key))"
            @update:model-value="updateValue(String($event || ''), field.key)"
          />
        </UFormField>

        <p
          v-if="uploadError"
          class="text-sm text-error"
        >
          {{ uploadError }}
        </p>

        <div
          v-if="target.kind === 'list-item'"
          class="flex items-center gap-2"
        >
          <span class="text-xs text-dimmed">
            Fais glisser sur la page pour réorganiser.
          </span>
          <UButton
            label="Supprimer"
            color="error"
            variant="soft"
            class="ms-auto"
            @click="removeItem"
          />
        </div>
      </div>
    </template>
  </div>
</template>
