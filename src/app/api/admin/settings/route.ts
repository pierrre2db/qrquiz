import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const settings = await prisma.setting.findMany()
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  return NextResponse.json(map)
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const totalQuestions = await prisma.question.count({ where: { isActive: true } })

  if (body.active_questions_count !== undefined) {
    const val = parseInt(body.active_questions_count)
    if (isNaN(val) || val < 1)
      return NextResponse.json({ error: 'Valeur invalide pour active_questions_count' }, { status: 400 })
    await prisma.setting.upsert({
      where: { key: 'active_questions_count' },
      update: { value: String(Math.min(val, totalQuestions)) },
      create: { key: 'active_questions_count', value: String(val) },
    })
  }

  if (body.max_questions_limit !== undefined) {
    const val = parseInt(body.max_questions_limit)
    if (isNaN(val) || val < 1)
      return NextResponse.json({ error: 'Valeur invalide pour max_questions_limit' }, { status: 400 })
    await prisma.setting.upsert({
      where: { key: 'max_questions_limit' },
      update: { value: String(val) },
      create: { key: 'max_questions_limit', value: String(val) },
    })
  }

  if (body.subsidiary_question !== undefined) {
    await prisma.setting.upsert({
      where: { key: 'subsidiary_question' },
      update: { value: body.subsidiary_question },
      create: { key: 'subsidiary_question', value: body.subsidiary_question },
    })
  }

  for (const key of ['welcome_title', 'welcome_text', 'welcome_url'] as const) {
    if (body[key] !== undefined) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: body[key] },
        create: { key, value: body[key] },
      })
    }
  }

  const settings = await prisma.setting.findMany()
  return NextResponse.json(Object.fromEntries(settings.map((s) => [s.key, s.value])))
}
