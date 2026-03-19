import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { generateAllQRCodes } from '@/lib/qrGenerator'

export async function POST() {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const questions = await prisma.question.findMany({ select: { id: true, stationCode: true } })
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  await generateAllQRCodes(questions, baseUrl)

  return NextResponse.json({ success: true, generated: questions.length })
}
