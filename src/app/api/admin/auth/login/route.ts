import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { login, password } = body

  if (login !== process.env.ADMIN_LOGIN || password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })

  const session = await getAdminSession()
  session.isAdmin = true
  await session.save()

  return NextResponse.json({ success: true })
}
