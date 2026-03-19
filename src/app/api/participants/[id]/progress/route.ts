import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.participantId || session.participantId !== params.id)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const activeQuestions = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, stationLabel: true, stationCode: true, order: true },
  })
  const totalActive = activeQuestions.length

  const answers = await prisma.answer.findMany({
    where: { participantId: params.id },
    select: { stationId: true, isCorrect: true, selectedOption: true },
  })

  const answeredIds = new Set(answers.map((a) => a.stationId))
  const isComplete = activeQuestions.every((q) => answeredIds.has(q.id))

  const stations = activeQuestions.map((q) => ({
    id: q.id,
    stationLabel: q.stationLabel,
    stationCode: q.stationCode,
    order: q.order,
    answered: answeredIds.has(q.id),
    answer: answers.find((a) => a.stationId === q.id) ?? null,
  }))

  return NextResponse.json({ stations, totalActive, isComplete })
}
