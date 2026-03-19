import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  if (!Array.isArray(body))
    return NextResponse.json({ error: 'Format invalide — tableau attendu' }, { status: 400 })

  let imported = 0
  let skipped = 0

  for (const q of body) {
    try {
      await prisma.question.upsert({
        where: { stationCode: q.stationCode },
        update: {
          stationLabel: q.stationLabel,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
          order: q.order,
          isActive: q.isActive ?? true,
        },
        create: {
          stationLabel: q.stationLabel,
          stationCode: q.stationCode,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
          order: q.order,
          isActive: q.isActive ?? true,
        },
      })
      imported++
    } catch {
      skipped++
    }
  }

  return NextResponse.json({ imported, skipped })
}
