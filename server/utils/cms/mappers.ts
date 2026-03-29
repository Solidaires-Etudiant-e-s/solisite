import type { CmsArticle, CmsGuide, CmsPage, CmsSiteSettings, CmsSocialLink, CmsSyndicat } from '~~/lib/cms'
import type { ArticleRecord, GuideRecord, PageRecord, SiteSettingsRecord, SyndicatRecord } from './types'
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
    ctaLabel: record.ctaLabel,
    ctaHref: record.ctaHref,
    content: parsePageContent(record.slug, record.contentJson),
    updatedAt: record.updatedAt
  }
}

export function toArticle(record: ArticleRecord): CmsArticle {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    content: record.content,
    coverImage: record.coverImage,
    publishedAt: record.publishedAt,
    updatedAt: record.updatedAt
  }
}

export function toGuide(record: GuideRecord): CmsGuide {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    content: record.content,
    coverImage: record.coverImage,
    pdfFile: record.pdfFile,
    publishedAt: record.publishedAt,
    updatedAt: record.updatedAt
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
    socials: parseSocials(record.socialsJson),
    content: record.content,
    latitude: record.latitude,
    longitude: record.longitude,
    updatedAt: record.updatedAt
  }
}

export function toSiteSettings(record: SiteSettingsRecord): CmsSiteSettings {
  return {
    unionName: record.unionName,
    siteDescription: record.siteDescription,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone,
    address: record.address,
    socials: parseSocials(record.socialsJson),
    updatedAt: record.updatedAt
  }
}
