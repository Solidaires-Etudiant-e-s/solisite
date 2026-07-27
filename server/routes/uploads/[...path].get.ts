import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { getRouterParam, sendStream, setHeader } from 'h3'
import { getUploadsRoot } from '~~/server/utils/cms/uploads'

const contentTypes: Record<string, string> = {
  '.csv': 'text/csv',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.rtf': 'application/rtf',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip'
}

export default defineEventHandler(async (event) => {
  const uploadsRoot = getUploadsRoot()
  const requestedPath = getRouterParam(event, 'path') || ''
  const filePath = resolve(uploadsRoot, requestedPath)
  const relativePath = relative(uploadsRoot, filePath)

  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw createError({ statusCode: 404, statusMessage: 'File not found.' })
  }

  try {
    const fileStats = await stat(filePath)

    if (!fileStats.isFile()) {
      throw new Error('Not a file')
    }
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found.' })
  }

  setHeader(event, 'Content-Type', contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream')
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return await sendStream(event, createReadStream(filePath))
})
