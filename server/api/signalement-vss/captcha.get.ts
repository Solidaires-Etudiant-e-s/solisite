import { getRequestIP } from 'h3'
import { checkSignalementRateLimit, createSignalementChallenge } from '~~/server/utils/signalementCaptcha'

export default defineEventHandler((event) => {
  const ip = getRequestIP(event) || 'unknown'

  if (!checkSignalementRateLimit(`captcha:${ip}`, 30, 10 * 60 * 1000)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de demandes, réessayez dans quelques minutes.'
    })
  }

  return createSignalementChallenge()
})
