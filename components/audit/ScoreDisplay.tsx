
'use client'

import { useEffect, useState } from 'react'
import { useWindowWidth } from '@/lib/useWindowWidth'

export interface AuditScores {
  global: number
  social: number
  web: number
  gbp: number
  funnel: number
  branding: number
}

interface ScoreDisplayProps {
  scores: AuditScores
  businessName?: string
  city?: string
  isUnlocked?: boolean
}

const PILIER_CONFIG = [
  {
    key: 'social' as keyof AuditScores, name: 'Réseaux sociaux',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>,
  },
  {
    key: 'web' as keyof AuditScores, name: 'Présence Web & SEO',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>,
  },
  {
    key: 'gbp' as keyof AuditScores, name: 'Google Business',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  },
  {
    key: 'funnel' as keyof AuditScores, name: 'Acquisition & Funnel',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
  },
  {
    key: 'branding' as keyof AuditScores, name: 'Branding & Crédibilité',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  },
]

function getScoreConfig(score: number) {
  if (score < 40) return { label: 'Invisible en ligne', color: '#E03131', bg: 'rgba(224,49,49,0.15)', border: 'rgba(224,49,49,0.3)', pillClass: 'red' }
  if (score < 70) return { label: 'Potentiel non exploité', color: '#F97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)', pillClass: 'orange' }
  return { label: 'Bonne base, optimisable', color: '#22C55E', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', pillClass: 'green' }
}

function getPilierColor(score: number): string {
  const pct = (score / 20) * 100
  if (pct < 40) return 'linear-gradient(90deg, #E03131, #FF6B6B)'
  if (pct < 65) return 'linear-gradient(90deg, #E8890C, #FCD34D)'
  return 'linear-gradient(90deg, #092676, #085CF0)'
}

export default function ScoreDisplay({ scores, businessName, city, isUnlocked = true }: ScoreDisplayProps) {
  const isMobile = useWindowWidth() < 960
  const [animatedScore, setAnimatedScore] = useState(0)
  const [barsVisible, setBarsVisible] = useState(false)

  useEffect(() => {
    if (!isUnlocked) return
    let current = 0
    const target = scores.global
    const step = Math.ceil(target / 60)
    const interval = setInterval(() => {
      current = Math.min(current + step, target)
      setAnimatedScore(current)
      if (current >= target) clearInterval(interval)
    }, 20)
    setTimeout(() => setBarsVisible(true), 200)
    return () => clearInterval(interval)
  }, [isUnlocked, scores.global])

  const config = getScoreConfig(scores.global)
  const RADIUS = 66
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const dashOffset = isUnlocked ? CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE : CIRCUMFERENCE

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ── Hero band (navy) ─────────────────────────────────── */}
      <div style={{
        background: '#050A34',
        padding: isMobile ? '40px 24px' : '56px 72px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 28 : 56,
        alignItems: isMobile ? 'center' : 'center',
        animation: 'fadeUp 0.6s ease both',
        textAlign: isMobile ? 'center' : 'left',
      }}>
        {/* SVG Ring */}
        <div style={{ position: 'relative', width: 148, height: 148, flexShrink: 0 }}>
          <svg width="148" height="148" viewBox="0 0 148 148" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="74" cy="74" r={RADIUS} fill="none" stroke="rgba(175,233,253,0.1)" strokeWidth="8" />
            <circle cx="74" cy="74" r={RADIUS} fill="none" stroke={config.color} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${config.color}60)` }} />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            filter: isUnlocked ? 'none' : 'blur(8px)',
          }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 38, fontWeight: 800, color: 'white', lineHeight: 1 }}>
              {isUnlocked ? animatedScore : '??'}
            </span>
            <span style={{ fontSize: 13, color: 'rgba(175,233,253,0.4)' }}>/100</span>
          </div>
        </div>

        {/* Info block */}
        <div style={{ flex: 1, minWidth: isMobile ? '100%' : 240 }}>
          {businessName && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: 'rgba(175,233,253,0.5)',
              marginBottom: 10, fontWeight: 500, letterSpacing: '0.05em',
              justifyContent: isMobile ? 'center' : 'flex-start',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              </svg>
              {businessName}{city ? ` — ${city}` : ''}
            </div>
          )}
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: isMobile ? '26px' : 'clamp(28px, 4vw, 38px)',
            fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 16,
          }}>
            Votre score digital :{' '}
            <span style={{ color: config.color }}>
              {isUnlocked ? `${scores.global}/100` : '?/100'}
            </span>
          </h1>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
            background: config.bg, color: config.color, border: `1px solid ${config.border}`,
            marginBottom: 18,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
            {config.label}
          </div>
          <p style={{ fontSize: isMobile ? 14 : 15, color: 'rgba(175,233,253,0.65)', lineHeight: 1.7, maxWidth: isMobile ? '100%' : 580 }}>
            {SCORE_MESSAGES[config.pillClass as keyof typeof SCORE_MESSAGES]}
          </p>
        </div>
      </div>

      {/* ── Pilier bars ──────────────────────────────────────── */}
      <div style={{ padding: isMobile ? '28px 24px 0' : '36px 72px 0', background: '#F5F0E8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#085CF0' }} />
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#092676' }}>
            Détail par pilier
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {PILIER_CONFIG.map((pilier, i) => {
            const score = scores[pilier.key] as number
            const pct = (score / 20) * 100
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(8,92,240,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#085CF0' }}>
                      {pilier.icon}
                    </span>
                    <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: '#050A34' }}>{pilier.name}</span>
                  </div>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#092676', filter: isUnlocked ? 'none' : 'blur(6px)' }}>
                    {isUnlocked ? `${score}/20` : '?/20'}
                  </span>
                </div>
                <div style={{ height: 8, background: '#EDE8DF', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(9,38,118,0.08)' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: isUnlocked ? getPilierColor(score) : 'rgba(9,38,118,0.15)',
                    width: isUnlocked && barsVisible ? `${pct}%` : '0%',
                    transition: `width 1.2s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s`,
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

const SCORE_MESSAGES = {
  red: 'Votre présence digitale est insuffisante. Chaque jour, des clients potentiels vous cherchent en ligne et ne vous trouvent pas.',
  orange: `Vous avez des bases solides mais vous laissez passer de nombreuses opportunités business. Un plan d'action ciblé peut rapidement inverser la tendance.`,
  green: 'Votre présence digitale est bien établie. Quelques optimisations stratégiques peuvent encore amplifier significativement vos résultats.',
}