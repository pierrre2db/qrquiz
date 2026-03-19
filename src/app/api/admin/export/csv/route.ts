import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

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
      answers: { select: { stationId: true, selectedOption: true, isCorrect: true, answeredAt: true } },
      subsidiary: { select: { answerText: true, answeredAt: true } },
    },
  })

  const totalActive = questions.length
  const OPTION_LABELS = ['A', 'B', 'C', 'D']
  const getOptionText = (q: typeof questions[number], idx: number) =>
    [q.optionA, q.optionB, q.optionC, q.optionD][idx] ?? ''

  // Header row
  const fixedHeaders = [
    'Prénom', 'Nom', 'Email', 'Téléphone', 'Date inscription',
    'Score', 'Total', 'Pourcentage', 'Complet', 'Question subsidiaire', 'Heure fin parcours',
  ]
  const stationHeaders = questions.flatMap((q) => [
    `${q.stationLabel} (option choisie)`,
    `${q.stationLabel} (correct)`,
  ])
  const header = '\uFEFF' + [...fixedHeaders, ...stationHeaders].map(csvCell).join(',') + '\n'

  // Data rows
  const rows = participants.map((p) => {
    const answersMap = new Map(p.answers.map((a) => [a.stationId, a]))
    const score = p.answers.filter((a) => a.isCorrect).length
    const isComplete = p.answers.length >= totalActive
    const pct = totalActive > 0 ? Math.round((score / totalActive) * 100) : 0

    const completedAt = isComplete
      ? p.answers.reduce((latest, a) => a.answeredAt > latest ? a.answeredAt : latest, new Date(0))
      : null

    const fixedCells = [
      p.firstName,
      p.lastName,
      p.email,
      p.phone,
      p.createdAt.toISOString(),
      score,
      totalActive,
      `${pct}%`,
      isComplete ? 'Oui' : 'Non',
      p.subsidiary?.answerText ?? '',
      completedAt ? completedAt.toISOString() : '',
    ]

    const stationCells = questions.flatMap((q) => {
      const answer = answersMap.get(q.id)
      if (!answer) return ['', '']
      const optLabel = OPTION_LABELS[answer.selectedOption] ?? ''
      const optText = getOptionText(q, answer.selectedOption)
      return [`${optLabel} - ${optText}`, answer.isCorrect ? 'Oui' : 'Non']
    })

    return [...fixedCells, ...stationCells].map(csvCell).join(',')
  })

  const csv = header + rows.join('\n')
  const now = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="resultats_${now}.csv"`,
    },
  })
}
