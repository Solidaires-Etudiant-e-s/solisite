import type { EditorToolbarItem } from '@nuxt/ui'

export const cmsRichTextToolbarItems: EditorToolbarItem[][] = [[
  {
    label: 'Paragraphe',
    icon: 'mingcute:paragraph-line',
    items: [{
      label: 'Paragraphe',
      icon: 'mingcute:paragraph-line',
      kind: 'paragraph'
    }, {
      label: 'Titre 1',
      icon: 'mingcute:heading-1-line',
      kind: 'heading',
      level: 1
    }, {
      label: 'Titre 2',
      icon: 'mingcute:heading-2-line',
      kind: 'heading',
      level: 2
    }, {
      label: 'Titre 3',
      icon: 'mingcute:heading-3-line',
      kind: 'heading',
      level: 3
    }]
  },
  {
    icon: 'mingcute:bold-line',
    kind: 'mark',
    mark: 'bold',
    tooltip: { text: 'Gras' }
  },
  {
    icon: 'mingcute:italic-line',
    kind: 'mark',
    mark: 'italic',
    tooltip: { text: 'Italique' }
  },
  {
    icon: 'mingcute:underline-line',
    kind: 'mark',
    mark: 'underline',
    tooltip: { text: 'Souligner' }
  },
  {
    icon: 'mingcute:strikethrough-line',
    kind: 'mark',
    mark: 'strike',
    tooltip: { text: 'Barré' }
  },
  {
    icon: 'mingcute:link-line',
    kind: 'link',
    tooltip: { text: 'Lien' }
  }
], [
  {
    icon: 'mingcute:list-check-line',
    kind: 'bulletList',
    tooltip: { text: 'Liste à puces' }
  },
  {
    icon: 'mingcute:list-ordered-line',
    kind: 'orderedList',
    tooltip: { text: 'Liste numérotée' }
  },
  {
    icon: 'mingcute:blockquote-line',
    kind: 'blockquote',
    tooltip: { text: 'Citation' }
  },
  {
    icon: 'mingcute:code-line',
    kind: 'codeBlock',
    tooltip: { text: 'Bloc de code' }
  }
], [
  {
    icon: 'mingcute:anticlockwise-line',
    kind: 'undo',
    tooltip: { text: 'Annuler' }
  },
  {
    icon: 'mingcute:clockwise-line',
    kind: 'redo',
    tooltip: { text: 'Rétablir' }
  }
]]

export function createStableItemKeyResolver() {
  const itemKeys = new WeakMap<object, string>()
  let nextItemKey = 0

  return (item: unknown, prefix: string, index: number) => {
    if (!item || typeof item !== 'object') {
      return `${prefix}-${index}`
    }

    const current = item as object

    if (!itemKeys.has(current)) {
      itemKeys.set(current, `${prefix}-${nextItemKey++}`)
    }

    return itemKeys.get(current) || `${prefix}-${index}`
  }
}

export function formatFrenchDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long'
  }).format(new Date(value))
}

export function formatFrenchDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function isExternalHref(href: string) {
  return /^https?:\/\//.test(href)
}

export function toLinkTarget(href: string) {
  return isExternalHref(href) ? '_blank' : undefined
}

export function toLinkTo(href: string) {
  return href.startsWith('/') ? href : undefined
}

export function toLinkHref(href: string) {
  return href.startsWith('/') ? undefined : href
}

export async function uploadCmsAsset(file: File | null | undefined, uploadEndpoint: string) {
  if (!file) {
    throw new Error('Missing file.')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error('Upload failed.')
  }

  const payload = await response.json() as { path?: string }

  if (!payload.path) {
    throw new Error('Upload response is missing a path.')
  }

  return payload.path
}

export async function uploadCmsImage(file: File | null | undefined, uploadEndpoint: string) {
  return await uploadCmsAsset(file, uploadEndpoint)
}

export async function uploadCmsFile(file: File | null | undefined, uploadEndpoint: string) {
  return await uploadCmsAsset(file, uploadEndpoint)
}
