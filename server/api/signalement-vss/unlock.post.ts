import { getRequestIP } from 'h3'
import { getPage } from '~~/server/utils/cms/pages'
import { checkSignalementRateLimit, verifySignalementChallenge } from '~~/server/utils/signalementCaptcha'
import { notFound } from '~~/server/utils/cms/http'

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event) || 'unknown'

  if (!checkSignalementRateLimit(`unlock:${ip}`, 15, 10 * 60 * 1000)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de tentatives, réessayez dans quelques minutes.'
    })
  }

  const payload = await readBody<{ token?: unknown, answer?: unknown }>(event)
  const token = typeof payload.token === 'string' ? payload.token : ''
  const answer = typeof payload.answer === 'string' ? payload.answer : ''

  if (!token || !answer) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Réponse manquante.'
    })
  }

  const verdict = verifySignalementChallenge(token, answer)

  if (!verdict.ok) {
    throw createError({
      statusCode: 403,
      statusMessage: verdict.reason === 'invalid'
        ? 'Mauvaise réponse, réessayez.'
        : 'Vérification expirée, rechargez une nouvelle question.'
    })
  }

  const page = await getPage('signalement-vss')

  if (!page) {
    notFound('Page "signalement-vss" not found.')
  }

  const content = page.content as { formHref?: string, emailHref?: string, body?: string }

  return {
    formHref: content.formHref || '',
    emailHref: content.emailHref || '',
    body: content.body || ''
  }
})
