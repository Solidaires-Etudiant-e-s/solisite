import { normalizeSyndicatAddresses, type CmsArticle, type CmsGuide, type CmsPage, type CmsSiteSettings, type CmsSocialLink, type CmsSyndicat, type CmsSyndicatAddress, type CmsTag } from '~~/lib/cms'
import type { ArticleRecord, ArticleTagRecord, GuideRecord, PageRecord, SiteSettingsRecord, SyndicatRecord, TagRecord } from './types'
import { parsePageContent } from './content'

function parseSocials(raw: string | null | undefined, fallback: Array<Partial<CmsSocialLink>> = []) {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown
    const socials = Array.isArray(parsed)
      ? parsed
          .filter((item): item is Partial<CmsSocialLink> => Boolean(item && typeof item === 'object'))
          .map(item => ({
            label: typeof item.label === 'string' ? item.label : '',
            href: typeof item.href === 'string' ? item.href : '',
            icon: typeof item.icon === 'string' ? item.icon : ''
          }))
      : []

    if (socials.length) {
      return socials
    }
  } catch {
    // ignore parse errors
  }

  return fallback
    .map(item => ({
      label: typeof item.label === 'string' ? item.label : '',
      href: typeof item.href === 'string' ? item.href : '',
      icon: typeof item.icon === 'string' ? item.icon : ''
    }))
    .filter(item => item.label || item.href || item.icon)
}

function parseSyndicatAddresses(raw: string | null | undefined) {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown

    if (Array.isArray(parsed)) {
      return normalizeSyndicatAddresses(parsed as CmsSyndicatAddress[])
    }
  } catch {
    // ignore parse errors
  }

  return []
}

function toTag(record: TagRecord): CmsTag {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug
  }
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

export function toArticle(record: ArticleRecord, tags?: TagRecord[]): CmsArticle {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    content: record.content,
    coverImage: record.coverImage,
    publishedAt: record.publishedAt,
    updatedAt: record.updatedAt,
    tags: (tags ?? []).map(toTag)
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
    archived: record.archived,
    publishedAt: record.publishedAt,
    updatedAt: record.updatedAt
  }
}

export function toSyndicat(record: SyndicatRecord): CmsSyndicat {
  const addresses = parseSyndicatAddresses(record.addressesJson)

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    city: record.city,
    email: record.email,
    addresses,
    socials: parseSocials(record.socialsJson),
    content: record.content,
    enabled: record.enabled,
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
