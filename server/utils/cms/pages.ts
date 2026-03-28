import type { CmsPage } from '~~/lib/cms'
import { createPageRevision } from './revisions'
import type { PageRecord } from './types'
import { runInCmsTransaction, useCmsDatabase } from './database'
import { notFound } from './http'
import { toPage } from './mappers'
import { nowIso } from './shared'

export function listPages() {
  const records = useCmsDatabase().query(`
    SELECT slug, name, title, description, headline, subheadline, cta_label, cta_href, content_json, updated_at
    FROM pages
    ORDER BY name
  `).all() as PageRecord[]

  return records.map(toPage)
}

export function getPage(slug: string) {
  const record = useCmsDatabase().query(`
    SELECT slug, name, title, description, headline, subheadline, cta_label, cta_href, content_json, updated_at
    FROM pages
    WHERE slug = $slug
  `).get({ slug }) as PageRecord | null

  return record ? toPage(record) : null
}

interface UpdatePageOptions {
  skipRevision?: boolean
}

function normalizePageUpdate(current: CmsPage, input: Partial<CmsPage>): CmsPage {
  return {
    ...current,
    ...input,
    slug: current.slug,
    name: current.name,
    content: input.content ?? current.content,
    updatedAt: nowIso()
  }
}

export function updatePage(slug: string, input: Partial<CmsPage>, options: UpdatePageOptions = {}) {
  return runInCmsTransaction(() => {
    const current = getPage(slug)

    if (!current) {
      notFound(`Page "${slug}" not found.`)
    }

    const updated = normalizePageUpdate(current, input)

    useCmsDatabase().query(`
      UPDATE pages
      SET title = $title,
          description = $description,
          headline = $headline,
          subheadline = $subheadline,
          cta_label = $ctaLabel,
          cta_href = $ctaHref,
          content_json = $contentJson,
          updated_at = $updatedAt
      WHERE slug = $slug
    `).run({
      slug: updated.slug,
      title: updated.title,
      description: updated.description,
      headline: updated.headline,
      subheadline: updated.subheadline,
      ctaLabel: updated.ctaLabel,
      ctaHref: updated.ctaHref,
      contentJson: JSON.stringify(updated.content),
      updatedAt: updated.updatedAt
    })

    const savedPage = getPage(slug)

    if (!savedPage) {
      notFound(`Page "${slug}" not found.`)
    }

    if (!options.skipRevision) {
      createPageRevision(savedPage)
    }

    return savedPage
  })
}
