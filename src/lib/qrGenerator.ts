import QRCode from 'qrcode'
import path from 'path'
import fs from 'fs'
import { ensureDataDir } from './fileStorage'

const DATA_DIR = process.env.DATA_DIR || './data'

export async function generateQRCode(stationId: string, stationCode: string, baseUrl: string): Promise<string> {
  ensureDataDir()
  const url = `${baseUrl}/station/code/${stationCode}`
  const filePath = path.join(DATA_DIR, 'qrcodes', `${stationId}.png`)

  await QRCode.toFile(filePath, url, {
    width: 1000,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  })

  return filePath
}

export async function generateAllQRCodes(
  stations: { id: string; stationCode: string }[],
  baseUrl: string
): Promise<void> {
  ensureDataDir()
  for (const station of stations) {
    await generateQRCode(station.id, station.stationCode, baseUrl)
  }
}

export function getQRCodePath(stationId: string): string {
  return path.join(DATA_DIR, 'qrcodes', `${stationId}.png`)
}

export function qrCodeExists(stationId: string): boolean {
  return fs.existsSync(getQRCodePath(stationId))
}
