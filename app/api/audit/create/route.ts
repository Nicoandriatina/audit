
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateScores, type AuditAnswers } from '@/lib/scoring'

// ─── POST ─────────────────────────────────────────────────────────────────────

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

    // ── 2. Validation minimale ─────────────────────────────────────────────
    const { qualification } = body
    if (!qualification?.businessName?.trim()) {
      return NextResponse.json(
        { error: 'Le nom de l\'entreprise est requis.' },
        { status: 422 },
      )
    }
    if (!qualification?.activityType || !['B2B', 'B2C'].includes(qualification.activityType)) {
      return NextResponse.json(
        { error: 'Le type d\'activité (B2B / B2C) est requis.' },
        { status: 422 },
      )
    }

    // ── 3. Calcul des scores ───────────────────────────────────────────────
    const scores = calculateScores(body)

    // ── 4. Persistance Prisma ──────────────────────────────────────────────
    const audit = await prisma.audit.create({
      data: {
        businessName: qualification.businessName.trim(),
        city:         qualification.city?.trim() ?? '',
        sector:       qualification.sector?.trim() ?? '',
        activityType: qualification.activityType,

        scoreGlobal:   scores.global,
        scoreSocial:   scores.social,
        scoreWeb:      scores.web,
        scoreGBP:      scores.gbp,
        scoreFunnel:   scores.funnel,
        scoreBranding: scores.branding,

        answersJSON: body as object,
        isUnlocked:  false,
      },
    })

    // ── 5. Réponse ─────────────────────────────────────────────────────────
    return NextResponse.json(
      {
        auditId: audit.id,
        scores: {
          global:   scores.global,
          social:   scores.social,
          web:      scores.web,
          gbp:      scores.gbp,
          funnel:   scores.funnel,
          branding: scores.branding,
        },
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

// ─── Prisma schema attendu ────────────────────────────────────────────────────
/*
  Ajouter dans prisma/schema.prisma :

  model Audit {
    id            String   @id @default(cuid())
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    // Qualification
    businessName  String
    city          String   @default("")
    sector        String   @default("")
    activityType  String   // "B2B" | "B2C"

    // Scores
    scoreGlobal   Int
    scoreSocial   Int
    scoreWeb      Int
    scoreGBP      Int
    scoreFunnel   Int
    scoreBranding Int

    // Lead (rempli lors du unlock)
    fullName      String?
    email         String?
    phone         String?
    isUnlocked    Boolean  @default(false)

    // Données brutes
    answersJSON   Json

    // PDF
    pdfUrl        String?
  }
*/