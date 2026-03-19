import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''

  const totalActive = await prisma.question.count({ where: { isActive: true } })

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const allParticipants = await prisma.participant.findMany({
    where,
    include: { answers: true },
    orderBy: { createdAt: 'desc' },
  })

  const enriched = allParticipants.map((p) => {
    const count = p.answers.length
    const statusLabel = count === 0 ? 'Débuté' : count >= totalActive ? 'Complet' : 'En cours'
    return { ...p, answeredCount: count, status: statusLabel, totalActive }
  })

  const filtered = status
    ? enriched.filter((p) => p.status === status)
    : enriched

  const total = filtered.length
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  return NextResponse.json({ participants: paginated, total, page, limit, totalActive })
}
