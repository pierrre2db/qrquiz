import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const questions = await prisma.question.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(questions)
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { stationLabel, stationCode, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, isActive } = body

  if (!stationLabel || !stationCode || !question || !optionA || !optionB || !optionC || !optionD || correctAnswer === undefined)
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })

  if (!/^\d{3}$/.test(stationCode))
    return NextResponse.json({ error: 'Le code station doit être 3 chiffres exactement' }, { status: 400 })

  // Vérifier unicité stationCode
  const existing = await prisma.question.findUnique({ where: { stationCode } })
  if (existing)
    return NextResponse.json({ error: 'Ce code station est déjà utilisé' }, { status: 409 })

  // Vérifier limite max
  const maxSetting = await prisma.setting.findUnique({ where: { key: 'max_questions_limit' } })
  const maxLimit = parseInt(maxSetting?.value ?? '20')
  const currentCount = await prisma.question.count()
  if (currentCount >= maxLimit)
    return NextResponse.json({ error: `Limite atteinte (maximum ${maxLimit} stations)` }, { status: 403 })

  const maxOrder = await prisma.question.aggregate({ _max: { order: true } })
  const order = (maxOrder._max.order ?? 0) + 1

  const created = await prisma.question.create({
    data: {
      stationLabel: stationLabel.trim(),
      stationCode,
      question: question.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctAnswer: parseInt(correctAnswer),
      explanation: explanation?.trim() ?? null,
      order,
      isActive: isActive ?? true,
    },
  })

  return NextResponse.json(created, { status: 201 })
}
