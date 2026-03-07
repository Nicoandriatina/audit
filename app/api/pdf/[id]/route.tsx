
/**
 * app/api/pdf/[id]/route.ts
 * GET /api/pdf/[id]
 *
 * Génère et retourne le rapport PDF complet de l'audit.
 * Moteur : @react-pdf/renderer (server-side, no DOM required)
 * Dépendances : npm install @react-pdf/renderer
 *
 * ⚠️  Cette route doit être en Node.js runtime (pas Edge) car
 *     @react-pdf/renderer requiert le module `canvas` et `fs`.
 *
 * Réponse : application/pdf avec headers de téléchargement.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRecommendations } from '@/lib/recommendations'
import { getScoreLevel, SCORE_LABELS, SCORE_MESSAGES } from '@/lib/scoring'
import type { AuditAnswers, AuditScores } from '@/lib/scoring'
import type { Recommendation } from '@/components/audit/Recommendations'

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
  Svg,
  Circle,
  Rect,
  Line,
  Polygon,
} from '@react-pdf/renderer'

// ─── Fonts ────────────────────────────────────────────────────────────────────
// @react-pdf ne peut pas charger Google Fonts en runtime — on utilise Helvetica
// (intégrée dans PDFKit) et on simule Syne avec Bold.
// Pour intégrer des fonts custom : ajouter les .ttf dans /public/fonts/ et
// décommenter les lignes Font.register ci-dessous.

/*
Font.register({
  family: 'Syne',
  fonts: [
    { src: '/fonts/Syne-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Syne-Bold.ttf',    fontWeight: 700 },
    { src: '/fonts/Syne-ExtraBold.ttf', fontWeight: 800 },
  ],
})
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf',  fontWeight: 400 },
    { src: '/fonts/Inter-Medium.ttf',   fontWeight: 500 },
    { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 600 },
  ],
})
*/

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  navy:       '#050A34',
  blue:       '#085CF0',
  blueLight:  '#AFE9FD',
  cream:      '#F5F0E8',
  cream2:     '#EDE8DF',
  white:      '#FFFFFF',
  textMuted:  '#7A82A0',
  border:     'rgba(9,38,118,0.12)',
  red:        '#E03131',
  orange:     '#E8890C',
  green:      '#2B9348',
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function scoreColor(score: number, max = 100): string {
  const pct = (score / max) * 100
  if (pct < 40) return C.red
  if (pct < 65) return C.orange
  return C.green
}

