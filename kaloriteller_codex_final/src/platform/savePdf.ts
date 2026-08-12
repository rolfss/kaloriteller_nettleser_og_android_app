import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

interface SaveFilePickerOptions {
  suggestedName: string
  types: { description: string; accept: Record<string, string[]> }[]
}

interface WritableFileHandle {
  createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>
}

type WindowWithSavePicker = Window & {
  showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<WritableFileHandle>
}

export type ExportResult = 'saved' | 'cancelled'

export async function savePdf(bytes: Uint8Array, filename: string): Promise<ExportResult> {
  if (Capacitor.isNativePlatform()) return saveNative(bytes, filename)
  return saveBrowser(bytes, filename)
}

async function saveBrowser(bytes: Uint8Array, filename: string): Promise<ExportResult> {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const picker = (window as WindowWithSavePicker).showSaveFilePicker
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: filename,
        types: [{ description: 'PDF-dokument', accept: { 'application/pdf': ['.pdf'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return 'saved'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      throw error
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'saved'
}

async function saveNative(bytes: Uint8Array, filename: string): Promise<ExportResult> {
  const path = `exports/${filename}`
  await Filesystem.writeFile({
    path,
    directory: Directory.Cache,
    data: bytesToBase64(bytes),
    recursive: true,
  })
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache })
  try {
    await Share.share({ title: 'Kaloriteller', files: [uri], dialogTitle: 'Lagre eller del PDF' })
    return 'saved'
  } finally {
    await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined)
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 8192
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}
