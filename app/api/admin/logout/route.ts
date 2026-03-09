import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const COOKIE_NAME = 'admin_token'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value

  if (token) {
    try {
      await prisma.adminSession.deleteMany({ where: { token } })
    } catch (err) {
      console.error('[/api/admin/logout]', err)
      // Non-bloquant : on clear le cookie quoi qu'il arrive
    }
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   0,
  })
  return res
}