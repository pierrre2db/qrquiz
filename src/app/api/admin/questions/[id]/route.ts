import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { stationLabel, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, isActive } = body

  // stationCode non modifiable en édition
  const updated = await prisma.question.update({
    where: { id: params.id },
    data: {
      ...(stationLabel !== undefined && { stationLabel: stationLabel.trim() }),
      ...(question !== undefined && { question: question.trim() }),
      ...(optionA !== undefined && { optionA: optionA.trim() }),
      ...(optionB !== undefined && { optionB: optionB.trim() }),
      ...(optionC !== undefined && { optionC: optionC.trim() }),
      ...(optionD !== undefined && { optionD: optionD.trim() }),
      ...(correctAnswer !== undefined && { correctAnswer: parseInt(correctAnswer) }),
      ...(explanation !== undefined && { explanation: explanation?.trim() ?? null }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const force = req.nextUrl.searchParams.get('force') === 'true'

  const answersCount = await prisma.answer.count({ where: { stationId: params.id } })
  if (answersCount > 0 && !force)
    return NextResponse.json({ error: 'Des réponses existent pour cette station — impossible de supprimer', answersCount }, { status: 409 })

  if (answersCount > 0 && force)
    await prisma.answer.deleteMany({ where: { stationId: params.id } })

  await prisma.question.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
