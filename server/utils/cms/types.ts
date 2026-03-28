export interface PageRecord {
  slug: string
  name: string
  title: string
  description: string
  headline: string
  subheadline: string
  cta_label: string
  cta_href: string
  content_json: string
  updated_at: string
}

export interface ArticleRecord {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  cover_image: string
  published_at: string
  updated_at: string
}

export interface SyndicatRecord {
  id: number
  slug: string
  name: string
  city: string
  email: string
  address: string
  socials_json: string
  content: string
  latitude: number
  longitude: number
  updated_at: string
}

export interface SiteSettingsRecord {
  id: number
  union_name: string
  site_description: string
  contact_email: string
  contact_phone: string
  address: string
  socials_json: string
  updated_at: string
}

export interface RevisionRecord {
  id: number
  entity_type: 'page' | 'article' | 'syndicat' | 'site-settings'
  entity_id: string
  snapshot_json: string
  revision_label: string
  change_type: 'save' | 'restore'
  restored_from_revision_id: number | null
  created_at: string
}
