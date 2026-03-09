export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRecommendations } from '@/lib/recommendations'
import { getScoreLevel, SCORE_LABELS, SCORE_MESSAGES } from '@/lib/scoring'
import type { AuditAnswers, AuditScores } from '@/lib/scoring'
import type { Recommendation } from '@/components/audit/Recommendations'
import { getSectorTemplate, getSectorPercentile } from '@/lib/sector-templates'
import type { LostClientsEstimate } from '@/lib/lost-clients'
import type { CompetitorsAnalysis, CompetitorResult } from '@/lib/competitors'

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Svg,
  Circle,
} from '@react-pdf/renderer'

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  navy:      '#050A34',
  navyMid:   '#0C1452',
  blue:      '#085CF0',
  blueDeep:  '#0647C2',
  blueLight: '#AFE9FD',
  cream:     '#F5F0E8',
  cream2:    '#EDE8DF',
  white:     '#FFFFFF',
  textMuted: '#7A82A0',
  textDark:  '#1A202C',
  border:    '#E2E8F0',
  red:       '#E03131',
  orange:    '#E8890C',
  green:     '#2B9348',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function fmtCHF(n: number): string {
  if (n >= 1_000_000) return `CHF ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `CHF ${Math.round(n / 1_000)}k`
  return `CHF ${n.toLocaleString('fr-CH')}`
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({

  // ── Pages ──────────────────────────────────────────────────────────────────
  page: {
    backgroundColor: C.cream,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.navy,
    paddingBottom: 56,
  },
  coverPage: {
    backgroundColor: C.navy,
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
  },

  // ── Cover ──────────────────────────────────────────────────────────────────
  coverAccent: { height: 4, backgroundColor: C.blue },
  coverBody: {
    flex: 1, padding: '56 56 40',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  },
  coverLogo: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 60 },
  coverLogoBadge: { width: 38, height: 38, backgroundColor: C.blue, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  coverLogoText: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1 },
  coverEyebrow: { fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: C.blueLight, marginBottom: 14, fontFamily: 'Helvetica', opacity: 0.7 },
  coverTitle: { fontSize: 40, fontFamily: 'Helvetica-Bold', color: C.white, lineHeight: 1.1, marginBottom: 8 },
  coverMeta: { fontSize: 13, color: C.blueLight, fontFamily: 'Helvetica-Bold', marginBottom: 20, opacity: 0.75 },
  coverDesc: { fontSize: 10.5, color: 'rgba(175,233,253,0.55)', lineHeight: 1.7, maxWidth: 400 },
  coverScoreBox: {
    marginTop: 52, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24,
    backgroundColor: 'rgba(8,92,240,0.14)', borderRadius: 14, padding: '22 30',
    border: '1 solid rgba(8,92,240,0.28)', alignSelf: 'flex-start',
  },
  coverScoreNum: { fontSize: 60, fontFamily: 'Helvetica-Bold', lineHeight: 1 },
  coverScoreSub: { fontSize: 16, color: 'rgba(175,233,253,0.35)' },
  coverScorePill: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  coverScoreDot: { width: 7, height: 7, borderRadius: 4 },
  coverScoreLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  coverScoreDesc: { fontSize: 9.5, color: 'rgba(175,233,253,0.5)', maxWidth: 210, lineHeight: 1.6 },
  coverFooter: {
    borderTop: '1 solid rgba(175,233,253,0.1)', padding: '20 56',
    display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  coverFooterText: { fontSize: 8.5, color: 'rgba(175,233,253,0.35)' },

  // ── Page header band (pages 2–4) ──────────────────────────────────────────
  pageHeader: {
    backgroundColor: C.navy, padding: '36 56 30', borderBottom: '3 solid ' + C.blue,
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 28,
  },
  pageHeaderScoreRing: { flexShrink: 0 },
  pageHeaderText: { flex: 1 },
  pageHeaderEyebrow: { fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(175,233,253,0.50)', marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  pageHeaderTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.white, lineHeight: 1.2, marginBottom: 7 },
  pageHeaderSub: { fontSize: 9.5, color: 'rgba(175,233,253,0.55)', lineHeight: 1.65, maxWidth: 380 },

  // ── Section header ────────────────────────────────────────────────────────
  sectionHeader: {
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 9,
    marginBottom: 14, marginTop: 28, paddingBottom: 11, borderBottom: '1 solid ' + C.cream2,
  },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', letterSpacing: 1.1, textTransform: 'uppercase' },

  // ── Content areas ─────────────────────────────────────────────────────────
  body: { padding: '0 56' },
  twoCol: { display: 'flex', flexDirection: 'row', gap: 14, marginTop: 4 },
  col: { flex: 1 },

  // ── Pilier bars ───────────────────────────────────────────────────────────
  pilierRow: { marginBottom: 15 },
  pilierTopRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  pilierName: { fontSize: 10.5, color: C.textDark },
  pilierScore: { fontSize: 10.5, fontFamily: 'Helvetica-Bold' },
  barTrack: { height: 8, backgroundColor: C.cream2, borderRadius: 5 },
  barFill: { height: 8, borderRadius: 5 },

  // ── Tag chips ─────────────────────────────────────────────────────────────
  tagRow: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tagGreen: { backgroundColor: 'rgba(43,147,72,0.09)', borderRadius: 100, padding: '5 12', fontSize: 8.5, color: C.green, fontFamily: 'Helvetica-Bold' },
  tagRed: { backgroundColor: 'rgba(224,49,49,0.07)', borderRadius: 100, padding: '5 12', fontSize: 8.5, color: C.red, fontFamily: 'Helvetica-Bold' },

  // ── White cards ───────────────────────────────────────────────────────────
  card: { backgroundColor: C.white, borderRadius: 12, padding: '18 20', border: '1 solid ' + C.border },
  cardTight: { backgroundColor: C.white, borderRadius: 12, padding: '12 16', border: '1 solid ' + C.border },

  // ── Reco cards ────────────────────────────────────────────────────────────
  recoCard: {
    backgroundColor: C.white, borderRadius: 12, padding: '16 20', marginBottom: 12,
    display: 'flex', flexDirection: 'row', gap: 14, border: '1 solid ' + C.border,
  },
  recoBadge: { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recoBody: { flex: 1 },
  recoPillarTag: { fontSize: 7.5, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  recoProblem: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.textDark, marginBottom: 5, lineHeight: 1.4 },
  recoImpact: { fontSize: 9, color: C.textMuted, marginBottom: 6, lineHeight: 1.5 },
  recoAction: { fontSize: 9.5, color: C.blue, fontFamily: 'Helvetica-Bold', lineHeight: 1.4 },

  // ── Metric chips ──────────────────────────────────────────────────────────
  metricChip: { flex: 1, backgroundColor: C.white, borderRadius: 10, padding: '12 14', border: '1 solid ' + C.border, alignItems: 'center' },
  metricChipValue: { fontSize: 17, fontFamily: 'Helvetica-Bold', lineHeight: 1, marginBottom: 4 },
  metricChipLabel: { fontSize: 8, color: C.textMuted, textAlign: 'center' },

  // ── CTA box ───────────────────────────────────────────────────────────────
  ctaBox: {
    backgroundColor: C.navy, margin: '24 56 0', borderRadius: 14, padding: '26 32',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    border: '1.5 solid rgba(8,92,240,0.25)',
  },
  ctaTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.white, marginBottom: 8, textAlign: 'center' },
  ctaSub: { fontSize: 9.5, color: 'rgba(175,233,253,0.60)', textAlign: 'center', lineHeight: 1.7, marginBottom: 16, maxWidth: 380 },
  ctaLink: { fontSize: 10.5, color: C.blueLight, fontFamily: 'Helvetica-Bold', textDecoration: 'underline' },

  // ── Page footer ───────────────────────────────────────────────────────────
  pageFooter: {
    position: 'absolute', bottom: 20, left: 56, right: 56,
    display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTop: '1 solid ' + C.cream2, paddingTop: 9,
  },
  pageFooterText: { fontSize: 7.5, color: C.textMuted },
  pageFooterNum: { fontSize: 7.5, color: C.textMuted, fontFamily: 'Helvetica-Bold' },
})

// ─── Reusable sub-components ──────────────────────────────────────────────────

function ScoreRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const r = (size / 2) - 5
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(175,233,253,0.1)" strokeWidth="5" />
        <Circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.white, lineHeight: 1 }}>{score}</Text>
        <Text style={{ fontSize: 8, color: 'rgba(175,233,253,0.35)' }}>/100</Text>
      </View>
    </View>
  )
}

function PilierBar({ name, score, max = 20 }: { name: string; score: number; max?: number }) {
  const pct = Math.round((score / max) * 100)
  const color = scoreColor(score, max)
  const lbl = scoreLabel(score, max)
  return (
    <View style={S.pilierRow}>
      <View style={S.pilierTopRow}>
        <Text style={S.pilierName}>{name}</Text>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ backgroundColor: `${color}18`, borderRadius: 100, padding: '2 8' }}>
            <Text style={{ fontSize: 7.5, color, fontFamily: 'Helvetica-Bold' }}>{lbl}</Text>
          </View>
          <Text style={[S.pilierScore, { color }]}>{score}/{max}</Text>
        </View>
      </View>
      <View style={S.barTrack}>
        <View style={[S.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

function RecoCard({ reco, index }: { reco: Recommendation; index: number }) {
  const cfgs = [
    { bg: 'rgba(224,49,49,0.09)',  color: C.red,    label: 'P1' },
    { bg: 'rgba(232,137,12,0.09)', color: C.orange, label: 'P2' },
    { bg: 'rgba(8,92,240,0.09)',   color: C.blue,   label: 'P3' },
  ]
  const cfg = cfgs[index] ?? cfgs[2]
  return (
    <View style={S.recoCard}>
      <View style={[S.recoBadge, { backgroundColor: cfg.bg }]}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: cfg.color }}>{cfg.label}</Text>
      </View>
      <View style={S.recoBody}>
        <Text style={[S.recoPillarTag, { color: cfg.color }]}>{reco.pillar}</Text>
        <Text style={S.recoProblem}>{reco.problem}</Text>
        <Text style={S.recoImpact}>Impact : {reco.businessImpact}</Text>
        <Text style={S.recoAction}>→  {reco.action}</Text>
      </View>
    </View>
  )
}

function SectionHeader({ title, color = C.blue }: { title: string; color?: string }) {
  return (
    <View style={S.sectionHeader}>
      <View style={[S.sectionDot, { backgroundColor: color }]} />
      <Text style={[S.sectionTitle, { color: color === C.blue ? '#092676' : color }]}>{title}</Text>
    </View>
  )
}

function PageFooter({ label, pageNum, total }: { label?: string; pageNum: number; total: number }) {
  const dateStr = new Date().toLocaleDateString('fr-CH', { day: '2-digit', month: 'long', year: 'numeric' })
  return (
    <View style={S.pageFooter} fixed>
      <Text style={S.pageFooterText}>
        Cabinet Stratège · Audit Digital{label ? ` — ${label}` : ''} · {dateStr}
      </Text>
      <Text style={S.pageFooterNum}>{pageNum} / {total}</Text>
    </View>
  )
}

// ─── Types document ───────────────────────────────────────────────────────────

interface SectorBenchmarksPDF {
  avgScore:    number
  topQuartile: number
  median:      number
}

interface LostClientsPDF {
  yearlyLostRevenue:       number
  monthlyLostLeads:        number
  yearlyPotentialGain:     number
  range:                   { low: number; mid: number; high: number }
  estimatedConversionRate: number
  sectorAvgConversionRate: number
}

// v3 — type allégé pour le PDF (on n'a pas besoin des scores piliers dans le PDF)
interface CompetitorsPDF {
  competitors:          Pick<CompetitorResult, 'name' | 'score' | 'rankLabel' | 'rankColor' | 'strengths' | 'weaknesses' | 'delta'>[]
  clientRank:           number
  summary:              string
  gapToLeader:          number
  avgCompetitorScore:   number
}

interface AuditPDFProps {
  businessName:   string
  city:           string
  sector:         string
  activityType:   string
  scoreGlobal:    number
  scoreSocial:    number
  scoreWeb:       number
  scoreGBP:       number
  scoreFunnel:    number
  scoreBranding:  number
  recommendations: Recommendation[]
  strengths:      string[]
  weaknesses:     string[]
  calLink:        string
  resultUrl:      string
  // v2
  sectorPercentile?:  number
  sectorBenchmarks?:  SectorBenchmarksPDF
  lostClients?:       LostClientsPDF
  // v3
  competitors?:       CompetitorsPDF
}

// ─── Document ─────────────────────────────────────────────────────────────────

function AuditPDF(props: AuditPDFProps) {
  const {
    businessName, city, sector, activityType,
    scoreGlobal, scoreSocial, scoreWeb, scoreGBP, scoreFunnel, scoreBranding,
    recommendations, strengths, weaknesses,
    calLink, resultUrl,
    sectorPercentile, sectorBenchmarks, lostClients,
    competitors,
  } = props

  const hasPage3 = sectorPercentile != null || competitors != null
  const hasPage4 = lostClients != null
  const totalPages = hasPage4 ? 4 : hasPage3 ? 3 : 2

  const level       = getScoreLevel(scoreGlobal)
  const levelLabel  = SCORE_LABELS[level]
  const levelMsg    = SCORE_MESSAGES[level]
  const globalColor = scoreColor(scoreGlobal)

  const piliers = [
    { name: 'Réseaux sociaux',        score: scoreSocial   },
    { name: 'Présence Web & SEO',     score: scoreWeb      },
    { name: 'Google Business',        score: scoreGBP      },
    { name: 'Acquisition & Funnel',   score: scoreFunnel   },
    { name: 'Branding & Crédibilité', score: scoreBranding },
  ]

  const dateStr = new Date().toLocaleDateString('fr-CH', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <Document
      title={`Audit Digital — ${businessName}`}
      author="Cabinet Stratège"
      subject="Rapport d'audit digital personnalisé"
      creator="Cabinet Stratège"
    >

      {/* ═══════════════════ PAGE 1 — COUVERTURE ═══════════════════ */}
      <Page size="A4" style={S.coverPage}>
        <View style={S.coverAccent} />
        <View style={S.coverBody}>
          <View>
            <View style={S.coverLogo}>
              <View style={S.coverLogoBadge}>
                <Text style={{ color: C.white, fontSize: 13, fontFamily: 'Helvetica-Bold' }}>CS</Text>
              </View>
              <Text style={S.coverLogoText}>CABINET STRATÈGE</Text>
            </View>
            <Text style={S.coverEyebrow}>Audit Digital — Rapport Personnalisé</Text>
            <Text style={S.coverTitle}>{businessName}</Text>
            {(city || sector) && (
              <Text style={S.coverMeta}>{[city, sector].filter(Boolean).join(' · ')}</Text>
            )}
            <Text style={S.coverDesc}>
              Ce rapport présente l'analyse complète de votre présence digitale sur 5 piliers
              stratégiques. Il inclut votre score global /100, l'évaluation détaillée par axe
              et vos {recommendations.length || 3} priorités d'action immédiates.
            </Text>
            <View style={S.coverScoreBox}>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={[S.coverScoreNum, { color: globalColor }]}>{scoreGlobal}</Text>
                <Text style={S.coverScoreSub}>/100</Text>
              </View>
              <View>
                <View style={S.coverScorePill}>
                  <View style={[S.coverScoreDot, { backgroundColor: globalColor }]} />
                  <Text style={[S.coverScoreLabel, { color: globalColor }]}>{levelLabel}</Text>
                </View>
                <Text style={S.coverScoreDesc}>{levelMsg}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={S.coverFooter}>
          <Text style={S.coverFooterText}>cabinet-stratege.ch</Text>
          <Text style={S.coverFooterText}>Confidentiel · {dateStr}</Text>
          <Text style={S.coverFooterText}>{activityType} · {sector || 'Tout secteur'}</Text>
        </View>
      </Page>

      {/* ═══════════════════ PAGE 2 — SCORES & ANALYSE ═══════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.pageHeader}>
          <View style={S.pageHeaderScoreRing}>
            <ScoreRing score={scoreGlobal} color={globalColor} size={80} />
          </View>
          <View style={S.pageHeaderText}>
            <Text style={S.pageHeaderEyebrow}>Score de présence digitale</Text>
            <Text style={S.pageHeaderTitle}>Score global : {scoreGlobal}/100</Text>
            <Text style={S.pageHeaderSub}>{levelMsg}</Text>
          </View>
          <View style={{ backgroundColor: `${globalColor}18`, borderRadius: 100, padding: '6 16', alignSelf: 'center', flexShrink: 0 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: globalColor }}>{levelLabel}</Text>
          </View>
        </View>

        <View style={S.body}>
          <SectionHeader title="Score par pilier" />
          {piliers.map((p) => <PilierBar key={p.name} name={p.name} score={p.score} max={20} />)}
        </View>

        <View style={[S.twoCol, { paddingHorizontal: 56, marginTop: 6 }]}>
          <View style={[S.col, S.card]}>
            <SectionHeader title="Points forts" color={C.green} />
            <View style={S.tagRow}>
              {strengths.length > 0
                ? strengths.map((s, i) => <Text key={i} style={S.tagGreen}>{s}</Text>)
                : <Text style={{ fontSize: 9.5, color: C.textMuted }}>Aucun point fort détecté</Text>
              }
            </View>
          </View>
          <View style={[S.col, S.card]}>
            <SectionHeader title="Axes d'amélioration" color={C.red} />
            <View style={S.tagRow}>
              {weaknesses.length > 0
                ? weaknesses.map((w, i) => <Text key={i} style={S.tagRed}>{w}</Text>)
                : <Text style={{ fontSize: 9.5, color: C.textMuted }}>Aucun axe critique</Text>
              }
            </View>
          </View>
        </View>

        <PageFooter label={businessName} pageNum={2} total={totalPages} />
      </Page>

      {/* ═══════════════════ PAGE 3 — BENCHMARK SECTORIEL & CONCURRENTS ═══════════════════ */}
      {hasPage3 && (
        <Page size="A4" style={S.page}>

          {/* ── HEADER ── */}
          <View style={[S.pageHeader, { gap: 0 }]}>
            <View>
              <Text style={S.pageHeaderEyebrow}>Analyse sectorielle & concurrentielle</Text>
              <Text style={S.pageHeaderTitle}>Position & Concurrents locaux</Text>
              <Text style={S.pageHeaderSub}>
                Comparaison avec votre secteur et positionnement face à vos concurrents locaux.
              </Text>
            </View>
          </View>

          {/* ── BENCHMARK SECTORIEL ── */}
          {sectorPercentile != null && sectorBenchmarks != null && (() => {
            const pct = sectorPercentile
            const benchColor =
              pct >= 75 ? C.green :
              pct >= 50 ? C.blue  :
              pct >= 25 ? C.orange : C.red
            const benchLabel =
              pct >= 75
                ? `Top ${100 - pct}% de votre secteur`
                : `Meilleur que ${pct}% des entreprises du secteur`

            return (
              <View style={S.body}>
                <SectionHeader title="Benchmark sectoriel" />
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 10, color: C.textMuted }}>Position dans votre secteur</Text>
                  <View style={{ backgroundColor: `${benchColor}15`, borderRadius: 100, padding: '4 12' }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: benchColor }}>{benchLabel}</Text>
                  </View>
                </View>
                <View style={{ marginBottom: 6 }}>
                  <View style={{ height: 12, backgroundColor: C.cream2, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                    <View style={{ position: 'absolute', left: 0,    top: 0, height: '100%', width: '25%', backgroundColor: 'rgba(224,49,49,0.12)' }} />
                    <View style={{ position: 'absolute', left: '25%', top: 0, height: '100%', width: '25%', backgroundColor: 'rgba(232,137,12,0.12)' }} />
                    <View style={{ position: 'absolute', left: '50%', top: 0, height: '100%', width: '25%', backgroundColor: 'rgba(8,92,240,0.10)' }} />
                    <View style={{ position: 'absolute', left: '75%', top: 0, height: '100%', width: '25%', backgroundColor: 'rgba(43,147,72,0.12)' }} />
                    <View style={{ position: 'absolute', left: 0, top: 2, bottom: 2, width: `${Math.min(98, pct)}%`, backgroundColor: benchColor, borderRadius: 4 }} />
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                    <Text style={{ fontSize: 7.5, color: C.textMuted }}>Bas du marché</Text>
                    <Text style={{ fontSize: 7.5, color: C.textMuted }}>Médian</Text>
                    <Text style={{ fontSize: 7.5, color: C.textMuted }}>Top 25%</Text>
                  </View>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  {[
                    { label: 'Votre score',     value: scoreGlobal,                   color: benchColor, highlight: true },
                    { label: 'Moyenne secteur', value: sectorBenchmarks.avgScore,     color: C.orange },
                    { label: 'Top 25% secteur', value: sectorBenchmarks.topQuartile,  color: C.green },
                  ].map((chip) => (
                    <View key={chip.label} style={[S.metricChip, chip.highlight ? { border: `1.5 solid ${chip.color}` } : {}]}>
                      <Text style={[S.metricChipValue, { color: chip.color }]}>
                        {chip.value}<Text style={{ fontSize: 9, fontFamily: 'Helvetica', color: C.textMuted }}>/100</Text>
                      </Text>
                      <Text style={S.metricChipLabel}>{chip.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )
          })()}

          {/* ── CONCURRENTS LOCAUX (v3) ── */}
          {competitors != null && (() => {
            const { competitors: list, clientRank, summary, gapToLeader, avgCompetitorScore } = competitors

            const rankColor =
              clientRank === 1 ? C.green :
              clientRank <= 2  ? C.orange : C.red
            const rankLabel =
              clientRank === 1
                ? `1er de votre marche local`
                : `${clientRank}e position sur ${list.length + 1} acteurs`

            // Tous les joueurs triés par score desc
            const allPlayers = [
              { name: businessName.length > 22 ? businessName.slice(0, 20) + '...' : businessName, score: scoreGlobal, isClient: true, color: C.blue },
              ...list.map(c => ({ name: c.name.length > 22 ? c.name.slice(0, 20) + '...' : c.name, score: c.score, isClient: false, color: c.rankColor, strengths: c.strengths, weaknesses: c.weaknesses })),
            ].sort((a, b) => b.score - a.score)

            const maxScore = Math.max(...allPlayers.map(p => p.score), 100)

            return (
              <View style={S.body}>
                <SectionHeader title="Concurrents locaux" color={C.navy} />

                {/* Rank badge */}
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <View style={{ backgroundColor: `${rankColor}12`, borderRadius: 100, padding: '4 14', border: `1 solid ${rankColor}30` }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: rankColor }}>{rankLabel}</Text>
                  </View>
                  <Text style={{ fontSize: 8.5, color: C.textMuted }}>
                    Moy. concurrents : {avgCompetitorScore}/100
                    {gapToLeader > 0 ? `  ·  Écart au leader : ${gapToLeader} pts` : ''}
                  </Text>
                </View>

                {/* Barres de score — 2 colonnes pour économiser l'espace vertical */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    {allPlayers.slice(0, 2).map((p, i) => {
                      const barPct = Math.round((p.score / maxScore) * 100)
                      return (
                        <View key={i} style={{ marginBottom: 12 }}>
                          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              {p.isClient && (
                                <View style={{ backgroundColor: C.blue, borderRadius: 100, padding: '1 6' }}>
                                  <Text style={{ fontSize: 6.5, color: C.white, fontFamily: 'Helvetica-Bold' }}>VOUS</Text>
                                </View>
                              )}
                              <Text style={{ fontSize: 9, color: p.isClient ? C.navy : C.textMuted, fontFamily: p.isClient ? 'Helvetica-Bold' : 'Helvetica' }}>
                                {p.name}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: p.isClient ? C.blue : C.textMuted }}>
                              {p.score}/100
                            </Text>
                          </View>
                          <View style={{ height: p.isClient ? 8 : 5, backgroundColor: C.cream2, borderRadius: 4 }}>
                            <View style={{ height: p.isClient ? 8 : 5, width: `${barPct}%`, backgroundColor: p.color, borderRadius: 4, opacity: p.isClient ? 1 : 0.65 }} />
                          </View>
                          {'strengths' in p && p.strengths && p.strengths.length > 0 && (
                            <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                              {p.strengths.slice(0, 1).map((s: string, si: number) => (
                                <View key={si} style={{ backgroundColor: 'rgba(43,147,72,0.07)', borderRadius: 100, padding: '2 7' }}>
                                  <Text style={{ fontSize: 7, color: C.green }}>+ {s}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )
                    })}
                  </View>

                  <View style={{ flex: 1 }}>
                    {allPlayers.slice(2).map((p, i) => {
                      const barPct = Math.round((p.score / maxScore) * 100)
                      return (
                        <View key={i} style={{ marginBottom: 12 }}>
                          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              {p.isClient && (
                                <View style={{ backgroundColor: C.blue, borderRadius: 100, padding: '1 6' }}>
                                  <Text style={{ fontSize: 6.5, color: C.white, fontFamily: 'Helvetica-Bold' }}>VOUS</Text>
                                </View>
                              )}
                              <Text style={{ fontSize: 9, color: p.isClient ? C.navy : C.textMuted, fontFamily: p.isClient ? 'Helvetica-Bold' : 'Helvetica' }}>
                                {p.name}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: p.isClient ? C.blue : C.textMuted }}>
                              {p.score}/100
                            </Text>
                          </View>
                          <View style={{ height: p.isClient ? 8 : 5, backgroundColor: C.cream2, borderRadius: 4 }}>
                            <View style={{ height: p.isClient ? 8 : 5, width: `${barPct}%`, backgroundColor: p.color, borderRadius: 4, opacity: p.isClient ? 1 : 0.65 }} />
                          </View>
                          {'weaknesses' in p && p.weaknesses && p.weaknesses.length > 0 && (
                            <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                              {p.weaknesses.slice(0, 1).map((w: string, wi: number) => (
                                <View key={wi} style={{ backgroundColor: 'rgba(224,49,49,0.06)', borderRadius: 100, padding: '2 7' }}>
                                  <Text style={{ fontSize: 7, color: C.red }}>- {w}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )
                    })}
                  </View>
                </View>

                {/* Résumé */}
                <View style={{ backgroundColor: 'rgba(9,38,118,0.04)', borderRadius: 9, padding: '10 14', border: '1 solid rgba(9,38,118,0.08)', marginTop: 4 }}>
                  <Text style={{ fontSize: 9, color: '#3D4A6B', lineHeight: 1.6 }}>{summary}</Text>
                </View>
              </View>
            )
          })()}

          <PageFooter label={businessName} pageNum={3} total={totalPages} />
        </Page>
      )}

      {/* ═══════════════════ PAGE 4 — IMPACT FINANCIER & PLAN D'ACTION 90J ═══════════════════ */}
      {hasPage4 && (
        <Page size="A4" style={S.page}>

          {/* ── HEADER compact ── */}
          <View style={[S.pageHeader, { gap: 0, padding: '20 56 18' }]}>
            <View>
              <Text style={S.pageHeaderEyebrow}>Impact financier estimé</Text>
              <Text style={[S.pageHeaderTitle, { fontSize: 18, marginBottom: 4 }]}>Clients perdus & Plan d'action</Text>
              <Text style={[S.pageHeaderSub, { fontSize: 8.5 }]}>
                Estimation du CA non capturé et feuille de route pour le récupérer en 90 jours.
              </Text>
            </View>
          </View>

          {/* ══ IMPACT FINANCIER ══ */}
          {(() => {
            const lc = lostClients!
            const urgColor =
              lc.yearlyLostRevenue > 50_000 ? C.red :
              lc.yearlyLostRevenue > 15_000 ? C.orange : C.blue

            return (
              <View style={[S.body, { marginTop: 0 }]}>
                <SectionHeader title="Impact financier estimé — Clients perdus" color={urgColor} />

                {/* Carte principale CA perdu — layout horizontal compact */}
                <View style={{
                  backgroundColor: `${urgColor}0D`,
                  border: `1.5 solid ${urgColor}30`,
                  borderRadius: 12, padding: '16 22',
                  marginBottom: 10,
                  display: 'flex', flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 7, color: urgColor, fontFamily: 'Helvetica-Bold',
                      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6,
                    }}>
                      CA potentiel non capturé / an
                    </Text>
                    <Text style={{ fontSize: 34, fontFamily: 'Helvetica-Bold', color: urgColor, lineHeight: 1 }}>
                      {fmtCHF(lc.yearlyLostRevenue)}
                    </Text>
                    <Text style={{ fontSize: 8, color: C.textMuted, marginTop: 5, lineHeight: 1.4 }}>
                      Fourchette : {fmtCHF(lc.range.low)} — {fmtCHF(lc.range.high)} par an
                    </Text>
                  </View>
                  <View style={{ width: 1, height: 52, backgroundColor: `${urgColor}22`, marginHorizontal: 20 }} />
                  <View style={{ alignItems: 'center', minWidth: 72 }}>
                    <Text style={{ fontSize: 32, fontFamily: 'Helvetica-Bold', color: urgColor, lineHeight: 1 }}>
                      {lc.monthlyLostLeads}
                    </Text>
                    <Text style={{ fontSize: 7.5, color: C.textMuted, textAlign: 'center', marginTop: 5, lineHeight: 1.4 }}>
                      {'clients\nperdus/mois'}
                    </Text>
                  </View>
                </View>

                {/* 3 chips + barre dans la même rangée — layout ultra-compact */}
                <View style={{ display: 'flex', flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  {[
                    { label: 'Perdu / mois',  value: fmtCHF(Math.round(lc.yearlyLostRevenue / 12)), color: urgColor },
                    { label: 'Perdu / an',    value: fmtCHF(lc.yearlyLostRevenue),                  color: urgColor },
                    { label: 'Gain potentiel', value: fmtCHF(lc.yearlyPotentialGain),               color: C.green  },
                  ].map((m) => (
                    <View key={m.label} style={[S.metricChip, { borderRadius: 10, padding: '10 10' }]}>
                      <Text style={[S.metricChipValue, { color: m.color, fontSize: 15 }]}>{m.value}</Text>
                      <Text style={S.metricChipLabel}>{m.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Barre taux de conversion */}
                <View style={[S.cardTight, { borderRadius: 10, padding: '10 14' }]}>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 8.5, color: C.textMuted }}>Taux de conversion estimé</Text>
                    <View style={{ display: 'flex', flexDirection: 'row', gap: 14 }}>
                      <Text style={{ fontSize: 8.5, color: urgColor, fontFamily: 'Helvetica-Bold' }}>
                        Vous : {(lc.estimatedConversionRate * 100).toFixed(1)}%
                      </Text>
                      <Text style={{ fontSize: 8.5, color: C.textMuted }}>
                        Secteur : {(lc.sectorAvgConversionRate * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  <View style={{ height: 7, backgroundColor: C.cream2, borderRadius: 4 }}>
                    <View style={{ height: 7, width: `${Math.min(100, (lc.estimatedConversionRate / (lc.sectorAvgConversionRate * 1.6)) * 100)}%`, backgroundColor: urgColor, borderRadius: 4 }} />
                  </View>
                  <Text style={{ fontSize: 7.5, color: C.textMuted, marginTop: 6, lineHeight: 1.4 }}>
                    En atteignant le top 25%, vous pourriez générer {fmtCHF(lc.yearlyPotentialGain)} de CA additionnel par an.
                  </Text>
                </View>
              </View>
            )
          })()}

          {/* ══ PLAN D'ACTION · 90 JOURS — CTA PREMIUM ══ */}
          <View style={{ margin: '16 56 0', borderRadius: 14, overflow: 'hidden', border: '1.5 solid rgba(8,92,240,0.30)' }}>

            {/* Bande accent top */}
            <View style={{ height: 3, backgroundColor: C.blue }} />

            {/* Corps principal */}
            <View style={{ backgroundColor: C.navy }}>

              {/* Eyebrow centré */}
              <View style={{
                borderBottom: '1 solid rgba(175,233,253,0.08)',
                padding: '10 32',
                display: 'flex', flexDirection: 'row',
                alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(175,233,253,0.10)' }} />
                <Text style={{ fontSize: 7.5, letterSpacing: 2.5, textTransform: 'uppercase', color: C.blue, fontFamily: 'Helvetica-Bold' }}>
                  Plan d'action · 90 jours
                </Text>
                <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(175,233,253,0.10)' }} />
              </View>

              {/* Deux colonnes */}
              <View style={{ display: 'flex', flexDirection: 'row' }}>

                {/* Colonne gauche */}
                <View style={{ flex: 1, padding: '16 20 18 28', borderRight: '1 solid rgba(175,233,253,0.07)' }}>
                  <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.white, lineHeight: 1.25, marginBottom: 8 }}>
                    Ces chiffres sont récupérables.{'\n'}Passez à l'action avec un expert.
                  </Text>
                  <Text style={{ fontSize: 8.5, color: 'rgba(175,233,253,0.55)', lineHeight: 1.65, marginBottom: 14 }}>
                    Un plan structuré sur 90 jours suffit pour capturer une part significative
                    de ce potentiel. Réservez 30 min gratuites avec un consultant Cabinet Stratège
                    pour transformer ce diagnostic en feuille de route mesurable.
                  </Text>
                  <View style={{ backgroundColor: C.blue, borderRadius: 8, padding: '9 20', alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.2 }}>
                      Réserver ma session gratuite →
                    </Text>
                  </View>
                  <Text style={{ fontSize: 7.5, color: C.blueLight, fontFamily: 'Helvetica-Bold', marginTop: 8, textDecoration: 'underline' }}>
                    {calLink}
                  </Text>
                </View>

                {/* Colonne droite — 3 étapes */}
                <View style={{ width: 182, padding: '16 24 18 20' }}>
                  <Text style={{ fontSize: 7, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(175,233,253,0.40)', fontFamily: 'Helvetica-Bold', marginBottom: 12 }}>
                    Ce que vous obtenez
                  </Text>
                  {[
                    { num: '01', label: 'Audit de votre situation actuelle' },
                    { num: '02', label: "Plan d'action priorisé & chiffré" },
                    { num: '03', label: 'Suivi des résultats à 30 / 60 / 90j' },
                  ].map((step) => (
                    <View key={step.num} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 11 }}>
                      <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.blue, lineHeight: 1.3, width: 16, flexShrink: 0 }}>
                        {step.num}
                      </Text>
                      <Text style={{ fontSize: 8, color: 'rgba(175,233,253,0.65)', lineHeight: 1.45, flex: 1 }}>
                        {step.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Footer de confiance */}
            <View style={{
              backgroundColor: 'rgba(5,10,52,0.98)',
              borderTop: '1 solid rgba(175,233,253,0.07)',
              padding: '8 28',
              display: 'flex', flexDirection: 'row',
              justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Text style={{ fontSize: 7, color: 'rgba(175,233,253,0.28)' }}>
                cabinet-stratege.ch · Rapport confidentiel · {new Date().toLocaleDateString('fr-CH', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.green }} />
                <Text style={{ fontSize: 7, color: 'rgba(175,233,253,0.28)' }}>Session gratuite · Sans engagement</Text>
              </View>
            </View>
          </View>

          <PageFooter label={businessName} pageNum={4} total={totalPages} />
        </Page>
      )}

    </Document>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface SectorBenchmarksPDF2 {
  avgScore:    number
  topQuartile: number
  median:      number
}

interface LostClientsPDF2 {
  yearlyLostRevenue:       number
  monthlyLostLeads:        number
  yearlyPotentialGain:     number
  range:                   { low: number; mid: number; high: number }
  estimatedConversionRate: number
  sectorAvgConversionRate: number
}

function deriveTagsFromScores(scores: AuditScores): { strengths: string[]; weaknesses: string[] } {
  const strengths:  string[] = []
  const weaknesses: string[] = []

  const cfg = [
    { key: 'social'   as keyof AuditScores, strong: ['Présence réseaux active', 'Bonne fréquence de publication'], weak: ['Réseaux sociaux inactifs', 'Pas de présence sociale'] },
    { key: 'web'      as keyof AuditScores, strong: ['Site web performant', 'Mobile-friendly'], weak: ['Pas de site web', 'SEO inexistant'] },
    { key: 'gbp'      as keyof AuditScores, strong: ['Fiche Google active', 'Bonne note Google'], weak: ['Pas de fiche Google', "Peu d'avis clients"] },
    { key: 'funnel'   as keyof AuditScores, strong: ['CTAs visibles', 'Prise de RDV en ligne'], weak: ['Pas de formulaire', 'Pas de CRM'] },
    { key: 'branding' as keyof AuditScores, strong: ['Branding professionnel', 'Preuves sociales visibles'], weak: ['Image non professionnelle', 'Pas de témoignages'] },
  ]

  cfg.forEach(({ key, strong, weak }) => {
    const score = scores[key] as number
    if (score >= 14)     strengths.push(...strong)
    else if (score <= 8) weaknesses.push(...weak)
  })

  return { strengths: strengths.slice(0, 6), weaknesses: weaknesses.slice(0, 6) }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })
  }

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

  // ── Recommandations ───────────────────────────────────────────────────────
  let recommendations: Recommendation[] = []
  try {
    const answers = audit.answersJSON as unknown as AuditAnswers
    const scores: AuditScores = {
      global: audit.scoreGlobal, social: audit.scoreSocial,
      web: audit.scoreWeb,       gbp:    audit.scoreGBP,
      funnel: audit.scoreFunnel, branding: audit.scoreBranding,
    }
    recommendations = generateRecommendations(answers, scores, 3)
  } catch (err) {
    console.error('[/api/pdf] Recommendations error:', err)
  }

  // ── Tags ──────────────────────────────────────────────────────────────────
  const { strengths, weaknesses } = deriveTagsFromScores({
    global: audit.scoreGlobal, social: audit.scoreSocial,
    web:    audit.scoreWeb,    gbp:    audit.scoreGBP,
    funnel: audit.scoreFunnel, branding: audit.scoreBranding,
  })

  // ── Données sectorielles v2 ───────────────────────────────────────────────
  let sectorPercentile:     number | undefined
  let sectorBenchmarksData: SectorBenchmarksPDF2 | undefined
  let lostClientsData:      LostClientsPDF2 | undefined

  try {
    const template = getSectorTemplate(audit.sector ?? '')
    const pr = getSectorPercentile(audit.scoreGlobal, template)
    sectorPercentile     = (audit as Record<string, unknown>).sectorPercentile as number ?? pr.percentile
    sectorBenchmarksData = template.benchmarks

    if (audit.lostClientsJSON) {
      const lc = audit.lostClientsJSON as unknown as LostClientsEstimate
      lostClientsData = {
        yearlyLostRevenue:       lc.yearlyLostRevenue,
        monthlyLostLeads:        lc.monthlyLostLeads,
        yearlyPotentialGain:     lc.yearlyPotentialGain,
        range:                   lc.range,
        estimatedConversionRate: lc.estimatedConversionRate,
        sectorAvgConversionRate: lc.sectorAvgConversionRate,
      }
    }
  } catch (err) {
    console.warn('[/api/pdf] Sector data error (non-fatal):', err)
  }

  // ── Données concurrents v3 ────────────────────────────────────────────────
  let competitorsData: CompetitorsPDF | undefined

  try {
    const raw = (audit as Record<string, unknown>).competitorsJSON
    if (raw) {
      const analysis = raw as unknown as CompetitorsAnalysis
      competitorsData = {
        competitors:        analysis.competitors.map(c => ({
          name:       c.name,
          score:      c.score,
          rankLabel:  c.rankLabel,
          rankColor:  c.rankColor,
          strengths:  c.strengths,
          weaknesses: c.weaknesses,
          delta:      c.delta,
        })),
        clientRank:         analysis.clientRank,
        summary:            analysis.summary,
        gapToLeader:        analysis.gapToLeader,
        avgCompetitorScore: analysis.avgCompetitorScore,
      }
    }
  } catch (err) {
    console.warn('[/api/pdf] Competitors data error (non-fatal):', err)
  }

  const APP_URL  = process.env.NEXT_PUBLIC_APP_URL  ?? 'http://localhost:3000'
  const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK ?? 'https://cal.com/cabinet-stratege'

  // ── Rendu PDF ─────────────────────────────────────────────────────────────
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderToBuffer(
      React.createElement(AuditPDF, {
        businessName:    audit.businessName,
        city:            audit.city        ?? '',
        sector:          audit.sector      ?? '',
        activityType:    audit.activityType,
        scoreGlobal:     audit.scoreGlobal,
        scoreSocial:     audit.scoreSocial,
        scoreWeb:        audit.scoreWeb,
        scoreGBP:        audit.scoreGBP,
        scoreFunnel:     audit.scoreFunnel,
        scoreBranding:   audit.scoreBranding,
        recommendations,
        strengths,
        weaknesses,
        calLink:         CAL_LINK,
        resultUrl:       `${APP_URL}/audit/result?id=${id}`,
        sectorPercentile,
        sectorBenchmarks: sectorBenchmarksData,
        lostClients:     lostClientsData,
        competitors:     competitorsData,
      }),
    )
  } catch (err) {
    console.error('[/api/pdf] renderToBuffer error:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF.' },
      { status: 500 },
    )
  }

  const safeName = audit.businessName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)

  const filename = `audit-digital-${safeName}-${id.slice(0, 8)}.pdf`

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