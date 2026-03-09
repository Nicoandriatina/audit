import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateFullAuditResult, type AuditAnswers } from '@/lib/scoring'
import { generateCompetitors } from '@/lib/competitors'

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse body ──────────────────────────────────────────────────────
    let body: AuditAnswers
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Corps de la requête invalide (JSON attendu).' },
        { status: 400 },
      )
    }

    // ── 2. Validation ──────────────────────────────────────────────────────
    const { qualification } = body
    if (!qualification?.businessName?.trim()) {
      return NextResponse.json(
        { error: "Le nom de l'entreprise est requis." },
        { status: 422 },
      )
    }
    if (!qualification?.activityType || !['B2B', 'B2C'].includes(qualification.activityType)) {
      return NextResponse.json(
        { error: "Le type d'activité (B2B / B2C) est requis." },
        { status: 422 },
      )
    }

    // ── 3. Calcul complet (scores + sectoriel + clients perdus) ───────────
    const result = calculateFullAuditResult(body)
    const { scores, template, percentile, lostClients, lostMessage } = result

    // ── 4. Persistance Prisma (transaction — 2 ops) ────────────────────────
    // Étape 4a : create sans competitorsJSON (on a besoin de l'id pour le seed)
    // Étape 4b : générer + update competitorsJSON dans la même transaction
    const audit = await prisma.$transaction(async (tx) => {
      const created = await tx.audit.create({
        data: {
          businessName: qualification.businessName.trim(),
          city:         qualification.city?.trim()   ?? '',
          sector:       qualification.sector?.trim() ?? '',
          activityType: qualification.activityType,

          // Scores piliers /20
          scoreSocial:   scores.social,
          scoreWeb:      scores.web,
          scoreGBP:      scores.gbp,
          scoreFunnel:   scores.funnel,
          scoreBranding: scores.branding,

          // Score global
          scoreGlobal:    scores.global,
          scoreGlobalRaw: scores.globalRaw,

          // Sectoriel
          sectorTemplateId: template.id,
          sectorPercentile: percentile.percentile,

          // Clients perdus
          lostClientsJSON: lostClients as object,

          // Wizard answers
          answersJSON: body as object,
          isUnlocked:  false,
        },
      })

      // Générer les concurrents (seed déterministe = auditId)
      const competitorsAnalysis = generateCompetitors(
        created.id,
        scores,
        qualification.sector ?? '',
      )

      return tx.audit.update({
        where: { id: created.id },
        data: { competitorsJSON: competitorsAnalysis as object },
      })
    })

    // ── 5. Régénérer l'analyse pour la réponse (déterministe = même résultat) ─
    const competitorsAnalysis = generateCompetitors(audit.id, scores, qualification.sector ?? '')

    // ── 6. Réponse ─────────────────────────────────────────────────────────
    return NextResponse.json(
      {
        auditId: audit.id,
        scores: {
          global:    scores.global,
          globalRaw: scores.globalRaw,
          social:    scores.social,
          web:       scores.web,
          gbp:       scores.gbp,
          funnel:    scores.funnel,
          branding:  scores.branding,
        },
        sector: {
          templateId:      template.id,
          label:           template.label,
          percentile:      percentile.percentile,
          percentileLabel: percentile.label,
          benchmarks:      template.benchmarks,
        },
        lostClients: {
          monthlyLostLeads:    lostClients.monthlyLostLeads,
          monthlyLostRevenue:  lostClients.monthlyLostRevenue,
          yearlyLostRevenue:   lostClients.yearlyLostRevenue,
          yearlyPotentialGain: lostClients.yearlyPotentialGain,
          range:               lostClients.range,
          headline:            lostMessage.headline,
          subline:             lostMessage.subline,
          urgency:             lostMessage.urgency,
        },
        competitors: competitorsAnalysis,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[/api/audit/create]', err)
    return NextResponse.json(
      { error: 'Erreur serveur. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}