import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { generateAllQRCodes, qrCodeExists } from '@/lib/qrGenerator'

export async function GET() {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const questions = await prisma.question.findMany({ orderBy: { order: 'asc' } })
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const qrcodes = questions.map((q) => ({
    id: q.id,
    stationLabel: q.stationLabel,
    stationCode: q.stationCode,
    order: q.order,
    isActive: q.isActive,
    url: `${baseUrl}/station/code/${q.stationCode}`,
    hasImage: qrCodeExists(q.id),
  }))

  return NextResponse.json(qrcodes)
}

export async function POST() {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const questions = await prisma.question.findMany({ select: { id: true, stationCode: true } })
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  await generateAllQRCodes(questions, baseUrl)

  return NextResponse.json({ success: true, generated: questions.length })
}
