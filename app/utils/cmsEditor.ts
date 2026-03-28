import type { CmsEditableFieldSchema, CmsEditableTarget } from '~/composables/useCmsPageLiveEditor'

const targetFields = {
  'social': [{
    key: 'label',
    label: 'Nom',
    kind: 'text'
  }, {
    key: 'href',
    label: 'Lien',
    kind: 'text'
  }, {
    key: 'icon',
    label: 'Icône',
    kind: 'icon'
  }],
  'feature': [{
    key: 'icon',
    label: 'Icône',
    kind: 'icon'
  }, {
    key: 'title',
    label: 'Titre',
    kind: 'text'
  }, {
    key: 'description',
    label: 'Description',
    kind: 'textarea',
    rows: 4
  }],
  'hero-button': [{
    key: 'label',
    label: 'Libellé',
    kind: 'text'
  }, {
    key: 'href',
    label: 'Lien',
    kind: 'text'
  }, {
    key: 'icon',
    label: 'Icône',
    kind: 'icon'
  }, {
    key: 'variant',
    label: 'Variante',
    kind: 'select',
    options: [{ label: 'Principale', value: 'primary' }, { label: 'Secondaire', value: 'secondary' }]
  }],
  'partner': [{
    key: 'name',
    label: 'Nom',
    kind: 'text'
  }, {
    key: 'logo',
    label: 'Logo',
    kind: 'image',
    uploadEndpoint: '/api/cms/uploads/partner-logo'
  }, {
    key: 'href',
    label: 'Lien',
    kind: 'text'
  }]
} satisfies Record<'social' | 'feature' | 'hero-button' | 'partner', CmsEditableFieldSchema[]>

export function createEditableTarget(id: string, path: string, label: string, multiline = false): CmsEditableTarget {
  return {
    id,
    kind: multiline ? 'textarea' : 'text',
    path,
    label
  }
}

export function createListItemTarget(
  pageSlug: string,
  itemType: 'social' | 'feature' | 'hero-button' | 'partner',
  index: number,
  listPath: string,
  label: string
): CmsEditableTarget {
  return {
    id: `${pageSlug}:${itemType}:${index}`,
    kind: 'list-item',
    path: `${listPath}[${index}]`,
    label: `${label} ${index + 1}`,
    itemType,
    index,
    listPath,
    fields: targetFields[itemType]
  }
}

export function createListTarget(pageSlug: string, itemType: 'social' | 'feature' | 'hero-button' | 'partner', path: string, label: string): CmsEditableTarget {
  return {
    id: `${pageSlug}:${path}`,
    kind: 'list',
    path,
    label,
    itemType
  }
}

export function createHtmlTarget(id: string, path: string, label: string): CmsEditableTarget {
  return {
    id,
    kind: 'html',
    path,
    label
  }
}

export function createFieldTarget(id: string, path: string, label: string, fields: CmsEditableFieldSchema[]): CmsEditableTarget {
  return {
    id,
    kind: 'fields',
    path,
    label,
    fields
  }
}

export function createCtaTarget(pageSlug: string): CmsEditableTarget {
  return {
    id: `${pageSlug}:cta-button`,
    kind: 'link',
    path: 'content',
    label: 'Bouton d’appel à l’action',
    fields: [{
      key: 'ctaLabel',
      label: 'Libellé',
      kind: 'text'
    }, {
      key: 'ctaHref',
      label: 'Lien',
      kind: 'text'
    }, {
      key: 'ctaTrailingIcon',
      label: 'Icône',
      kind: 'icon'
    }]
  }
}
