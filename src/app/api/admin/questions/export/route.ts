import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const questions = await prisma.question.findMany({ orderBy: { order: 'asc' } })
  const now = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)

  return new NextResponse(JSON.stringify(questions, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="questions_${now}.json"`,
    },
  })
}
