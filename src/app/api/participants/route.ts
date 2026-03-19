import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { appendToCSV, rewriteJSON } from '@/lib/fileStorage'
import { randomUUID } from 'crypto'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^\+?\d{7,15}$/

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { firstName, lastName, phone, email } = body

  // Validation
  if (!firstName || firstName.trim().length < 2)
    return NextResponse.json({ error: 'Prénom invalide (min 2 caractères)' }, { status: 400 })
  if (!lastName || lastName.trim().length < 2)
    return NextResponse.json({ error: 'Nom invalide (min 2 caractères)' }, { status: 400 })
  if (!phone || !phoneRegex.test(phone.trim()))
    return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
  if (!email || !emailRegex.test(email.trim()))
    return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })

  // Unicité email
  const existing = await prisma.participant.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (existing)
    return NextResponse.json({ error: 'Cette adresse email est déjà enregistrée' }, { status: 409 })

  const sessionId = randomUUID()
  let participant
  try {
    participant = await prisma.participant.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        sessionId,
      },
    })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'P2002')
      return NextResponse.json({ error: 'Cette adresse email est déjà enregistrée' }, { status: 409 })
    throw err
  }

  // Fichiers CSV + JSON
  try {
    appendToCSV(participant)
    const allParticipants = await prisma.participant.findMany({ orderBy: { createdAt: 'asc' } })
    rewriteJSON(allParticipants)
  } catch {
    // Non bloquant
  }

  // Cookie de session
  const session = await getSession()
  session.participantId = participant.id
  await session.save()

  return NextResponse.json({ id: participant.id, sessionId }, { status: 201 })
}
