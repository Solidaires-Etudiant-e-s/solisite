export interface CmsFeature {
  icon: string
  title: string
  description: string
}

export interface CmsHeroButton {
  label: string
  href: string
  icon: string
  variant: 'primary' | 'secondary'
}

export interface CmsPartner {
  name: string
  logo: string
  href: string
}

export interface CmsSocialLink {
  label: string
  href: string
  icon: string
}

export interface CmsSyndicatAddress {
  label: string
  address: string
  order: number
  latitude: number
  longitude: number
}

export interface CmsHomePageContent {
  heroButtons: CmsHeroButton[]
  featuresTitle: string
  features: CmsFeature[]
  articlesTitle: string
  partnersTitle: string
  partners: CmsPartner[]
  ctaTitle: string
  ctaDescription: string
  ctaLabel: string
  ctaHref: string
  ctaTrailingIcon: string
}

export interface CmsArticlesPageContent {
  emptyStateText: string
}

export interface CmsGuidesPageContent {
  emptyStateText: string
}

export interface CmsSyndicatsPageContent {
  searchPlaceholder: string
  emptyStateText: string
}

export interface CmsAboutPageContent {
  heroImage: string
  heroImageAlt: string
  networkTitle: string
  networkBody1: string
  networkBody2: string
  networkStatOneLabel: string
  networkStatOneDescription: string
  networkStatTwoLabel: string
  networkStatTwoDescription: string
  missionsTitle: string
  missionsIntro: string
  missions: CmsFeature[]
  functioningTitle: string
  functioningBody1: string
  functioningBody2: string
  functioningImage: string
  functioningImageAlt: string
  historyTitle: string
  historyBody1: string
  historyBody2: string
  historyImage: string
  historyImageAlt: string
  networkCtaLabel: string
  networkCtaHref: string
  functioningCtaLabel: string
  functioningCtaHref: string
}

export interface CmsInternationalPageContent {
  body: string
}

export interface CmsSyndicat {
  id: number
  slug: string
  name: string
  city: string
  email: string
  addresses: CmsSyndicatAddress[]
  socials: CmsSocialLink[]
  content: string
  updatedAt: string
}

export type CmsPageSlug = 'home' | 'articles' | 'guides' | 'syndicats' | 'a-propos' | 'international'
export type CmsPageContent = CmsHomePageContent | CmsArticlesPageContent | CmsGuidesPageContent | CmsSyndicatsPageContent | CmsAboutPageContent | CmsInternationalPageContent

export interface CmsPage {
  slug: string
  name: string
  title: string
  description: string
  headline: string
  subheadline: string
  ctaLabel: string
  ctaHref: string
  content: CmsPageContent
  updatedAt: string
}

export interface CmsArticle {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string
  publishedAt: string
  updatedAt: string
}

export interface CmsGuide {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string
  pdfFile: string
  publishedAt: string
  updatedAt: string
}

export interface CmsSiteSettings {
  unionName: string
  siteDescription: string
  contactEmail: string
  contactPhone: string
  address: string
  socials: CmsSocialLink[]
  updatedAt: string
}

export type CmsUserRole = 'admin' | 'syndicat'

export interface CmsAuthenticatedUser {
  name: string
  role: CmsUserRole
}

export const cmsRevisionEntityTypes = ['page', 'article', 'guide', 'syndicat', 'site-settings'] as const
export type CmsRevisionEntityType = typeof cmsRevisionEntityTypes[number]
export type CmsRevisionChangeType = 'save' | 'restore'

export interface CmsRevision {
  id: number
  entityType: CmsRevisionEntityType
  entityId: string
  revisionLabel: string
  changeType: CmsRevisionChangeType
  restoredFromRevisionId: number | null
  createdAt: string
  snapshot: CmsPage | CmsArticle | CmsGuide | CmsSyndicat | CmsSiteSettings
}

export interface CmsBootstrap {
  auth: {
    user: CmsAuthenticatedUser
    managedSyndicatId: number | null
  }
  pages: CmsPage[]
  articles: CmsArticle[]
  guides: CmsGuide[]
  syndicats: CmsSyndicat[]
  siteSettings: CmsSiteSettings
}

