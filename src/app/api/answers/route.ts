import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.participantId)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { stationId, selectedOption } = body

  if (stationId === undefined || selectedOption === undefined)
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  if (![0, 1, 2, 3].includes(selectedOption))
    return NextResponse.json({ error: 'Option invalide' }, { status: 400 })

  const station = await prisma.question.findUnique({ where: { id: stationId } })
  if (!station)
    return NextResponse.json({ error: 'Station introuvable' }, { status: 404 })

  // Anti double-submit
  const existing = await prisma.answer.findUnique({
    where: { participantId_stationId: { participantId: session.participantId, stationId } },
  })
  if (existing)
    return NextResponse.json({ error: 'Déjà répondu', isCorrect: existing.isCorrect }, { status: 409 })

  const isCorrect = selectedOption === station.correctAnswer

  await prisma.answer.create({
    data: { participantId: session.participantId, stationId, selectedOption, isCorrect },
  })

  // Vérifier si le parcours est complet
  const totalActive = await prisma.question.count({ where: { isActive: true } })
  const answeredCount = await prisma.answer.count({ where: { participantId: session.participantId } })
  const isComplete = answeredCount >= totalActive

  return NextResponse.json({ isCorrect, isComplete })
}
