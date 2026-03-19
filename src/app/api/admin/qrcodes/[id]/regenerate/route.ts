import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { generateQRCode } from '@/lib/qrGenerator'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const station = await prisma.question.findUnique({ where: { id: params.id } })
  if (!station)
    return NextResponse.json({ error: 'Station introuvable' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  await generateQRCode(station.id, station.stationCode, baseUrl)

  return NextResponse.json({ success: true })
}
