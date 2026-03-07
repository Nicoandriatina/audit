
/**
 * app/api/audit/unlock/route.ts
 * POST /api/audit/unlock
 *
 * Body (JSON) :
 *   { auditId: string, fullName: string, email: string, phone: string }
 *
 * Response 200 :
 *   { audit: AuditPublic, recommendations: Recommendation[] }
 *
 * Flow :
 *  1. Valider body
 *  2. Récupérer l'audit en DB
 *  3. Mettre à jour : fullName, email, phone, isUnlocked = true
 *  4. Générer recommandations via lib/recommendations.ts
 *  5. Envoyer l'email client + notif interne via lib/email.ts (async, non-bloquant)
 *  6. Retourner audit + recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRecommendations } from '@/lib/recommendations'
import { sendAuditEmail, sendLeadNotificationEmail } from '@/lib/email'
import type { AuditAnswers, AuditScores } from '@/lib/scoring'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 8
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse body ──────────────────────────────────────────────────────
    let body: { auditId: string; fullName: string; email: string; phone: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Corps de la requête invalide (JSON attendu).' },
        { status: 400 },
      )
    }

    const { auditId, fullName, email, phone } = body

    // ── 2. Validation ──────────────────────────────────────────────────────
    const errors: string[] = []
    if (!auditId?.trim())                    errors.push('auditId manquant.')
    if (!fullName?.trim())                   errors.push('Le nom complet est requis.')
    if (!email?.trim() || !isValidEmail(email)) errors.push('Adresse email invalide.')
    if (!phone?.trim() || !isValidPhone(phone)) errors.push('Numéro de téléphone invalide.')

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 422 })
    }

    // ── 3. Récupérer l'audit ───────────────────────────────────────────────
    const existingAudit = await prisma.audit.findUnique({
      where: { id: auditId },
    })

    if (!existingAudit) {
      return NextResponse.json(
        { error: 'Audit introuvable. Veuillez refaire le questionnaire.' },
        { status: 404 },
      )
    }

    // ── 4. Mettre à jour en DB ─────────────────────────────────────────────
    const updatedAudit = await prisma.audit.update({
      where: { id: auditId },
      data: {
        fullName:   fullName.trim(),
        email:      email.trim().toLowerCase(),
        phone:      phone.trim(),
        isUnlocked: true,
      },
    })

    // ── 5. Générer les recommandations ─────────────────────────────────────
    const answers = existingAudit.answersJSON as unknown as AuditAnswers
    const scores: AuditScores = {
      global:   existingAudit.scoreGlobal,
      social:   existingAudit.scoreSocial,
      web:      existingAudit.scoreWeb,
      gbp:      existingAudit.scoreGBP,
      funnel:   existingAudit.scoreFunnel,
      branding: existingAudit.scoreBranding,
    }
    const recommendations = generateRecommendations(answers, scores, 3)

    // ── 6. Envoi des emails (non-bloquant) ─────────────────────────────────
    void Promise.allSettled([
      sendAuditEmail({
        to:           email.trim().toLowerCase(),
        fullName:     fullName.trim(),
        businessName: existingAudit.businessName,
        city:         existingAudit.city ?? undefined,
        auditId,
        scoreGlobal:   scores.global,
        scoreSocial:   scores.social,
        scoreWeb:      scores.web,
        scoreGBP:      scores.gbp,
        scoreFunnel:   scores.funnel,
        scoreBranding: scores.branding,
        recommendations,
      }).catch((e) => console.error('[unlock] sendAuditEmail error:', e)),

      sendLeadNotificationEmail({
        fullName:     fullName.trim(),
        email:        email.trim().toLowerCase(),
        phone:        phone.trim(),
        businessName: existingAudit.businessName,
        city:         existingAudit.city ?? undefined,
        scoreGlobal:  scores.global,
        auditId,
      }).catch((e) => console.error('[unlock] sendLeadNotificationEmail error:', e)),
    ])

    // ── 7. Réponse ─────────────────────────────────────────────────────────
    return NextResponse.json({
      audit: {
        id:           updatedAudit.id,
        businessName: updatedAudit.businessName,
        city:         updatedAudit.city,
        sector:       updatedAudit.sector,
        activityType: updatedAudit.activityType,
        scoreGlobal:  updatedAudit.scoreGlobal,
        scoreSocial:  updatedAudit.scoreSocial,
        scoreWeb:     updatedAudit.scoreWeb,
        scoreGBP:     updatedAudit.scoreGBP,
        scoreFunnel:  updatedAudit.scoreFunnel,
        scoreBranding: updatedAudit.scoreBranding,
        isUnlocked:   true,
        fullName:     updatedAudit.fullName,
        email:        updatedAudit.email,
        phone:        updatedAudit.phone,
      },
      recommendations,
    })
  } catch (err) {
    console.error('[/api/audit/unlock]', err)
    return NextResponse.json(
      { error: 'Erreur serveur. Veuillez réessayer.' },
      { status: 500 },
    )
  }
}

// ─── GET — récupérer un audit par ID (utilisé par /audit/result) ──────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })
  }

  const audit = await prisma.audit.findUnique({ where: { id } })
  if (!audit) {
    return NextResponse.json({ error: 'Audit introuvable.' }, { status: 404 })
  }

  // Ne jamais exposer les données lead si non débloqué
  const publicAudit = audit.isUnlocked
    ? {
        id: audit.id,
        businessName: audit.businessName,
        city: audit.city,
        sector: audit.sector,
        activityType: audit.activityType,
        scoreGlobal: audit.scoreGlobal,
        scoreSocial: audit.scoreSocial,
        scoreWeb: audit.scoreWeb,
        scoreGBP: audit.scoreGBP,
        scoreFunnel: audit.scoreFunnel,
        scoreBranding: audit.scoreBranding,
        isUnlocked: true,
        fullName: audit.fullName,
        email: audit.email,
        phone: audit.phone,
      }
    : {
        id: audit.id,
        businessName: audit.businessName,
        city: audit.city,
        sector: audit.sector,
        activityType: audit.activityType,
        scoreGlobal: audit.scoreGlobal,
        scoreSocial: audit.scoreSocial,
        scoreWeb: audit.scoreWeb,
        scoreGBP: audit.scoreGBP,
        scoreFunnel: audit.scoreFunnel,
        scoreBranding: audit.scoreBranding,
        isUnlocked: false,
      }

  // Regénérer les recommandations si débloqué
  let recommendations = []
  if (audit.isUnlocked && audit.answersJSON) {
    try {
      const answers = audit.answersJSON as unknown as AuditAnswers
      const scores: AuditScores = {
        global: audit.scoreGlobal, social: audit.scoreSocial, web: audit.scoreWeb,
        gbp: audit.scoreGBP, funnel: audit.scoreFunnel, branding: audit.scoreBranding,
      }
      recommendations = generateRecommendations(answers, scores, 3) as never[]
    } catch {
      // silencieux
    }
  }

  return NextResponse.json({ audit: publicAudit, recommendations })
}