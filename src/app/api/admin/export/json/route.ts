import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const questions = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, stationLabel: true, stationCode: true, optionA: true, optionB: true, optionC: true, optionD: true },
  })

  const participants = await prisma.participant.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      answers: {
        orderBy: { answeredAt: 'asc' },
        select: { stationId: true, selectedOption: true, isCorrect: true, answeredAt: true },
      },
      subsidiary: { select: { answerText: true, answeredAt: true } },
    },
  })

  const totalActive = questions.length
  const OPTION_LABELS = ['A', 'B', 'C', 'D']

  const data = participants.map((p) => {
    const answersMap = new Map(p.answers.map((a) => [a.stationId, a]))
    const score = p.answers.filter((a) => a.isCorrect).length
    const isComplete = p.answers.length >= totalActive
    const pct = totalActive > 0 ? Math.round((score / totalActive) * 100) : 0

    const answers = questions.map((q) => {
      const a = answersMap.get(q.id)
      if (!a) return { stationCode: q.stationCode, stationLabel: q.stationLabel, answered: false }
      const options = [q.optionA, q.optionB, q.optionC, q.optionD]
      return {
        stationCode: q.stationCode,
        stationLabel: q.stationLabel,
        answered: true,
        selectedOption: OPTION_LABELS[a.selectedOption],
        selectedText: options[a.selectedOption] ?? '',
        isCorrect: a.isCorrect,
        answeredAt: a.answeredAt.toISOString(),
      }
    })

    return {
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      registeredAt: p.createdAt.toISOString(),
      score,
      total: totalActive,
      pct,
      complete: isComplete,
      subsidiaryAnswer: p.subsidiary
        ? { text: p.subsidiary.answerText, answeredAt: p.subsidiary.answeredAt.toISOString() }
        : null,
      answers,
    }
  })

  const now = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="resultats_${now}.json"`,
    },
  })
}
