import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session.participantId)
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const participant = await prisma.participant.findUnique({
    where: { id: session.participantId },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  if (!participant)
    return NextResponse.json({ error: 'Participant introuvable' }, { status: 404 })

  return NextResponse.json(participant)
}
