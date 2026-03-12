import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCompetitors, type CompetitorsAnalysis } from '@/lib/competitors'
import type { AuditScores } from '@/lib/audit-types'

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
    console.error('[/api/audit/[id]/competitors] Prisma error:', err)
    return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 })
  }

  if (!audit) {
    return NextResponse.json({ error: 'Audit introuvable.' }, { status: 404 })
  }

  // ── 2. Fast path — données déjà calculées ─────────────────────────────────
  if (audit.competitorsJSON) {
    return NextResponse.json({
      analysis: audit.competitorsJSON as CompetitorsAnalysis,
      cached: true,
    })
  }

  // ── 3. Génération à la volée (audits pre-Sprint 3) ─────────────────────────
  const scores: AuditScores = {
    global:    audit.scoreGlobal,
    globalRaw: audit.scoreGlobalRaw,
    social:    audit.scoreSocial,
    web:       audit.scoreWeb,
    gbp:       audit.scoreGBP,
    funnel:    audit.scoreFunnel,
    branding:  audit.scoreBranding,
  }

  const analysis = generateCompetitors(audit.id, scores, audit.sector)

  // ── 4. Persister pour les appels suivants ──────────────────────────────────
  try {
    await prisma.audit.update({
      where: { id },
      data: { competitorsJSON: analysis as object },
    })
  } catch (err) {
    // Non-bloquant : on retourne quand même la réponse
    console.warn('[/api/audit/[id]/competitors] Failed to persist competitorsJSON:', err)
  }

  return NextResponse.json({
    analysis,
    cached: false,
  })
}