import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { order } = body // [{ id: string, order: number }, ...]

  if (!Array.isArray(order))
    return NextResponse.json({ error: 'Format invalide' }, { status: 400 })

  await Promise.all(
    order.map(({ id, order: o }: { id: string; order: number }) =>
      prisma.question.update({ where: { id }, data: { order: o } })
    )
  )

  return NextResponse.json({ success: true })
}
