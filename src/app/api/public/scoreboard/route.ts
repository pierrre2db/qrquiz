import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const WINDOW_MS = 2 * 60 * 60 * 1000 // 2 heures

export async function GET() {
  const totalActive = await prisma.question.count({ where: { isActive: true } })

  const participants = await prisma.participant.findMany({
    include: { answers: { select: { isCorrect: true, answeredAt: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const totalParticipants = participants.length

  const allCompleted = participants
    .filter((p) => p.answers.length >= totalActive && totalActive > 0)
    .map((p) => {
      const score = p.answers.filter((a) => a.isCorrect).length
      const completedAt = p.answers.reduce(
        (latest, a) => (a.answeredAt > latest ? a.answeredAt : latest),
        new Date(0)
      )
      return {
        firstName: p.firstName,
        lastName: p.lastName.charAt(0).toUpperCase() + '.',
        score,
        total: totalActive,
        pct: totalActive > 0 ? Math.round((score / totalActive) * 100) : 0,
        completedAt,
      }
    })
    .sort((a, b) => b.score - a.score || a.completedAt.getTime() - b.completedAt.getTime())

  // Filtre 2h — fallback sur tout le classement si personne dans la fenêtre
  const cutoff = new Date(Date.now() - WINDOW_MS)
  const inWindow = allCompleted.filter((p) => p.completedAt >= cutoff)
  const scoreboard = (inWindow.length > 0 ? inWindow : allCompleted)
    .slice(0, 10)
    .map(({ completedAt, ...rest }) => ({ ...rest, completedAt: completedAt.toISOString() }))

  return NextResponse.json({
    totalParticipants,
    completeCount: allCompleted.length,
    inWindow: inWindow.length,
    totalActive,
    scoreboard,
  })
}
