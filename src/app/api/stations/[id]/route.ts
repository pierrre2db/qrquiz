import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.participantId)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const station = await prisma.question.findUnique({ where: { id: params.id } })
  if (!station)
    return NextResponse.json({ error: 'Station introuvable' }, { status: 404 })

  const existing = await prisma.answer.findUnique({
    where: { participantId_stationId: { participantId: session.participantId, stationId: params.id } },
  })

  return NextResponse.json({
    id: station.id,
    stationLabel: station.stationLabel,
    stationCode: station.stationCode,
    question: station.question,
    optionA: station.optionA,
    optionB: station.optionB,
    optionC: station.optionC,
    optionD: station.optionD,
    explanation: station.explanation,
    alreadyAnswered: !!existing,
    selectedOption: existing?.selectedOption ?? null,
    isCorrect: existing?.isCorrect ?? null,
  })
}
