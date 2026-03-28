import { PrismaClient, type Prisma } from '@prisma/client'
import { createDefaultSiteSettings } from '~~/lib/cms'
import { defaultPages } from './content'
import { defaultArticle, nowIso, slugify } from './shared'

type CmsDatabaseClient = PrismaClient | Prisma.TransactionClient

const globalForCmsDatabase = globalThis as typeof globalThis & {
  __solisitePrisma?: PrismaClient
  __solisitePrismaInit?: Promise<PrismaClient>
}

function resolveDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() || 'file:./data/cms.sqlite'
}

function createDatabaseClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl()
      }
    }
  })
}

const prisma = globalForCmsDatabase.__solisitePrisma ?? createDatabaseClient()

if (!globalForCmsDatabase.__solisitePrisma) {
  globalForCmsDatabase.__solisitePrisma = prisma
}

async function seedPages(database: CmsDatabaseClient) {
  for (const page of defaultPages) {
    await database.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        slug: page.slug,
        name: page.name,
        title: page.title,
        description: page.description,
        headline: page.headline,
        subheadline: page.subheadline,
        ctaLabel: page.ctaLabel,
        ctaHref: page.ctaHref,
        contentJson: JSON.stringify(page.content),
        updatedAt: nowIso()
      }
    })
  }
}

async function seedArticles(database: CmsDatabaseClient) {
  const articleCount = await database.article.count()

  if (articleCount) {
    return
  }

  const timestamp = nowIso()

  await database.article.create({
    data: {
      slug: slugify(defaultArticle.title),
      title: defaultArticle.title,
      excerpt: defaultArticle.excerpt,
      content: defaultArticle.content,
      coverImage: defaultArticle.coverImage,
      publishedAt: timestamp,
      updatedAt: timestamp
    }
  })
}

async function seedSiteSettings(database: CmsDatabaseClient) {
  const defaultSiteSettings = createDefaultSiteSettings()

  await database.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      unionName: defaultSiteSettings.unionName,
      siteDescription: defaultSiteSettings.siteDescription,
      contactEmail: defaultSiteSettings.contactEmail,
      contactPhone: defaultSiteSettings.contactPhone,
      address: defaultSiteSettings.address,
      socialsJson: JSON.stringify(defaultSiteSettings.socials),
      updatedAt: nowIso()
    }
  })
}

async function initializeDatabase(database: PrismaClient) {
  await database.$connect()

  await database.$transaction(async (transaction) => {
    await seedPages(transaction)
    await seedArticles(transaction)
    await seedSiteSettings(transaction)
  })

  return database
}

export async function useCmsDatabase() {
  if (!globalForCmsDatabase.__solisitePrismaInit) {
    globalForCmsDatabase.__solisitePrismaInit = initializeDatabase(prisma)
  }

  return globalForCmsDatabase.__solisitePrismaInit
}

export async function runInCmsTransaction<T>(callback: (database: Prisma.TransactionClient) => Promise<T>) {
  const database = await useCmsDatabase()
  return await database.$transaction(async transaction => callback(transaction))
}
