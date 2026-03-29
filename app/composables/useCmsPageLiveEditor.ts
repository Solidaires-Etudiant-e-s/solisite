import type { Ref } from 'vue'
import { createEmptyFeature, createEmptyHeroButton, createEmptyPartner, createEmptySocialLink, createEmptySyndicatAddress } from '~~/lib/cms'

export type CmsEditableKind = 'text' | 'textarea' | 'html' | 'link' | 'list-item' | 'list' | 'fields'
export type CmsEditableFieldKind = 'text' | 'textarea' | 'icon' | 'image' | 'file' | 'select' | 'datetime' | 'address-autocomplete'
export type CmsEditableItemType = 'feature' | 'partner' | 'hero-button' | 'social' | 'address'

export interface CmsEditableFieldOption {
  label: string
  value: string
}

export interface CmsEditableFieldSchema {
  key: string
  label: string
  kind: CmsEditableFieldKind
  rows?: number
  uploadEndpoint?: string
  options?: CmsEditableFieldOption[]
}

export interface CmsEditableTarget {
  id: string
  kind: CmsEditableKind
  path: string
  label: string
  itemType?: CmsEditableItemType
  fields?: CmsEditableFieldSchema[]
  index?: number
  listPath?: string
}

interface CmsPageLiveEditor<T extends object = Record<string, unknown>> {
  enabled: true
  page: T
  selectedTarget: Ref<CmsEditableTarget | null>
  openTarget: (target: CmsEditableTarget) => void
  closeTarget: () => void
  updateField: (path: string, value: unknown) => void
  insertItem: (path: string, itemType: CmsEditableItemType, index?: number) => number | null
  removeItem: (path: string, index: number) => void
  moveItem: (path: string, from: number, to: number) => void
  createItem: (itemType: CmsEditableItemType) => Record<string, unknown>
}

const cmsPageLiveEditorKey = Symbol('cms-page-live-editor')

function readSegment(current: unknown, segment: string) {
  if (!current || typeof current !== 'object') {
    return undefined
  }

  return (current as Record<string, unknown>)[segment]
}

function parsePath(path: string) {
  return path.match(/[^.[\]]+/g) || []
}

function asRecord(value: unknown) {
  return value as Record<string, unknown>
}

export function readPathValue(root: unknown, path: string) {
  return parsePath(path).reduce<unknown>((current, segment) => readSegment(current, segment), root)
}

function getParentAtPath(root: Record<string, unknown>, path: string) {
  const segments = parsePath(path)
  const key = segments.pop()

  if (!key) {
    return null
  }

  const parent = segments.reduce<unknown>((current, segment) => readSegment(current, segment), root)

  return {
    parent,
    key
  }
}

function createItem(itemType: CmsEditableItemType) {
  if (itemType === 'social') {
    return { ...createEmptySocialLink() }
  }

  if (itemType === 'feature') {
    return { ...createEmptyFeature() }
  }

  if (itemType === 'partner') {
    return { ...createEmptyPartner() }
  }

  if (itemType === 'address') {
    return { ...createEmptySyndicatAddress() }
  }

  return { ...createEmptyHeroButton() }
}

export function provideCmsPageLiveEditor<T extends object>(page: T) {
  const selectedTarget = ref<CmsEditableTarget | null>(null)
  const pageRecord = asRecord(page)

  function openTarget(target: CmsEditableTarget) {
    selectedTarget.value = target
  }

  function closeTarget() {
    selectedTarget.value = null
  }

  function updateField(path: string, value: unknown) {
    const target = getParentAtPath(pageRecord, path)

    if (!target?.parent || typeof target.parent !== 'object') {
      return
    }

    asRecord(target.parent)[target.key] = value
  }

  function insertItem(path: string, itemType: CmsEditableItemType, index?: number) {
    const items = readPathValue(pageRecord, path)

    if (!Array.isArray(items)) {
      return null
    }

    const nextItem = createItem(itemType)
    const insertionIndex = typeof index === 'number' ? index : items.length
    items.splice(insertionIndex, 0, nextItem)
    return insertionIndex
  }

  function removeItem(path: string, index: number) {
    const items = readPathValue(pageRecord, path)

    if (!Array.isArray(items) || index < 0 || index >= items.length) {
      return
    }

    items.splice(index, 1)
    closeTarget()
  }

  function moveItem(path: string, from: number, to: number) {
    const items = readPathValue(pageRecord, path)

    if (!Array.isArray(items) || from < 0 || from >= items.length || to < 0 || to >= items.length) {
      return
    }

    const [item] = items.splice(from, 1)
    items.splice(to, 0, item)

    if (selectedTarget.value?.path === `${path}[${from}]`) {
      selectedTarget.value = {
        ...selectedTarget.value,
        path: `${path}[${to}]`,
        index: to
      }
    }
  }

  const editor: CmsPageLiveEditor<T> = {
    enabled: true,
    page,
    selectedTarget,
    openTarget,
    closeTarget,
    updateField,
    insertItem,
    removeItem,
    moveItem,
    createItem
  }

  provide(cmsPageLiveEditorKey, editor)

  return editor
}

export function useCmsPageLiveEditor() {
  return inject<CmsPageLiveEditor | null>(cmsPageLiveEditorKey, null)
}
