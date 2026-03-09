import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRecommendations } from '@/lib/recommendations'
import { getSectorTemplate } from '@/lib/sector-templates'
import type { AuditAnswers, AuditScores } from '@/types/audit'
import type { Recommendation } from '@/components/audit/Recommendations'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })
  }

  // ── 1. Récupérer l'audit ───────────────────────────────────────────────────
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

  // ── 2. Template sectoriel (pour sectorTips + benchmarks réels) ─────────────
  const template = getSectorTemplate(audit.sector)

  // ── 3. Champs communs — v2 complet ─────────────────────────────────────────
  const baseAudit = {
    id:            audit.id,
    businessName:  audit.businessName,
    city:          audit.city,
    sector:        audit.sector,
    activityType:  audit.activityType,

    // Scores piliers
    scoreSocial:   audit.scoreSocial,
    scoreWeb:      audit.scoreWeb,
    scoreGBP:      audit.scoreGBP,
    scoreFunnel:   audit.scoreFunnel,
    scoreBranding: audit.scoreBranding,

    // Score global v2
    scoreGlobal:    audit.scoreGlobal,
    scoreGlobalRaw: (audit as Record<string, unknown>).scoreGlobalRaw as number ?? audit.scoreGlobal,

    // Sectoriel v2
    sectorTemplateId: (audit as Record<string, unknown>).sectorTemplateId as string | null ?? template.id,
    sectorPercentile: (audit as Record<string, unknown>).sectorPercentile as number | null ?? null,

    // Clients perdus v2
    lostClientsJSON: (audit as Record<string, unknown>).lostClientsJSON ?? null,

    // Template live (benchmarks + tips toujours à jour même pour vieux audits)
    sectorBenchmarks: template.benchmarks,
    sectorTips:       template.sectorTips,

    isUnlocked: audit.isUnlocked,
  }

  // ── 4. Si débloqué → ajouter lead + recommandations ───────────────────────
  if (audit.isUnlocked) {
    let recommendations: Recommendation[] = []
    try {
      const answers = audit.answersJSON as unknown as AuditAnswers
      const scores: AuditScores = {
        global:    audit.scoreGlobal,
        globalRaw: (audit as Record<string, unknown>).scoreGlobalRaw as number ?? audit.scoreGlobal,
        social:    audit.scoreSocial,
        web:       audit.scoreWeb,
        gbp:       audit.scoreGBP,
        funnel:    audit.scoreFunnel,
        branding:  audit.scoreBranding,
      }
      recommendations = generateRecommendations(answers, scores, 3)
    } catch (err) {
      console.error('[/api/audit/[id]] Recommendations error:', err)
    }

    return NextResponse.json({
      audit: {
        ...baseAudit,
        fullName:    audit.fullName,
        email:       audit.email,
        phone:       audit.phone,
        answersJSON: audit.answersJSON, // nécessaire pour computeFallbackSectorData côté client
      },
      recommendations,
    })
  }

  // ── 5. Non débloqué → scores + données sectorielles (pas le lead) ─────────
  return NextResponse.json({
    audit: baseAudit,
    recommendations: [],
  })
}