import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Accepter uniquement les appels internes depuis le middleware
  const isMiddleware = req.headers.get('x-middleware-request') === '1'
  if (!isMiddleware) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const token = req.headers.get('x-admin-token')
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    const session = await prisma.adminSession.findUnique({
      where: { token },
    })

    if (!session || session.expiresAt < new Date()) {
      // Nettoyer la session expirée si elle existe
      if (session) {
        await prisma.adminSession.delete({ where: { token } }).catch(() => {})
      }
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/admin/verify]', err)
    return NextResponse.json({ ok: false }, { status: 401 })
  }
}