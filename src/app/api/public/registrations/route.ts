import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [total, recent] = await Promise.all([
    prisma.participant.count(),
    prisma.participant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { firstName: true, lastName: true, createdAt: true },
    }),
  ])

  return NextResponse.json({
    total,
    recent: recent.map(p => ({
      firstName: p.firstName,
      lastName: p.lastName,
      registeredAt: p.createdAt.toISOString(),
    })),
  })
}