function scoreLabel(score: number, max = 100): string {
  const pct = (score / max) * 100
  if (pct < 40) return 'Faible'
  if (pct < 65) return 'Moyen'
  return 'Bon'
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Pages
  page: {
    backgroundColor: C.cream,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.navy,
  },

  // ── Cover page ─────────────────────────────────────────────────────────────
  coverPage: {
    backgroundColor: C.navy,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  coverTop: {
    flex: 1,
    padding: '60 56 40',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  coverBadge: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: C.blueLight,
    marginBottom: 28,
    fontFamily: 'Helvetica',
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    lineHeight: 1.1,
    marginBottom: 6,
  },
  coverSubtitle: {
    fontSize: 14,
    color: C.blueLight,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
    opacity: 0.8,
  },
  coverDesc: {
    fontSize: 11,
    color: 'rgba(175,233,253,0.6)',
    lineHeight: 1.6,
    maxWidth: 420,
  },
  coverBottom: {
    borderTop: `1 solid rgba(175,233,253,0.12)`,
    padding: '24 56',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverBottomText: {
    fontSize: 9,
    color: 'rgba(175,233,253,0.4)',
  },

  // ── Score band ─────────────────────────────────────────────────────────────
  scoreBand: {
    backgroundColor: C.navy,
    padding: '40 56 40',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  scoreRingWrap: {
    width: 90,
    height: 90,
    flexShrink: 0,
    position: 'relative',
  },
  scoreInfo: {
    flex: 1,
  },
  scorePill: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: 'auto',
    alignSelf: 'flex-start',
  },
  scorePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  scoreHeadline: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    lineHeight: 1.2,
    marginBottom: 10,
  },
  scoreDesc: {
    fontSize: 10,
    color: 'rgba(175,233,253,0.6)',
    lineHeight: 1.6,
    maxWidth: 380,
  },

  // ── Section headers ────────────────────────────────────────────────────────
  sectionWrap: {
    padding: '0 56 0',
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 32,
    paddingBottom: 10,
    borderBottom: `1 solid ${C.cream2}`,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.blue,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#092676',
  },

  // ── Pilier bars ────────────────────────────────────────────────────────────
  pilierRow: {
    marginBottom: 16,
  },
  pilierTopRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pilierName: {
    fontSize: 11,
    color: C.navy,
    fontFamily: 'Helvetica',
  },
  pilierScore: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
  },
  barTrack: {
    height: 6,
    backgroundColor: C.cream2,
    borderRadius: 3,
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },

  // ── Reco cards ─────────────────────────────────────────────────────────────
  recoCard: {
    backgroundColor: C.white,
    borderRadius: 10,
    padding: '14 18',
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'row',
    gap: 14,
    border: `1 solid ${C.cream2}`,
  },
  recoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recoBadgeText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  recoBody: {
    flex: 1,
  },
  recoProblem: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  recoImpact: {
    fontSize: 9.5,
    color: C.textMuted,
    marginBottom: 6,
    lineHeight: 1.5,
  },
  recoAction: {
    fontSize: 9.5,
    color: C.blue,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.4,
  },
  recoPillarTag: {
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  // ── Tags grid ─────────────────────────────────────────────────────────────
  tagWrap: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagGreen: {
    backgroundColor: 'rgba(43,147,72,0.08)',
    borderRadius: 100,
    padding: '4 12',
    fontSize: 9,
    color: C.green,
    fontFamily: 'Helvetica-Bold',
  },
  tagRed: {
    backgroundColor: 'rgba(224,49,49,0.06)',
    borderRadius: 100,
    padding: '4 12',
    fontSize: 9,
    color: C.red,
    fontFamily: 'Helvetica-Bold',
  },

  // ── 2-col layout ──────────────────────────────────────────────────────────
  twoCol: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    padding: '0 56',
    marginTop: 16,
  },
  col50: { flex: 1 },

  // ── CTA footer ─────────────────────────────────────────────────────────────
  ctaBox: {
    backgroundColor: C.navy,
    margin: '32 56 0',
    borderRadius: 12,
    padding: '28 32',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSub: {
    fontSize: 10,
    color: 'rgba(175,233,253,0.6)',
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: 16,
    maxWidth: 380,
  },
  ctaLink: {
    fontSize: 10,
    color: C.blueLight,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },

  // ── Page footer ─────────────────────────────────────────────────────────────
  pageFooter: {
    position: 'absolute',
    bottom: 24,
    left: 56,
    right: 56,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1 solid ${C.cream2}`,
    paddingTop: 10,
  },
  pageFooterText: {
    fontSize: 8,
    color: C.textMuted,
  },
  pageFooterNum: {
    fontSize: 8,
    color: C.textMuted,
  },

  // ── Spacer ─────────────────────────────────────────────────────────────────
  spacer: { marginBottom: 16 },
  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: '20 24',
    border: `1 solid ${C.cream2}`,
  },
})

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Anneau score SVG */
function ScoreRing({
  score,
  color,
}: {
  score: number
  color: string
}) {
  const R = 38
  const CIRC = 2 * Math.PI * R
  const offset = CIRC - (score / 100) * CIRC
  return (
    <View style={{ width: 90, height: 90, position: 'relative' }}>
      <Svg viewBox="0 0 90 90" width={90} height={90}>
        {/* Track */}
        <Circle
          cx="45" cy="45" r={R}
          fill="none"
          stroke="rgba(175,233,253,0.1)"
          strokeWidth="6"
        />
        {/* Fill — @react-pdf ne supporte pas strokeDashoffset,
            on dessine donc un arc approximé par segments */}
        <Circle
          cx="45" cy="45" r={R}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${CIRC - offset} ${offset}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
        />
      </Svg>
      {/* Texte centré */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.white, lineHeight: 1 }}>
          {score}
        </Text>
        <Text style={{ fontSize: 9, color: 'rgba(175,233,253,0.4)' }}>/100</Text>
      </View>
    </View>
  )
}

/** Barre de progression */
function PilierBar({
  name,
  score,
  max = 20,
}: {
  name: string
  score: number
  max?: number
}) {
  const pct = Math.round((score / max) * 100)
  const color = scoreColor(score, max)

  return (
    <View style={styles.pilierRow}>
      <View style={styles.pilierTopRow}>
        <Text style={styles.pilierName}>{name}</Text>
        <Text style={[styles.pilierScore, { color }]}>
          {score}/{max}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

/** Carte de recommandation */
function RecoCard({
  reco,
  index,
}: {
  reco: Recommendation
  index: number
}) {
  const configs = [
    { bg: 'rgba(224,49,49,0.08)', color: C.red,    label: 'P1' },
    { bg: 'rgba(232,137,12,0.08)', color: C.orange, label: 'P2' },
    { bg: 'rgba(8,92,240,0.08)',  color: C.blue,   label: 'P3' },
  ]
  const cfg = configs[index] ?? configs[2]

  return (
    <View style={styles.recoCard}>
      <View style={[styles.recoBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.recoBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
      <View style={styles.recoBody}>
        <Text style={[styles.recoPillarTag, { color: cfg.color }]}>
          {reco.pillar}
        </Text>
        <Text style={styles.recoProblem}>{reco.problem}</Text>
        <Text style={styles.recoImpact}>Impact : {reco.businessImpact}</Text>
        <Text style={styles.recoAction}>→ {reco.action}</Text>
      </View>
    </View>
  )
}

/** Footer de page */
function PageFooter({ label, pageNum }: { label?: string; pageNum: string }) {
  const now = new Date().toLocaleDateString('fr-CH', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  return (
    <View style={styles.pageFooter} fixed>
      <Text style={styles.pageFooterText}>
        Cabinet Stratège · Audit Digital {label ? `— ${label}` : ''} · {now}
      </Text>
      <Text style={styles.pageFooterNum}>{pageNum}</Text>
    </View>
  )
}

/** Entête de section */
function SectionHeader({ title, color = C.blue }: { title: string; color?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      <Text style={[styles.sectionTitle, { color: color === C.blue ? '#092676' : color }]}>
        {title}
      </Text>
    </View>
  )
}

// ─── Document principal ────────────────────────────────────────────────────────

interface AuditPDFProps {
  businessName: string
  city:         string
  sector:       string
  activityType: string
  scoreGlobal:  number
  scoreSocial:  number
  scoreWeb:     number
  scoreGBP:     number
  scoreFunnel:  number
  scoreBranding: number
  recommendations: Recommendation[]
  strengths:    string[]
  weaknesses:   string[]
  calLink:      string
  resultUrl:    string
}

function AuditPDF(props: AuditPDFProps) {
  const {
    businessName, city, sector, activityType,
    scoreGlobal, scoreSocial, scoreWeb, scoreGBP, scoreFunnel, scoreBranding,
    recommendations, strengths, weaknesses,
    calLink, resultUrl,
  } = props

  const level      = getScoreLevel(scoreGlobal)
  const levelLabel = SCORE_LABELS[level]
  const levelMsg   = SCORE_MESSAGES[level]
  const globalColor = scoreColor(scoreGlobal)

  const piliers = [
    { name: 'Réseaux sociaux',      score: scoreSocial   },
    { name: 'Présence Web & SEO',   score: scoreWeb      },
    { name: 'Google Business',      score: scoreGBP      },
    { name: 'Acquisition & Funnel', score: scoreFunnel   },
    { name: 'Branding & Crédibilité', score: scoreBranding },
  ]

  const dateStr = new Date().toLocaleDateString('fr-CH', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <Document
      title={`Audit Digital — ${businessName}`}
      author="Cabinet Stratège"
      subject="Rapport d'audit digital personnalisé"
      keywords="audit, digital, SEO, réseaux sociaux, Google Business"
      creator="Cabinet Stratège"
    >

      {/* ══════════════════════════════════════
          PAGE 1 — COVER
      ══════════════════════════════════════ */}
      <Page size="A4" style={styles.coverPage}>

        {/* Top decorative band */}
        <View style={{ height: 4, backgroundColor: C.blue }} />

        {/* Main cover content */}
        <View style={styles.coverTop}>

          {/* Logo + brand */}
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 56, gap: 10 }}>
            <View style={{
              width: 36, height: 36, backgroundColor: C.blue, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: 'white', fontSize: 14, fontFamily: 'Helvetica-Bold' }}>CS</Text>
            </View>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.6 }}>
              CABINET STRATÈGE
            </Text>
          </View>

          {/* Badge */}
          <Text style={styles.coverBadge}>Audit Digital — Rapport Personnalisé</Text>

          {/* Business name */}
          <Text style={styles.coverTitle}>{businessName}</Text>
          {city && (
            <Text style={styles.coverSubtitle}>{city}{sector ? ` · ${sector}` : ''}</Text>
          )}

          <Text style={styles.coverDesc}>
            Ce rapport présente l'analyse complète de votre présence digitale sur 5 piliers
            stratégiques. Il inclut votre score global /100, l'évaluation détaillée par axe
            et vos 3 priorités d'action immédiates.
          </Text>

          {/* Score teaser */}
          <View style={{
            marginTop: 48,
            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 20,
            backgroundColor: 'rgba(8,92,240,0.15)',
            borderRadius: 12, padding: '20 28',
            border: `1 solid rgba(8,92,240,0.3)`,
            alignSelf: 'flex-start',
          }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 52, fontFamily: 'Helvetica-Bold', color: globalColor, lineHeight: 1 }}>
                {scoreGlobal}
              </Text>
              <Text style={{ fontSize: 16, color: 'rgba(175,233,253,0.4)', fontFamily: 'Helvetica' }}>
                /100
              </Text>
            </View>
            <View>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: globalColor }} />
                <Text style={{ fontSize: 11, color: globalColor, fontFamily: 'Helvetica-Bold' }}>
                  {levelLabel}
                </Text>
              </View>
              <Text style={{ fontSize: 10, color: 'rgba(175,233,253,0.55)', maxWidth: 220, lineHeight: 1.5 }}>
                {levelMsg}
              </Text>
            </View>
          </View>
        </View>

        {/* Cover footer */}
        <View style={styles.coverBottom}>
          <Text style={styles.coverBottomText}>cabinet-stratege.ch</Text>
          <Text style={styles.coverBottomText}>
            Confidentiel · {dateStr}
          </Text>
          <Text style={styles.coverBottomText}>{activityType} · {sector || 'Tout secteur'}</Text>
        </View>
      </Page>

      {/* ══════════════════════════════════════
          PAGE 2 — SCORES
      ══════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>

        {/* Score hero band */}
        <View style={styles.scoreBand}>
          <ScoreRing score={scoreGlobal} color={globalColor} />
          <View style={styles.scoreInfo}>
            <View style={styles.scorePill}>
              <View style={[styles.scorePillDot, { backgroundColor: globalColor }]} />
              <Text style={{ fontSize: 9, color: globalColor, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 }}>
                {levelLabel}
              </Text>
            </View>
            <Text style={styles.scoreHeadline}>Score digital : {scoreGlobal}/100</Text>
            <Text style={styles.scoreDesc}>{levelMsg}</Text>
          </View>
        </View>

        {/* Piliers section */}
        <View style={styles.sectionWrap}>
          <SectionHeader title="Score par pilier" />

          {/* Barre de chaque pilier */}
          {piliers.map((p) => (
            <PilierBar key={p.name} name={p.name} score={p.score} max={20} />
          ))}
        </View>

        {/* Points forts / Axes d'amélioration */}
        <View style={styles.twoCol}>
          {/* Points forts */}
          <View style={[styles.col50, styles.card]}>
            <SectionHeader title="Points forts" color={C.green} />
            <View style={styles.tagWrap}>
              {strengths.length > 0
                ? strengths.map((s, i) => (
                    <Text key={i} style={styles.tagGreen}>{s}</Text>
                  ))
                : <Text style={{ fontSize: 10, color: C.textMuted }}>Aucun point fort détecté</Text>
              }
            </View>
          </View>

          {/* Axes */}
          <View style={[styles.col50, styles.card]}>
            <SectionHeader title="Axes d'amélioration" color={C.red} />
            <View style={styles.tagWrap}>
              {weaknesses.length > 0
                ? weaknesses.map((w, i) => (
                    <Text key={i} style={styles.tagRed}>{w}</Text>
                  ))
                : <Text style={{ fontSize: 10, color: C.textMuted }}>Aucun axe critique</Text>
              }
            </View>
          </View>
        </View>

        <PageFooter label={businessName} pageNum="2" />
      </Page>

      {/* ══════════════════════════════════════
          PAGE 3 — RECOMMANDATIONS
      ══════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>

        {/* Page header */}
        <View style={{
          backgroundColor: C.navy,
          padding: '28 56 24',
          borderBottom: `3 solid ${C.blue}`,
        }}>
          <Text style={{
            fontSize: 9, letterSpacing: 1, textTransform: 'uppercase',
            color: 'rgba(175,233,253,0.5)', marginBottom: 6, fontFamily: 'Helvetica',
          }}>
            Recommandations prioritaires
          </Text>
          <Text style={{
            fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.white, lineHeight: 1.2,
          }}>
            Vos 3 actions immédiates
          </Text>
          <Text style={{
            fontSize: 10, color: 'rgba(175,233,253,0.55)', marginTop: 8, lineHeight: 1.6,
          }}>
            Ces recommandations ont été générées en fonction de vos réponses et de vos scores.{'\n'}
            Elles sont classées par ordre d'impact business décroissant.
          </Text>
        </View>

        {/* Reco cards */}
        <View style={{ padding: '24 56 0' }}>
          {recommendations.length > 0
            ? recommendations.map((r, i) => (
                <RecoCard key={i} reco={r} index={i} />
              ))
            : (
              <View style={[styles.card, { padding: '20 24' }]}>
                <Text style={{ fontSize: 12, color: C.textMuted, textAlign: 'center' }}>
                  Pas de recommandation critique — votre présence digitale est bien établie !
                </Text>
              </View>
            )
          }
        </View>

        {/* Pilier scores quick recap */}
        <View style={{ padding: '24 56 0' }}>
          <SectionHeader title="Récapitulatif des scores" />
          <View style={{
            display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8,
          }}>
            {piliers.map((p) => {
              const color = scoreColor(p.score, 20)
              const lbl = scoreLabel(p.score, 20)
              return (
                <View key={p.name} style={{
                  backgroundColor: C.white, borderRadius: 10, padding: '10 16',
                  border: `1 solid ${C.cream2}`, flexDirection: 'row',
                  alignItems: 'center', gap: 10,
                  width: '47%',
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, color: C.textMuted, marginBottom: 2 }}>{p.name}</Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color }}>
                      {p.score}/20
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: `${color}15`,
                    borderRadius: 100, padding: '3 10',
                  }}>
                    <Text style={{ fontSize: 8, color, fontFamily: 'Helvetica-Bold' }}>{lbl}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        {/* CTA box */}
        <View style={styles.ctaBox}>
          <Text style={styles.ctaTitle}>Passez à l'action avec un expert</Text>
          <Text style={styles.ctaSub}>
            Réservez 30 minutes gratuites avec un consultant Cabinet Stratège pour transformer
            ce diagnostic en plan d'action concret et mesurable.
          </Text>
          <Text style={styles.ctaLink}>{calLink}</Text>
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 9, color: 'rgba(175,233,253,0.35)', textAlign: 'center' }}>
              Rapport complet en ligne : {resultUrl}
            </Text>
          </View>
        </View>

        <PageFooter label={businessName} pageNum="3" />
      </Page>

    </Document>
  )
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ⚠️ Next.js 16 : params est une Promise
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })
  }

  // ── 1. Récupérer l'audit en DB ─────────────────────────────────────────────
  let audit: Awaited<ReturnType<typeof prisma.audit.findUnique>>
  try {
    audit = await prisma.audit.findUnique({ where: { id } })
  } catch (err) {
    console.error('[/api/pdf] Prisma error:', err)
    return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 })
  }

  if (!audit) {
    return NextResponse.json({ error: 'Audit introuvable.' }, { status: 404 })
  }

  if (!audit.isUnlocked) {
    return NextResponse.json(
      { error: 'Rapport non débloqué. Veuillez soumettre vos coordonnées.' },
      { status: 403 },
    )
  }

  // ── 2. Générer les recommandations ─────────────────────────────────────────
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
    console.error('[/api/pdf] Recommendations error:', err)
  }

  // ── 3. Dériver les tags points forts / axes ────────────────────────────────
  const { strengths, weaknesses } = deriveTagsFromScores({
    global:   audit.scoreGlobal,
    social:   audit.scoreSocial,
    web:      audit.scoreWeb,
    gbp:      audit.scoreGBP,
    funnel:   audit.scoreFunnel,
    branding: audit.scoreBranding,
  })

  // ── 4. Générer le PDF ──────────────────────────────────────────────────────
  const APP_URL  = process.env.NEXT_PUBLIC_APP_URL  ?? 'http://localhost:3000'
  const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK ?? 'https://cal.com/cabinet-stratege'

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderToBuffer(
      React.createElement(AuditPDF, {
        businessName:  audit.businessName,
        city:          audit.city   ?? '',
        sector:        audit.sector ?? '',
        activityType:  audit.activityType,
        scoreGlobal:   audit.scoreGlobal,
        scoreSocial:   audit.scoreSocial,
        scoreWeb:      audit.scoreWeb,
        scoreGBP:      audit.scoreGBP,
        scoreFunnel:   audit.scoreFunnel,
        scoreBranding: audit.scoreBranding,
        recommendations,
        strengths,
        weaknesses,
        calLink:    CAL_LINK,
        resultUrl:  `${APP_URL}/audit/result?id=${id}`,
      }),
    )
  } catch (err) {
    console.error('[/api/pdf] renderToBuffer error:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF.' },
      { status: 500 },
    )
  }

  // ── 5. Sanitize filename ───────────────────────────────────────────────────
  const safeName = audit.businessName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40)

  const filename = `audit-digital-${safeName}-${id.slice(0, 8)}.pdf`

  // ── 6. Retourner le PDF ────────────────────────────────────────────────────
  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(pdfBuffer.length),
      'Cache-Control':       'private, no-store',
    },
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveTagsFromScores(scores: AuditScores): {
  strengths: string[]
  weaknesses: string[]
} {
  const strengths:  string[] = []
  const weaknesses: string[] = []

  const pilierConfig = [
    {
      key:    'social' as keyof AuditScores,
      strong: ['Présence réseaux active', 'Bonne fréquence de publication'],
      weak:   ['Réseaux sociaux inactifs', 'Pas de présence sociale'],
    },
    {
      key:    'web' as keyof AuditScores,
      strong: ['Site web performant', 'Mobile-friendly'],
      weak:   ['Pas de site web', 'SEO inexistant'],
    },
    {
      key:    'gbp' as keyof AuditScores,
      strong: ['Fiche Google active', 'Bonne note Google'],
      weak:   ['Pas de fiche Google', 'Peu d\'avis clients'],
    },
    {
      key:    'funnel' as keyof AuditScores,
      strong: ['CTAs visibles', 'Prise de RDV en ligne'],
      weak:   ['Pas de formulaire', 'Pas de CRM'],
    },
    {
      key:    'branding' as keyof AuditScores,
      strong: ['Branding professionnel', 'Preuves sociales visibles'],
      weak:   ['Image non professionnelle', 'Pas de témoignages'],
    },
  ]

  pilierConfig.forEach(({ key, strong, weak }) => {
    const score = scores[key] as number
    if (score >= 14)     strengths.push(...strong)
    else if (score <= 8) weaknesses.push(...weak)
  })

  return {
    strengths:  strengths.slice(0, 6),
    weaknesses: weaknesses.slice(0, 6),
  }
}