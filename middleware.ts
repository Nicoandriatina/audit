/**
 * middleware.ts  — Racine du projet Next.js
 *
 * Protège toutes les routes /admin/* sauf /admin/login.
 *
 * Flow :
 *  1. Si la route ne commence pas par /admin → laisser passer
 *  2. Si la route est /admin/login → laisser passer
 *  3. Lire le cookie "admin_token"
 *  4. Vérifier la session en DB via /api/admin/verify (fetch interne)
 *     → on ne peut pas importer Prisma directement dans le middleware Edge
 *  5. Session invalide/expirée → redirect /admin/login
 *  6. Session valide → laisser passer
 *
 * Note architecture :
 *  Le middleware Next.js tourne dans le runtime Edge (pas Node).
 *  On ne peut pas y appeler Prisma directement.
 *  On appelle donc une route API interne /api/admin/verify qui tourne en Node.
 */

import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME  = 'admin_token'
const LOGIN_PATH   = '/admin/login'
const VERIFY_PATH  = '/api/admin/verify'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Laisser passer tout ce qui n'est pas /admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // 2. Laisser passer la page de login
  if (pathname === LOGIN_PATH || pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  // 3. Lire le cookie
  const token = req.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return redirectToLogin(req)
  }

  // 4. Vérifier la session via route API interne
  try {
    const verifyUrl = new URL(VERIFY_PATH, req.url)
    const verifyRes = await fetch(verifyUrl.toString(), {
      method: 'GET',
      headers: {
        // Passer le token dans un header custom (le cookie est déjà dans la request)
        'x-admin-token': token,
        'x-middleware-request': '1', // marker pour éviter les boucles
      },
      // Cache désactivé — on veut toujours une vérification fraîche
      cache: 'no-store',
    })

    if (!verifyRes.ok) {
      return redirectToLogin(req)
    }

    return NextResponse.next()
  } catch (err) {
    console.error('[middleware] verify error:', err)
    return redirectToLogin(req)
  }
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = new URL(LOGIN_PATH, req.url)
  loginUrl.searchParams.set('from', req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}