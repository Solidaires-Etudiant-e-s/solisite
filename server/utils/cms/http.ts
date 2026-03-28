import type { H3Event } from 'h3'

export function requireRouteParam(event: H3Event, name: string, message: string) {
  const value = getRouterParam(event, name)

  if (!value) {
    throw createError({
      statusCode: 400,
      statusMessage: message
    })
  }

  return value
}

export function requirePositiveIntParam(event: H3Event, name: string, message: string) {
  const value = Number(getRouterParam(event, name))

  if (!Number.isInteger(value) || value <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: message
    })
  }

  return value
}

export async function readTypedBody<T>(event: H3Event) {
  return await readBody<T>(event)
}

export function notFound(message: string): never {
  throw createError({
    statusCode: 404,
    statusMessage: message
  })
}
