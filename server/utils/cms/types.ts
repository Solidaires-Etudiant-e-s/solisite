import type {
  Article as PrismaArticle,
  CmsRevisionRecord as PrismaCmsRevisionRecord,
  Guide as PrismaGuide,
  Page as PrismaPage,
  SiteSettings as PrismaSiteSettings,
  Syndicat as PrismaSyndicat
} from '@prisma/client'

export type PageRecord = PrismaPage
export type ArticleRecord = PrismaArticle
export type GuideRecord = PrismaGuide
export type SyndicatRecord = PrismaSyndicat
export type SiteSettingsRecord = PrismaSiteSettings
export type RevisionRecord = PrismaCmsRevisionRecord
