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

export async function uploadCmsAsset(
  file: File | null | undefined,
  uploadEndpoint: string,
  options?: { onProgress?: (progress: number) => void }
) {
  if (!file) {
    throw new Error('Missing file.')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await new Promise<Response>((resolve, reject) => {
    const request = new XMLHttpRequest()

    request.open('POST', uploadEndpoint)
    request.responseType = 'json'

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return
      }

      options?.onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)))
    }

    request.onload = () => {
      const headers = new Headers(
        request
          .getAllResponseHeaders()
          .trim()
          .split(/[\r\n]+/)
          .filter(Boolean)
          .map((line) => {
            const separatorIndex = line.indexOf(':')
            const key = separatorIndex >= 0 ? line.slice(0, separatorIndex).trim() : line.trim()
            const value = separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : ''
            return [key, value] as [string, string]
          })
      )

      const body = request.response ?? request.responseText ?? null

      resolve(new Response(body ? JSON.stringify(body) : null, {
        status: request.status,
        statusText: request.statusText,
        headers
      }))
    }

    request.onerror = () => reject(new Error('Upload failed.'))
    request.onabort = () => reject(new Error('Upload aborted.'))
    request.send(formData)
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

export async function uploadCmsImage(
  file: File | null | undefined,
  uploadEndpoint: string,
  options?: { onProgress?: (progress: number) => void }
) {
  return await uploadCmsAsset(file, uploadEndpoint, options)
}

export async function uploadCmsFile(
  file: File | null | undefined,
  uploadEndpoint: string,
  options?: { onProgress?: (progress: number) => void }
) {
  return await uploadCmsAsset(file, uploadEndpoint, options)
}
