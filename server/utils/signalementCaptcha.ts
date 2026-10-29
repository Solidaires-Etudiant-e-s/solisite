import { randomUUID } from 'node:crypto'
import type { CmsPage } from '~~/lib/cms'

interface Challenge {
  answer: string
  expiresAt: number
  attempts: number
}

interface RateEntry {
  count: number
  resetAt: number
}

const CHALLENGE_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

const challenges = new Map<string, Challenge>()
const rateLimits = new Map<string, RateEntry>()

function purgeExpired() {
  const now = Date.now()

  for (const [token, challenge] of challenges) {
    if (challenge.expiresAt <= now) {
      challenges.delete(token)
    }
  }

  for (const [key, entry] of rateLimits) {
    if (entry.resetAt <= now) {
      rateLimits.delete(key)
    }
  }
}

export function createSignalementChallenge() {
  purgeExpired()

  const left = 2 + Math.floor(Math.random() * 11)
  const right = 2 + Math.floor(Math.random() * 11)
  const token = randomUUID()

  challenges.set(token, {
    answer: String(left + right),
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    attempts: 0
  })

  return {
    token,
    question: `Combien font ${left} + ${right} ? (réponse en chiffres)`
  }
}

export type ChallengeVerdict
  = | { ok: true }
    | { ok: false, reason: 'missing' | 'expired' | 'invalid' | 'too-many-attempts' }

export function verifySignalementChallenge(token: string, answer: string): ChallengeVerdict {
  purgeExpired()

  const challenge = challenges.get(token)

  if (!challenge) {
    return { ok: false, reason: 'missing' }
  }

  if (challenge.expiresAt <= Date.now()) {
    challenges.delete(token)
    return { ok: false, reason: 'expired' }
  }

  challenge.attempts += 1

  if (challenge.attempts > MAX_ATTEMPTS) {
    challenges.delete(token)
    return { ok: false, reason: 'too-many-attempts' }
  }

  if (challenge.answer !== answer.trim()) {
    return { ok: false, reason: 'invalid' }
  }

  challenges.delete(token)
  return { ok: true }
}

export function checkSignalementRateLimit(key: string, limit: number, windowMs: number) {
  purgeExpired()

  const now = Date.now()
  const entry = rateLimits.get(key)

  if (!entry || entry.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count += 1
  return true
}

function redactSignalementBody(body: string) {
  return body
    .replace(/href="https?:\/\/[^"]*framaforms[^"]*"/gi, 'href="#"')
    .replace(/href="mailto:[^"]*"/gi, 'href="#"')
}

export function redactSignalementVssPage(page: CmsPage): CmsPage {
  const content = (page.content ?? {}) as Record<string, unknown>

  return {
    ...page,
    ctaHref: page.ctaHref.startsWith('/') ? page.ctaHref : '',
    content: {
      ...content,
      formHref: '',
      emailHref: '',
      body: typeof content.body === 'string' ? redactSignalementBody(content.body) : content.body
    }
  }
}
