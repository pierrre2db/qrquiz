import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { getQRCodePath, qrCodeExists } from '@/lib/qrGenerator'
import fs from 'fs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session.isAdmin)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const filePath = getQRCodePath(params.id)
  if (!qrCodeExists(params.id))
    return NextResponse.json({ error: 'QR code non généré' }, { status: 404 })

  const buffer = fs.readFileSync(filePath)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qr_${params.id}.png"`,
    },
  })
}
