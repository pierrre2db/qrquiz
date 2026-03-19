import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.participantId)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { answerText } = body

  if (!answerText || answerText.trim().length === 0)
    return NextResponse.json({ error: 'Réponse vide' }, { status: 400 })

  // Vérifier que le parcours est complet
  const totalActive = await prisma.question.count({ where: { isActive: true } })
  const answeredCount = await prisma.answer.count({ where: { participantId: session.participantId } })

  if (answeredCount < totalActive)
    return NextResponse.json({ error: 'Parcours non complet' }, { status: 403 })

  // Une seule réponse subsidiaire
  const existing = await prisma.subsidiaryAnswer.findUnique({ where: { participantId: session.participantId } })
  if (existing)
    return NextResponse.json({ error: 'Réponse subsidiaire déjà soumise' }, { status: 409 })

  await prisma.subsidiaryAnswer.create({
    data: { participantId: session.participantId, answerText: answerText.trim() },
  })

  return NextResponse.json({ success: true })
}
