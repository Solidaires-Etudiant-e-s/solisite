import type {
  Article as PrismaArticle,
  ArticleTag as PrismaArticleTag,
  CmsRevisionRecord as PrismaCmsRevisionRecord,
  Guide as PrismaGuide,
  Page as PrismaPage,
  SiteSettings as PrismaSiteSettings,
  Syndicat as PrismaSyndicat,
  Tag as PrismaTag
} from '@prisma/client'

export type PageRecord = PrismaPage
export type ArticleRecord = PrismaArticle
export type ArticleTagRecord = PrismaArticleTag
export type GuideRecord = PrismaGuide
export type TagRecord = PrismaTag
export type SiteSettingsRecord = PrismaSiteSettings
export type RevisionRecord = PrismaCmsRevisionRecord
