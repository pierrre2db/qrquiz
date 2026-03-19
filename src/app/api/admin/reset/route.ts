import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { ensureDataDir } from '@/lib/fileStorage'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  if (body.password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })

  // Supprimer toutes les données participants
  await prisma.subsidiaryAnswer.deleteMany()
  await prisma.answer.deleteMany()
  await prisma.participant.deleteMany()

  // Remettre CSV et JSON à zéro
  ensureDataDir()
  const dataDir = process.env.DATA_DIR || './data'
  const csvPath = path.join(dataDir, 'participants.csv')
  const jsonPath = path.join(dataDir, 'participants.json')
  if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath)
  if (fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, '[]', 'utf8')

  return NextResponse.json({ success: true })
}
