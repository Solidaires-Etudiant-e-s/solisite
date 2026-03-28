import { useHead } from '#imports'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

const DEFAULT_SITE_URL = 'https://solidaires-etudiant-e-s.org'
const DEFAULT_OG_IMAGE = '/hero.jpg'

function normalizeTextWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function stripHtml(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  return normalizeTextWhitespace(
    value
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, '\'')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
  )
}

export function truncateText(value: string | null | undefined, maxLength = 160) {
  const normalized = normalizeTextWhitespace(value || '')

  if (!normalized || normalized.length <= maxLength) {
    return normalized
  }

  const truncated = normalized.slice(0, maxLength + 1)
  const lastSpace = truncated.lastIndexOf(' ')
  const safeCutoff = lastSpace > Math.floor(maxLength * 0.6) ? lastSpace : maxLength

  return `${truncated.slice(0, safeCutoff).trimEnd()}…`
}

export function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeTextWhitespace(value || '')

    if (normalized) {
      return normalized
    }
  }

  return ''
}

export function resolveSiteUrl(siteUrl?: string | null) {
  const normalized = normalizeTextWhitespace(siteUrl || '')

  return normalized ? normalized.replace(/\/+$/, '') : DEFAULT_SITE_URL
}

export function toAbsoluteUrl(path: string | null | undefined, siteUrl?: string | null) {
  const resolvedSiteUrl = resolveSiteUrl(siteUrl)
  const normalizedPath = normalizeTextWhitespace(path || '')

  if (!normalizedPath) {
    return `${resolvedSiteUrl}/`
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath
  }

  const withLeadingSlash = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`

  return `${resolvedSiteUrl}${withLeadingSlash}`
}

export function buildCanonicalUrl(pathWithQuery: string | null | undefined, siteUrl?: string | null) {
  return toAbsoluteUrl(pathWithQuery || '/', siteUrl)
}

export function resolveSeoImage(
  options: {
    image?: string | null
    fallbackImage?: string | null
    siteUrl?: string | null
  }
) {
  const selectedImage = firstNonEmpty(options.image, options.fallbackImage, DEFAULT_OG_IMAGE)

  return toAbsoluteUrl(selectedImage, options.siteUrl)
}

export function buildSeoTitle(pageTitle: string | null | undefined, siteName: string | null | undefined) {
  const cleanPageTitle = firstNonEmpty(pageTitle)
  const cleanSiteName = firstNonEmpty(siteName)

  if (!cleanPageTitle) {
    return cleanSiteName
  }

  if (!cleanSiteName) {
    return cleanPageTitle
  }

  return cleanPageTitle.toLocaleLowerCase('fr') === cleanSiteName.toLocaleLowerCase('fr')
    ? cleanPageTitle
    : `${cleanPageTitle} | ${cleanSiteName}`
}

export function useCanonicalHead(path: MaybeRefOrGetter<string>, siteUrl: MaybeRefOrGetter<string>) {
  const canonical = computed(() => buildCanonicalUrl(toValue(path), toValue(siteUrl)))

  useHead({
    link: [{
      rel: 'canonical',
      href: canonical
    }]
  })

  return canonical
}
