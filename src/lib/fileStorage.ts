import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || './data'

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  const qrDir = path.join(DATA_DIR, 'qrcodes')
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true })
  }
}

interface ParticipantData {
  firstName: string
  lastName: string
  phone: string
  email: string
  createdAt: Date | string
}

export function appendToCSV(participant: ParticipantData) {
  ensureDataDir()
  const csvPath = path.join(DATA_DIR, 'participants.csv')
  const isNew = !fs.existsSync(csvPath)

  const header = '\uFEFFprénom,nom,téléphone,email,date_inscription\n'
  const date =
    participant.createdAt instanceof Date
      ? participant.createdAt.toISOString()
      : participant.createdAt

  const row = [
    participant.firstName,
    participant.lastName,
    participant.phone,
    participant.email,
    date,
  ]
    .map((v) => `"${String(v).replace(/"/g, '""')}"`)
    .join(',') + '\n'

  if (isNew) {
    fs.writeFileSync(csvPath, header + row, 'utf8')
  } else {
    fs.appendFileSync(csvPath, row, 'utf8')
  }
}

export function rewriteJSON(participants: ParticipantData[]) {
  ensureDataDir()
  const jsonPath = path.join(DATA_DIR, 'participants.json')
  fs.writeFileSync(jsonPath, JSON.stringify(participants, null, 2), 'utf8')
}
