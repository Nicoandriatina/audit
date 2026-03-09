
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useWindowWidth } from '@/lib/useWindowWidth'

import ScoreDisplay, { type AuditScores } from '@/components/audit/ScoreDisplay'
import UnlockForm, { type LeadData } from '@/components/audit/UnlockForm'
import RadarChart from '@/components/audit/RadarChart'
import Recommendations, { type Recommendation } from '@/components/audit/Recommendations'
import BookingCTA from '@/components/audit/BookingCTA'
import LostClientsCard from '@/components/audit/LostClientsCard'
import SectorBenchmark from '@/components/audit/SectorBenchmark'
import CompetitorCard from '@/components/audit/CompetitorCard'

import { getSectorTemplate, getSectorPercentile, calculateWeightedScore } from '@/lib/sector-templates'
import { estimateLostClients, getLostClientsMessage } from '@/lib/lost-clients'
import type { LostClientsEstimate } from '@/lib/lost-clients'
import type { CompetitorsAnalysis } from '@/lib/competitors'
import type { AuditAnswers } from '@/types/audit'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectorBenchmarks {
  avgScore:    number
  topQuartile: number
  median:      number
}

interface AuditData {
  id:            string
  businessName:  string
  city:          string
  sector:        string
  activityType:  string
  scoreGlobal:    number
  scoreGlobalRaw: number
  scoreSocial:    number
  scoreWeb:       number
  scoreGBP:       number
  scoreFunnel:    number
  scoreBranding:  number
  // v2 sectoriel — retournés par GET /api/audit/[id]
  sectorTemplateId?:  string
  sectorPercentile?:  number
  lostClientsJSON?:   LostClientsEstimate | null
  sectorBenchmarks?:  SectorBenchmarks
  sectorTips?:        Record<string, string>
  // v3 concurrents
  competitorsJSON?:   CompetitorsAnalysis | null
  answersJSON?:       Record<string, unknown>  // absent en état locked
  fullName?:          string
  email?:             string
  phone?:             string
}

// ─── Helpers — fallback calcul client-side ────────────────────────────────────

/**
 * Pour les audits créés avant Sprint 1 (lostClientsJSON null en DB),
 * on recalcule les données sectorielles à la volée depuis answersJSON.
 */
function computeFallbackSectorData(auditData: AuditData) {
  const template = getSectorTemplate(auditData.sector)

  const rawScores = {
    social:   auditData.scoreSocial,
    web:      auditData.scoreWeb,
    gbp:      auditData.scoreGBP,
    funnel:   auditData.scoreFunnel,
    branding: auditData.scoreBranding,
  }

  // Contexte bonus construit depuis les champs plats — answersJSON peut être absent
  // (GET /api/audit/[id] ne le retourne pas pour alléger la réponse)
  const rawAnswers = auditData.answersJSON as unknown as AuditAnswers | undefined
  const bonusCtx = {
    activityType:          (auditData.activityType as 'B2B' | 'B2C'),
    hasGBP:                (rawAnswers?.gbp?.hasGBP             ?? ''),
    reviewCount:           (rawAnswers?.gbp?.reviewCount        ?? ''),
    averageRating:         (rawAnswers?.gbp?.averageRating      ?? ''),
    respondsToReviews:     (rawAnswers?.gbp?.respondsToReviews  ?? ''),
    hasOnlineBooking:      (rawAnswers?.funnel?.hasOnlineBooking ?? null),
    hasWebsite:            (rawAnswers?.web?.hasWebsite          ?? null),
    hasSEO:                (rawAnswers?.web?.hasSEO              ?? null),
    platforms:             (rawAnswers?.social?.platforms        ?? []),
    postsFrequency:        (rawAnswers?.social?.postsFrequency   ?? ''),
    hasProfessionalPhotos: (rawAnswers?.branding?.hasProfessionalPhotos ?? null),
    hasSocialProof:        (rawAnswers?.branding?.hasSocialProof ?? null),
    hasContactForm:        (rawAnswers?.funnel?.hasContactForm   ?? null),
  }

  const weightedScore = calculateWeightedScore(rawScores, template, bonusCtx)
  const percentile    = getSectorPercentile(weightedScore, template)

  const globalRaw = auditData.scoreGlobalRaw
    ?? (auditData.scoreSocial + auditData.scoreWeb + auditData.scoreGBP + auditData.scoreFunnel + auditData.scoreBranding)

  const scores = {
    global:    weightedScore,
    globalRaw,
    ...rawScores,
  }

  // AuditAnswers minimal pour estimateLostClients — qualification suffit
  const minimalAnswers: AuditAnswers = rawAnswers ?? {
    qualification: {
      businessName: auditData.businessName,
      city:         auditData.city,
      sector:       auditData.sector,
      activityType: auditData.activityType as 'B2B' | 'B2C',
    },
    social:   { platforms: [], postsFrequency: '' },
    web:      { hasWebsite: null, isMobileFriendly: '', hasSEO: null },
    gbp:      { hasGBP: '', reviewCount: '', averageRating: '', respondsToReviews: '' },
    funnel:   { hasContactForm: null, hasVisibleCTA: null, hasOnlineBooking: null, hasLeadTracking: null },
    branding: { hasProfessionalLogo: null, hasProfessionalPhotos: null, hasVisualConsistency: '', hasSocialProof: null },
  }

  const lostClients = estimateLostClients(minimalAnswers, scores, template)
  const lostMessage = getLostClientsMessage(lostClients, auditData.city)

  return { template, percentile, lostClients, lostMessage }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResultPageInner />
    </Suspense>
  )
}

