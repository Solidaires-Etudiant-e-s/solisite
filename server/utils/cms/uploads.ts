import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import type { H3Event } from 'h3'

const imageExtensions: Record<string, string> = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp'
}

const documentExtensions = new Set([
  '.csv',
  '.doc',
  '.docx',
  '.jpeg',
  '.jpg',
  '.odp',
  '.ods',
  '.odt',
  '.pdf',
  '.png',
  '.rtf',
  '.txt',
  '.webp',
  '.xls',
  '.xlsx',
  '.zip'
])

const documentMimeTypes = new Set([
  'application/msword',
  'application/pdf',
  'application/rtf',
  'application/vnd.ms-excel',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'text/plain'
])

const maxUploadSize = 25 * 1024 * 1024

interface UploadPart {
  data: Uint8Array
  filename: string
  type?: string
}

function getRandomFilename(extension: string) {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`
}

function getMultipartFile(event: H3Event): Promise<UploadPart> {
  return readMultipartFormData(event).then((files) => {
    const file = files?.find(part => part.name === 'file')

    if (!file?.data || !file.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing file.'
      })
    }

    if (file.data.byteLength > maxUploadSize) {
      throw createError({
        statusCode: 413,
        statusMessage: 'File is too large.'
      })
    }

    return {
      data: file.data,
      filename: file.filename,
      type: file.type
    }
  })
}

async function writeUpload(directory: string, filename: string, data: Uint8Array) {
  const uploadsDir = resolve(process.cwd(), `public/uploads/${directory}`)

  await mkdir(uploadsDir, { recursive: true })
  await writeFile(join(uploadsDir, filename), data)

  return {
    path: `/uploads/${directory}/${filename}`
  }
}

export async function uploadImage(event: H3Event, directory: string) {
  const file = await getMultipartFile(event)
  const type = file.type || ''

  if (!type.startsWith('image/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing image file.'
    })
  }

  const extension = extname(file.filename).toLowerCase() || imageExtensions[type] || '.jpg'
  return await writeUpload(directory, getRandomFilename(extension), file.data)
}

export async function uploadDocument(event: H3Event, directory: string) {
  const file = await getMultipartFile(event)
  const type = file.type || ''
  const extension = extname(file.filename).toLowerCase()

  if (!documentExtensions.has(extension) && !documentMimeTypes.has(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported file type.'
    })
  }

  return await writeUpload(directory, getRandomFilename(extension || '.bin'), file.data)
}
