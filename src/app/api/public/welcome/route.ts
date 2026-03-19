import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ['welcome_title', 'welcome_text', 'welcome_url', 'subsidiary_question'] } },
  })
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  return NextResponse.json(map)
}
