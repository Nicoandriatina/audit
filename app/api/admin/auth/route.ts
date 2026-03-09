import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes, timingSafeEqual } from 'crypto'

const COOKIE_NAME    = 'admin_token'
const SESSION_DAYS   = 7
const SESSION_MS     = SESSION_DAYS * 24 * 60 * 60 * 1000

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

// ─── POST — Login ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 })
  }

  const { password } = body
  const adminPassword = process.env.ADMIN_PASSWORD

  // 2. Vérification basique de la config
  if (!adminPassword || adminPassword.length < 8) {
    console.error('[admin/auth] ADMIN_PASSWORD non configuré ou trop court.')
    return NextResponse.json({ error: 'Accès non disponible.' }, { status: 503 })
  }

  // 3. Comparaison timing-safe
  if (!password || !timingSafeCompare(password, adminPassword)) {
    // Délai artificiel pour ralentir le brute-force
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400))
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 })
  }

  // 4. Créer la session en DB
  const token     = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_MS)

  try {
    // Nettoyer les sessions expirées au passage (housekeeping léger)
    await prisma.adminSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    await prisma.adminSession.create({
      data: { token, expiresAt },
    })
  } catch (err) {
    console.error('[admin/auth] DB error:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }

  // 5. Set cookie + réponse
  const isProduction = process.env.NODE_ENV === 'production'

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly:  true,
    secure:    isProduction,
    sameSite:  'lax',
    path:      '/',
    maxAge:    SESSION_MS / 1000,
  })

  return res
}

// ─── DELETE — Logout ──────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value

  if (token) {
    try {
      await prisma.adminSession.deleteMany({ where: { token } })
    } catch {
      // Non-bloquant
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