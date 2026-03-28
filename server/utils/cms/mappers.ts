import type { CmsArticle, CmsPage, CmsSiteSettings, CmsSocialLink, CmsSyndicat } from '~~/lib/cms'
import type { ArticleRecord, PageRecord, SiteSettingsRecord, SyndicatRecord } from './types'
import { parsePageContent } from './content'

function parseSocials(raw: string | null | undefined, fallback: Array<Partial<CmsSocialLink>> = []) {
  let socials: CmsSocialLink[] = []

  try {
    const parsed = JSON.parse(raw || '[]') as unknown
    socials = Array.isArray(parsed)
      ? parsed
          .filter((item): item is Partial<CmsSocialLink> => Boolean(item && typeof item === 'object'))
          .map(item => ({
            label: typeof item.label === 'string' ? item.label : '',
            href: typeof item.href === 'string' ? item.href : '',
            icon: typeof item.icon === 'string' ? item.icon : ''
          }))
      : []
  } catch {
    socials = []
  }

  if (socials.length) {
    return socials
  }

  return fallback
    .map(item => ({
      label: typeof item.label === 'string' ? item.label : '',
      href: typeof item.href === 'string' ? item.href : '',
      icon: typeof item.icon === 'string' ? item.icon : ''
    }))
    .filter(item => item.label || item.href || item.icon)
}

export function toPage(record: PageRecord): CmsPage {
  return {
    slug: record.slug,
    name: record.name,
    title: record.title,
    description: record.description,
    headline: record.headline,
    subheadline: record.subheadline,
    ctaLabel: record.cta_label,
    ctaHref: record.cta_href,
    content: parsePageContent(record.slug, record.content_json),
    updatedAt: record.updated_at
  }
}

export function toArticle(record: ArticleRecord): CmsArticle {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    content: record.content,
    coverImage: record.cover_image,
    publishedAt: record.published_at,
    updatedAt: record.updated_at
  }
}

export function toSyndicat(record: SyndicatRecord): CmsSyndicat {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    city: record.city,
    email: record.email,
    address: record.address,
    socials: parseSocials(record.socials_json),
    content: record.content,
    latitude: record.latitude,
    longitude: record.longitude,
    updatedAt: record.updated_at
  }
}

export function toSiteSettings(record: SiteSettingsRecord): CmsSiteSettings {
  return {
    unionName: record.union_name,
    siteDescription: record.site_description,
    contactEmail: record.contact_email,
    contactPhone: record.contact_phone,
    address: record.address,
    socials: parseSocials(record.socials_json),
    updatedAt: record.updated_at
  }
}
