import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.participantId)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { code } = body

  if (!code || !/^\d{3}$/.test(code))
    return NextResponse.json({ error: 'STATION_NOT_FOUND' }, { status: 404 })

  const station = await prisma.question.findUnique({ where: { stationCode: code } })
  if (!station)
    return NextResponse.json({ error: 'STATION_NOT_FOUND' }, { status: 404 })

  const existing = await prisma.answer.findUnique({
    where: { participantId_stationId: { participantId: session.participantId, stationId: station.id } },
  })

  return NextResponse.json({
    stationId: station.id,
    stationLabel: station.stationLabel,
    alreadyAnswered: !!existing,
  })
}
