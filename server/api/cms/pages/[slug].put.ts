import type { CmsPage } from '~~/lib/cms'
import { requireAdminAccess } from '~~/server/utils/auth'
import { updatePage } from '~~/server/utils/cms/pages'
import { readTypedBody, requireRouteParam } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const slug = requireRouteParam(event, 'slug', 'Missing page slug.')
  const body = await readTypedBody<Partial<CmsPage>>(event)

  return updatePage(slug, body)
})