function ResultPageInner() {
  const searchParams = useSearchParams()
  const auditId  = searchParams.get('id')
  const isMobile = useWindowWidth() < 960

  const [loadingAudit, setLoadingAudit] = useState(true)
  const [auditData,    setAuditData]    = useState<AuditData | null>(null)
  const [fetchError,   setFetchError]   = useState<string | null>(null)
  const [isUnlocked,   setIsUnlocked]   = useState(false)
  const [lead,         setLead]         = useState<LeadData | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])

  useEffect(() => {
    if (!auditId) { setFetchError("Identifiant d'audit manquant."); setLoadingAudit(false); return }
    ;(async () => {
      try {
        const res  = await fetch(`/api/audit/${auditId}`)
        if (!res.ok) throw new Error(`Audit introuvable (${res.status})`)
        const data = await res.json()
        setAuditData(data.audit)
        if (data.audit.fullName && data.audit.email) {
          setIsUnlocked(true)
          setLead({ fullName: data.audit.fullName, email: data.audit.email, phone: data.audit.phone ?? '' })
          setRecommendations(data.recommendations ?? [])
        }
      } catch (err: unknown) {
        setFetchError(err instanceof Error ? err.message : 'Erreur serveur')
      } finally {
        setLoadingAudit(false)
      }
    })()
  }, [auditId])

  const handleUnlocked = (data: LeadData & { recommendations: unknown[]; audit: unknown }) => {
    setLead({ fullName: data.fullName, email: data.email, phone: data.phone })
    setRecommendations(data.recommendations as Recommendation[])
    if (data.audit) setAuditData((prev) => ({ ...prev, ...(data.audit as object) } as AuditData))
    setIsUnlocked(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scores: AuditScores | null = auditData ? {
    global:    auditData.scoreGlobal,
    globalRaw: auditData.scoreGlobalRaw ?? auditData.scoreGlobal,
    social:    auditData.scoreSocial,
    web:       auditData.scoreWeb,
    gbp:       auditData.scoreGBP,
    funnel:    auditData.scoreFunnel,
    branding:  auditData.scoreBranding,
  } : null

  const { strengths, weaknesses } = deriveTagsFromScores(scores)

  if (loadingAudit) return <LoadingScreen />
  if (fetchError || !auditData || !scores) return <ErrorScreen message={fetchError ?? 'Audit introuvable.'} />

  // ── Données sectorielles : DB si disponibles, sinon calcul fallback ────────
  // Fallback calculé toujours (pas seulement unlocked) — LostClientsCard visible dès le résultat
  const fallback    = computeFallbackSectorData(auditData)
  const template    = fallback.template

  const lostClients: LostClientsEstimate =
    auditData.lostClientsJSON ?? fallback.lostClients

  const lostMessage = auditData.lostClientsJSON
    ? getLostClientsMessage(auditData.lostClientsJSON, auditData.city)
    : fallback.lostMessage

  const sectorPercentile: number =
    auditData.sectorPercentile ?? fallback.percentile.percentile

  const percentileLabel: string =
    auditData.sectorPercentile
      ? (auditData.sectorPercentile >= 75
          ? `Top ${100 - auditData.sectorPercentile}% de votre secteur`
          : `Meilleur que ${auditData.sectorPercentile}% des entreprises de votre secteur`)
      : fallback.percentile.label

  const sectorBenchmarks: SectorBenchmarks =
    auditData.sectorBenchmarks ?? fallback.template.benchmarks

  const sectorTips: Record<string, string> =
    (auditData.sectorTips && Object.keys(auditData.sectorTips).length > 0)
      ? auditData.sectorTips
      : fallback.template.sectorTips

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#F5F0E8', minHeight: '100vh' }}>
      <ResultNav isUnlocked={isUnlocked} auditId={auditId ?? ''} isMobile={isMobile} />

      <div style={{ paddingTop: 64 }}>

        {/* ══ ÉTAT LOCKED ══════════════════════════════════════════════════ */}
        {!isUnlocked && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 440px',
            minHeight: 'calc(100vh - 64px)',
            animation: 'fadeUp 0.5s ease both',
          }}>
            {!isMobile && (
              <div style={{ padding: '56px 60px', position: 'relative', overflow: 'hidden', background: '#F5F0E8' }}>
                <div style={{ filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none' }}>
                  <BlurredPreview score={scores.global} />
                </div>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to right, rgba(245,240,232,0) 0%, rgba(245,240,232,0.98) 55%)',
                  display: 'flex', alignItems: 'center', paddingLeft: '8%',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: '#050A34', color: '#AFE9FD',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 16px', boxShadow: '0 0 0 12px rgba(5,10,52,0.08)',
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </div>
                    <p style={{ fontSize: 14, color: '#7A82A0', maxWidth: 180, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                      Débloquez votre rapport pour accéder à vos résultats
                    </p>
                  </div>
                </div>
              </div>
            )}
            <UnlockForm auditId={auditId ?? ''} previewScore={scores.global} onUnlocked={handleUnlocked} />
          </div>
        )}

        {/* ══ ÉTAT UNLOCKED ════════════════════════════════════════════════ */}
        {isUnlocked && (
          <div style={{ animation: 'fadeUp 0.5s ease both' }}>

            {/* Score + barres piliers */}
            <ScoreDisplay scores={scores} businessName={auditData.businessName} city={auditData.city} isUnlocked={true} />

            {/* Body */}
            <div style={{
              padding:             isMobile ? '32px 20px' : '48px 72px',
              display:             'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
              gap:                 isMobile ? 24 : 40,
            }}>

              {/* ── Colonne principale ──────────────────────────────────── */}
              <div>

                {/* ── Clients perdus chiffrés (v2) ── */}
                <LostClientsCard
                  estimate={lostClients}
                  headline={lostMessage.headline}
                  subline={lostMessage.subline}
                  urgency={lostMessage.urgency}
                  sector={auditData.sector}
                  city={auditData.city}
                  showDetails={true}
                />

                {/* ── Benchmark sectoriel (v2) ── */}
                <SectorBenchmark
                  score={auditData.scoreGlobal}
                  sectorLabel={auditData.sector}
                  sectorTemplateId={auditData.sectorTemplateId ?? template.id}
                  percentile={sectorPercentile}
                  percentileLabel={percentileLabel}
                  benchmarks={sectorBenchmarks}
                  sectorTips={sectorTips}
                />

                {/* ── Radar chart ── */}
                <div style={{ marginBottom: 32 }}>
                  <RadarChart
                    scores={{ social: scores.social, web: scores.web, gbp: scores.gbp, funnel: scores.funnel, branding: scores.branding }}
                    height={isMobile ? 260 : 300}
                  />
                </div>

                {/* ── Recommandations ── */}
                <Recommendations items={recommendations} />
              </div>

              {/* ── Sidebar ─────────────────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Points forts */}
                <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(9,38,118,0.1)', borderRadius: 16, padding: isMobile ? 20 : 28, boxShadow: '0 2px 12px rgba(5,10,52,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(43,147,72,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B9348" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                    </div>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#2B9348' }}>
                      Points forts
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                    {strengths.length > 0 ? strengths.map((tag, i) => (
                      <span key={i} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500, background: 'rgba(43,147,72,0.08)', border: '1px solid rgba(43,147,72,0.2)', color: '#2B9348', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        {tag}
                      </span>
                    )) : (
                      <span style={{ fontSize: 13, color: '#7A82A0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7A82A0" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                        À améliorer dans l&apos;ensemble
                      </span>
                    )}
                  </div>
                </div>

                {/* Axes d'amélioration */}
                <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(9,38,118,0.1)', borderRadius: 16, padding: isMobile ? 20 : 28, boxShadow: '0 2px 12px rgba(5,10,52,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(224,49,49,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E03131" strokeWidth="2.5"><path d="M12 9v4M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                    </div>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#E03131' }}>
                      Axes d&apos;amélioration
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                    {weaknesses.length > 0 ? weaknesses.map((tag, i) => (
                      <span key={i} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500, background: 'rgba(224,49,49,0.06)', border: '1px solid rgba(224,49,49,0.15)', color: '#E03131', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        {tag}
                      </span>
                    )) : (
                      <span style={{ fontSize: 13, color: '#2B9348', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2B9348" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                        Pas d&apos;axe critique détecté — bonne base !
                      </span>
                    )}
                  </div>
                </div>

                {/* Concurrents locaux (v3) */}
                {auditData.competitorsJSON && (
                  <CompetitorCard
                    analysis={auditData.competitorsJSON}
                    clientScore={scores.global}
                    businessName={auditData.businessName}
                  />
                )}

                {/* Booking CTA */}
                <BookingCTA
                  calLink={process.env.NEXT_PUBLIC_CAL_LINK}
                  mode="popup"
                  score={scores.global}
                  auditId={auditId ?? ''}
                  businessName={auditData.businessName}
                />
              </div>
            </div>

            {/* Footer CTA */}
            <FooterCTABand
              score={scores.global}
              auditId={auditId ?? ''}
              businessName={auditData.businessName}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultNav({ isUnlocked, auditId, isMobile }: { isUnlocked: boolean; auditId: string; isMobile: boolean }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: isMobile ? '0 20px' : '0 48px', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#050A34', borderBottom: '1px solid rgba(175,233,253,0.1)',
      fontFamily: 'Inter, sans-serif',
    }}>
      <a href="/" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 13 : 15, fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase' as const,
        color: 'white', textDecoration: 'none',
      }}>
        <span style={{ width: 32, height: 32, background: '#085CF0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'white' }}>CS</span>
        {!isMobile && 'Cabinet Stratège'}
      </a>
      {isUnlocked && auditId && (
        <a href={`/api/pdf/${auditId}`} download style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: 'rgba(175,233,253,0.7)', textDecoration: 'none',
          padding: '8px 16px', border: '1px solid rgba(175,233,253,0.2)', borderRadius: 100,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {isMobile ? 'PDF' : 'Télécharger PDF'}
        </a>
      )}
    </nav>
  )
}

function BlurredPreview({ score }: { score: number }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', border: '8px solid rgba(9,38,118,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 700, color: '#050A34' }}>{score}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 10, background: '#EDE8DF', borderRadius: 5, marginBottom: 8, width: '60%' }} />
          <div style={{ height: 10, background: '#EDE8DF', borderRadius: 5, width: '40%' }} />
        </div>
      </div>
      {[{ width: ['50%', '70%', '55%', '80%', '40%', '65%'] }, { width: ['40%', '90%', '75%', '60%'] }].map((card, ci) => (
        <div key={ci} style={{ background: '#FFFFFF', border: '1px solid rgba(9,38,118,0.1)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
          <div style={{ height: 12, background: '#EDE8DF', borderRadius: 4, marginBottom: 16, width: card.width[0] }} />
          {card.width.slice(1).map((w, i) => (
            <div key={i} style={{ height: 8, background: '#EDE8DF', borderRadius: 4, marginBottom: 8, width: w }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function FooterCTABand({ score, auditId, businessName, isMobile }: { score: number; auditId: string; businessName: string; isMobile: boolean }) {
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK ?? 'https://cal.com/cabinet-stratege'
  return (
    <div style={{
      background: '#050A34',
      padding: isMobile ? '40px 24px' : '56px 72px',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      gap: isMobile ? 28 : 40,
      flexWrap: 'wrap' as const,
    }}>
      <div style={{ maxWidth: isMobile ? '100%' : 540 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#AFE9FD', marginBottom: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 20, height: 2, background: '#085CF0', display: 'inline-block' }} />
          Prochaine étape
        </div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 24 : 30, fontWeight: 800, color: '#FFFFFF', marginBottom: 16, lineHeight: 1.2 }}>
          Transformez ce diagnostic<br />en résultats concrets
        </h2>
        <p style={{ fontSize: isMobile ? 14 : 15, color: 'rgba(175,233,253,0.6)', lineHeight: 1.7 }}>
          Un expert Cabinet Stratège analyse votre score avec vous et définit les 3 actions qui vont générer le plus de clients.{' '}
          <strong style={{ color: 'rgba(175,233,253,0.85)' }}>30 minutes offertes, sans engagement.</strong>
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: isMobile ? '100%' : 260 }}>
        <a href={calLink} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: '#085CF0', color: 'white',
          padding: '16px 32px', borderRadius: 100,
          fontSize: 15, fontWeight: 600, textDecoration: 'none',
          fontFamily: 'Syne, sans-serif', boxShadow: '0 4px 20px rgba(8,92,240,0.35)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Réserver mon diagnostic gratuit
        </a>
        <a href={`/api/pdf/${auditId}`} download style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'none', color: 'rgba(175,233,253,0.6)',
          border: '1px solid rgba(175,233,253,0.2)',
          padding: '13px 32px', borderRadius: 100,
          fontSize: 13, textDecoration: 'none', fontFamily: 'Inter, sans-serif',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Télécharger le rapport PDF
        </a>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050A34', flexDirection: 'column', gap: 20 }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#085CF0" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
        <path d="M21 12a9 9 0 11-6.219-8.56" />
      </svg>
      <p style={{ color: 'rgba(175,233,253,0.5)', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Chargement de votre rapport…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050A34', flexDirection: 'column', gap: 20, padding: 32, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(224,49,49,0.15)', border: '1px solid rgba(224,49,49,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E03131' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
      </div>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: 'white', textAlign: 'center' }}>Rapport introuvable</h2>
      <p style={{ color: 'rgba(175,233,253,0.5)', fontSize: 14, maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>{message}</p>
      <a href="/audit/start" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#085CF0', color: 'white', padding: '13px 28px', borderRadius: 100, fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}>
        Refaire un audit
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
      </a>
    </div>
  )
}

function deriveTagsFromScores(scores: AuditScores | null): { strengths: string[]; weaknesses: string[] } {
  if (!scores) return { strengths: [], weaknesses: [] }
  const strengths:  string[] = []
  const weaknesses: string[] = []
  const piliers: Array<{ key: keyof AuditScores; tags: { strong: string[]; weak: string[] } }> = [
    { key: 'social',   tags: { strong: ['Présence réseaux actifs', 'Bonne fréquence de publication'], weak: ['Réseaux inactifs', 'Pas de présence sociale'] } },
    { key: 'web',      tags: { strong: ['Site web performant', 'Site mobile-friendly'],               weak: ['Pas de site web', 'Pas de SEO'] } },
    { key: 'gbp',      tags: { strong: ['Fiche Google active', 'Bonne note Google'],                  weak: ['Pas de fiche Google', "Peu d'avis clients"] } },
    { key: 'funnel',   tags: { strong: ['CTAs visibles', 'Prise de RDV en ligne'],                   weak: ['Pas de formulaire', 'Pas de CRM'] } },
    { key: 'branding', tags: { strong: ['Branding professionnel', 'Preuves sociales visibles'],       weak: ['Image non professionnelle', 'Pas de témoignages'] } },
  ]
  piliers.forEach(({ key, tags }) => {
    const score = scores[key] as number
    if (score >= 14) strengths.push(...tags.strong)
    else if (score <= 8) weaknesses.push(...tags.weak)
  })
  return { strengths: strengths.slice(0, 6), weaknesses: weaknesses.slice(0, 6) }
}