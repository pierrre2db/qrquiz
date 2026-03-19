import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [totalParticipants, questions] = await Promise.all([
    prisma.participant.count(),
    prisma.question.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        answers: {
          select: { participantId: true, isCorrect: true, selectedOption: true },
        },
      },
    }),
  ])

  const allAnswers = await prisma.answer.findMany()
  const totalAnswers = allAnswers.length
  const answeredByParticipant = new Map<string, number>()
  for (const a of allAnswers) {
    answeredByParticipant.set(a.participantId, (answeredByParticipant.get(a.participantId) ?? 0) + 1)
  }
  const totalActive = questions.length
  const completeCount = Array.from(answeredByParticipant.values()).filter((c) => c >= totalActive).length

  const stationStats = questions.map((q) => ({
    id: q.id,
    stationLabel: q.stationLabel,
    stationCode: q.stationCode,
    order: q.order,
    totalAnswers: q.answers.length,
    correctAnswers: q.answers.filter((a) => a.isCorrect).length,
    percentage: q.answers.length > 0 ? Math.round((q.answers.filter((a) => a.isCorrect).length / q.answers.length) * 100) : 0,
  }))

  const subsidiaryAnswers = await prisma.subsidiaryAnswer.findMany({
    include: { participant: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { answeredAt: 'asc' },
  })

  return NextResponse.json({
    totalParticipants,
    completeCount,
    totalAnswers,
    totalActive,
    stationStats,
    subsidiaryAnswers,
  })
}
