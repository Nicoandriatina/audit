/**
 * app/api/audit/[id]/route.ts
 * GET /api/audit/[id]
 * Next.js 16 — params est une Promise, doit être await
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRecommendations } from '@/lib/recommendations'
import type { AuditAnswers, AuditScores } from '@/lib/scoring'
import type { Recommendation } from '@/components/audit/Recommendations'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ⚠️ Next.js 16 : params est une Promise
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })
  }

  // ── 1. Récupérer l'audit ─────────────────────────────────────────────────
  let audit: Awaited<ReturnType<typeof prisma.audit.findUnique>>

  try {
    audit = await prisma.audit.findUnique({ where: { id } })
  } catch (err) {
    console.error('[/api/audit/[id]] Prisma error:', err)
    return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 })
  }

  if (!audit) {
    return NextResponse.json({ error: 'Audit introuvable.' }, { status: 404 })
  }

  // ── 2. Champs communs ────────────────────────────────────────────────────
  const baseAudit = {
    id:            audit.id,
    businessName:  audit.businessName,
    city:          audit.city,
    sector:        audit.sector,
    activityType:  audit.activityType,
    scoreGlobal:   audit.scoreGlobal,
    scoreSocial:   audit.scoreSocial,
    scoreWeb:      audit.scoreWeb,
    scoreGBP:      audit.scoreGBP,
    scoreFunnel:   audit.scoreFunnel,
    scoreBranding: audit.scoreBranding,
    isUnlocked:    audit.isUnlocked,
  }

  // ── 3. Si débloqué → ajouter lead + recommandations ──────────────────────
  if (audit.isUnlocked) {
    let recommendations: Recommendation[] = []
    try {
      const answers = audit.answersJSON as unknown as AuditAnswers
      const scores: AuditScores = {
        global:   audit.scoreGlobal,
        social:   audit.scoreSocial,
        web:      audit.scoreWeb,
        gbp:      audit.scoreGBP,
        funnel:   audit.scoreFunnel,
        branding: audit.scoreBranding,
      }
      recommendations = generateRecommendations(answers, scores, 3)
    } catch (err) {
      console.error('[/api/audit/[id]] Recommendations error:', err)
    }

    return NextResponse.json({
      audit: {
        ...baseAudit,
        fullName: audit.fullName,
        email:    audit.email,
        phone:    audit.phone,
      },
      recommendations,
    })
  }

  // ── 4. Non débloqué → scores uniquement ──────────────────────────────────
  return NextResponse.json({
    audit: baseAudit,
    recommendations: [],
  })
}