export function cloneCmsValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function createEmptySocialLink(icon = 'mingcute:link-line'): CmsSocialLink {
  return {
    label: '',
    href: '',
    icon
  }
}

export function createEmptyFeature(icon = 'mingcute:sparkles-line'): CmsFeature {
  return {
    icon,
    title: '',
    description: ''
  }
}

export function createEmptyHeroButton(): CmsHeroButton {
  return {
    label: '',
    href: '',
    icon: 'mingcute:arrow-right-line',
    variant: 'primary'
  }
}

export function createEmptyPartner(): CmsPartner {
  return {
    name: '',
    logo: '',
    href: ''
  }
}

export function createHomePageContent(): CmsHomePageContent {
  return {
    heroButtons: [],
    featuresTitle: '',
    features: [],
    articlesTitle: '',
    partnersTitle: '',
    partners: [],
    ctaTitle: '',
    ctaDescription: '',
    ctaLabel: '',
    ctaHref: '',
    ctaTrailingIcon: ''
  }
}

export function createArticlesPageContent(): CmsArticlesPageContent {
  return {
    emptyStateText: ''
  }
}

export function createGuidesPageContent(): CmsGuidesPageContent {
  return {
    emptyStateText: ''
  }
}

export function createSyndicatsPageContent(): CmsSyndicatsPageContent {
  return {
    searchPlaceholder: '',
    emptyStateText: ''
  }
}

export function createAboutPageContent(): CmsAboutPageContent {
  return {
    heroImage: '',
    heroImageAlt: '',
    networkTitle: '',
    networkBody1: '',
    networkBody2: '',
    networkStatOneLabel: '',
    networkStatOneDescription: '',
    networkStatTwoLabel: '',
    networkStatTwoDescription: '',
    missionsTitle: '',
    missionsIntro: '',
    missions: [],
    functioningTitle: '',
    functioningBody1: '',
    functioningBody2: '',
    functioningImage: '',
    functioningImageAlt: '',
    historyTitle: '',
    historyBody1: '',
    historyBody2: '',
    historyImage: '',
    historyImageAlt: '',
    networkCtaLabel: '',
    networkCtaHref: '',
    functioningCtaLabel: '',
    functioningCtaHref: ''
  }
}

export function createInternationalPageContent(): CmsInternationalPageContent {
  return {
    body: ''
  }
}

const cmsPageContentFactories = {
  'home': createHomePageContent,
  'articles': createArticlesPageContent,
  'guides': createGuidesPageContent,
  'syndicats': createSyndicatsPageContent,
  'a-propos': createAboutPageContent,
  'international': createInternationalPageContent
} satisfies Record<CmsPageSlug, () => CmsPageContent>

export function createPageContent(slug: string): CmsPageContent {
  return (cmsPageContentFactories[slug as CmsPageSlug] || createArticlesPageContent)()
}

export function createEmptyPage(): CmsPage {
  return {
    slug: '',
    name: '',
    title: '',
    description: '',
    headline: '',
    subheadline: '',
    ctaLabel: '',
    ctaHref: '',
    content: createPageContent('articles'),
    updatedAt: ''
  }
}

export function createEmptyArticle(): CmsArticle {
  return {
    id: 0,
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    coverImage: '/hero.jpg',
    publishedAt: '',
    updatedAt: ''
  }
}

export function createEmptyGuide(): CmsGuide {
  return {
    id: 0,
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    coverImage: '/hero.jpg',
    pdfFile: '',
    publishedAt: '',
    updatedAt: ''
  }
}

export function createEmptySyndicat(): CmsSyndicat {
  return {
    id: 0,
    slug: '',
    name: '',
    city: '',
    email: '',
    addresses: [],
    socials: [],
    content: '',
    updatedAt: ''
  }
}

export function createEmptySyndicatAddress(): CmsSyndicatAddress {
  return {
    label: '',
    address: '',
    order: 0,
    latitude: 0,
    longitude: 0
  }
}

