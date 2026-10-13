import type { CmsTag } from '~~/lib/cms'
import type { TagRecord } from './types'
import { useCmsDatabase } from './database'

export async function listTags(): Promise<CmsTag[]> {
  const database = await useCmsDatabase()
  const records = await database.tag.findMany({
    orderBy: [{ name: 'asc' }]
  }) as TagRecord[]

  return records.map(record => ({
    id: record.id,
    name: record.name,
    slug: record.slug,
    icon: record.icon
  }))
}
