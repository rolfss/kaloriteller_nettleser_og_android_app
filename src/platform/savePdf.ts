import { saveFile, type ExportResult } from './saveFile'

export type { ExportResult } from './saveFile'

export async function savePdf(bytes: Uint8Array, filename: string): Promise<ExportResult> {
  return saveFile(bytes, {
    filename,
    mimeType: 'application/pdf',
    extension: '.pdf',
    description: 'PDF-dokument',
    shareTitle: 'Kaloriteller PDF',
  })
}