export function normalizeSocialLinks(input: CmsSocialLink[] | undefined, current: CmsSocialLink[] = []) {
  const source = input ?? current

  return source
    .map(social => ({
      label: (social.label || '').trim(),
      href: (social.href || '').trim(),
      icon: (social.icon || '').trim()
    }))
    .filter(social => social.label || social.href || social.icon)
}

export function normalizeSyndicatAddresses(input: CmsSyndicatAddress[] | undefined, current: CmsSyndicatAddress[] = []) {
  const source = input ?? current

  return source
    .map((entry, index) => {
      const order = Number(entry.order)
      const latitude = Number(entry.latitude)
      const longitude = Number(entry.longitude)

      return {
        label: (entry.label || '').trim(),
        address: (entry.address || '').trim(),
        order: Number.isFinite(order) ? order : index,
        latitude: Number.isFinite(latitude) ? latitude : 0,
        longitude: Number.isFinite(longitude) ? longitude : 0
      }
    })
    .filter(entry => entry.label || entry.address || entry.latitude || entry.longitude)
    .sort((left, right) => left.order - right.order)
    .map((entry, index) => ({
      ...entry,
      order: index
    }))
}

export function getPrimarySyndicatAddress(addresses: CmsSyndicatAddress[] = []) {
  return addresses.find(entry => entry.address.trim()) || null
}

export function isValidSyndicatAddress(address: CmsSyndicatAddress) {
  return Boolean(
    address.label.trim()
    && address.address.trim()
    && Number.isFinite(address.latitude)
    && Number.isFinite(address.longitude)
    && (address.latitude || address.longitude)
  )
}

export function resolveSyndicatAddresses(syndicat: Pick<CmsSyndicat, 'addresses'>) {
  return normalizeSyndicatAddresses(syndicat.addresses)
}

export function hasInvalidSyndicatAddresses(addresses: CmsSyndicatAddress[] = []) {
  return addresses.some(address => !isValidSyndicatAddress(address))
}

export function normalizeSyndicatName(value: string) {
  return value
    .replace(/^Solidaires étudiant-e-s\s+/i, '')
    .replace(/^Solidaires etudiant-e-s\s+/i, '')
    .trim()
}

export function formatSyndicatDisplayName(name: string, unionName?: string) {
  const localName = normalizeSyndicatName(name)
  const globalName = (unionName || '').trim()

  if (!globalName) {
    return localName
  }

  if (!localName) {
    return globalName
  }

  const normalizedLocal = localName.toLocaleLowerCase('fr')
  const normalizedGlobal = globalName.toLocaleLowerCase('fr')

  if (normalizedLocal.startsWith(normalizedGlobal)) {
    return localName
  }

  return `${globalName} ${localName}`.trim()
}

export function createEmptySiteSettings(): CmsSiteSettings {
  return {
    unionName: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    socials: [],
    updatedAt: ''
  }
}

export function createDefaultSiteSettings(): CmsSiteSettings {
  return {
    unionName: 'Solidaires Étudiant·es',
    siteDescription: 'Syndicats de luttes, militant pour une université gratuite, ouverte à tous·tes, de qualité, émancipatrice et autogérée.',
    contactEmail: 'contact@solidaires-etudiant-e-s.org',
    contactPhone: '+33686802445',
    address: '',
    socials: [
      {
        ...createEmptySocialLink('mingcute:bluesky-social-line'),
        label: 'Bluesky',
        href: 'https://bsky.app/profile/solidaires-etudiant-e-s.org'
      },
      {
        ...createEmptySocialLink('mingcute:facebook-line'),
        label: 'Facebook',
        href: 'https://www.facebook.com/solidairesetudiantes'
      },
      {
        ...createEmptySocialLink('mingcute:instagram-line'),
        label: 'Instagram',
        href: 'https://www.instagram.com/solidairesetu'
      },
      {
        ...createEmptySocialLink('mingcute:mastodon-line'),
        label: 'Mastodon',
        href: 'https://mastodon.social/@solidairesetu'
      },
      {
        ...createEmptySocialLink('mingcute:social-x-line'),
        label: 'X',
        href: 'https://x.com/SolidairesEtu'
      }
    ],
    updatedAt: ''
  }
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
