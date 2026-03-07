'use client'

/**
 * AnalysisLoader.tsx — Écran d'animation "Analyse en cours"
 * Responsive : breakpoint 960px
 */

import { useEffect, useRef, useState } from 'react'
import { useWindowWidth } from '@/lib/useWindowWidth'

interface AnalysisLoaderProps {
  answers: Record<string, unknown>
  onComplete: (auditId: string) => void
  onError?: (error: string) => void
}

interface AnalyseStepConfig {
  label: string
  icon: React.ReactNode
  triggerAt: number
}

const ANALYSE_STEPS: AnalyseStepConfig[] = [
  {
    label: 'Analyse de votre visibilité locale...', triggerAt: 0,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  },
  {
    label: 'Évaluation de vos fondations digitales...', triggerAt: 25,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>,
  },
  {
    label: 'Calcul du score global...', triggerAt: 55,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  },
  {
    label: 'Génération du rapport...', triggerAt: 80,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  },
]

export default function AnalysisLoader({ answers, onComplete, onError }: AnalysisLoaderProps) {
  const isMobile = useWindowWidth() < 960
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const auditIdRef = useRef<string | null>(null)
  const apiDoneRef = useRef(false)
  const animDoneRef = useRef(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/audit/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answers),
        })
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const data = await res.json()
        auditIdRef.current = data.auditId
        apiDoneRef.current = true
        if (animDoneRef.current) onComplete(data.auditId)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur serveur'
        onError?.(message)
      }
    })()
  }, []) // eslint-disable-line

  useEffect(() => {
    let pct = 0
    const interval = setInterval(() => {
      pct++
      setProgress(pct)
      const nextStep = ANALYSE_STEPS.findLastIndex((s) => s.triggerAt <= pct)
      if (nextStep >= 0) setActiveStep(nextStep)
      if (pct >= 100) {
        clearInterval(interval)
        animDoneRef.current = true
        if (apiDoneRef.current && auditIdRef.current) {
          setTimeout(() => onComplete(auditIdRef.current!), 400)
        } else {
          const wait = setInterval(() => {
            if (apiDoneRef.current && auditIdRef.current) {
              clearInterval(wait)
              onComplete(auditIdRef.current!)
            }
          }, 200)
        }
      }
    }, 28)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line

  const RADIUS = isMobile ? 44 : 54
  const SIZE = isMobile ? 104 : 128
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE

  return (
    <div style={{
      minHeight: '100vh', paddingTop: 64,
      background: '#050A34',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(8,92,240,0.12) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025,
        backgroundImage: `linear-gradient(rgba(175,233,253,1) 1px, transparent 1px), linear-gradient(90deg, rgba(175,233,253,1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px', pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 520, width: '100%',
        padding: isMobile ? '40px 20px' : '60px 32px',
        animation: 'fadeUp 0.6s ease both', textAlign: 'center',
      }}>
        {/* SVG Ring */}
        <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: `0 auto ${isMobile ? 28 : 40}px` }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="rgba(175,233,253,0.08)" strokeWidth="8" />
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#085CF0" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.1s linear', filter: 'drop-shadow(0 0 8px rgba(8,92,240,0.6))' }} />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 24 : 30, fontWeight: 800, color: 'white', lineHeight: 1 }}>
              {progress}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(175,233,253,0.4)', marginTop: 2 }}>%</span>
          </div>
        </div>

        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 26 : 32, fontWeight: 700, color: 'white', marginBottom: 10 }}>
          Analyse en cours…
        </h2>
        <p style={{ fontSize: isMobile ? 13 : 15, color: 'rgba(175,233,253,0.55)', marginBottom: isMobile ? 32 : 52, fontWeight: 300, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
          Votre rapport est généré en temps réel
        </p>

        {/* Progress bar */}
        <div style={{ height: 6, background: 'rgba(175,233,253,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: isMobile ? 28 : 48 }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #085CF0, #AFE9FD)', borderRadius: 3, width: `${progress}%`, transition: 'width 0.1s linear' }} />
        </div>

        {/* Steps list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ANALYSE_STEPS.map((step, i) => {
            const isDone = i < activeStep
            const isActive = i === activeStep
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16,
                padding: isMobile ? '12px 14px' : '14px 18px', borderRadius: 12, textAlign: 'left',
                background: isDone ? 'rgba(74,222,128,0.06)' : isActive ? 'rgba(8,92,240,0.15)' : 'rgba(175,233,253,0.02)',
                border: `1px solid ${isDone ? 'rgba(74,222,128,0.15)' : isActive ? 'rgba(8,92,240,0.3)' : 'rgba(175,233,253,0.05)'}`,
                transition: 'all 0.4s ease',
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${isDone ? 'rgba(74,222,128,0.3)' : isActive ? 'rgba(8,92,240,0.5)' : 'rgba(175,233,253,0.08)'}`,
                  background: isDone ? 'rgba(74,222,128,0.1)' : isActive ? 'rgba(8,92,240,0.2)' : 'transparent',
                  color: isDone ? '#4ADE80' : isActive ? '#AFE9FD' : 'rgba(175,233,253,0.2)',
                  transition: 'all 0.3s',
                }}>
                  {isDone ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : isActive ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                  ) : step.icon}
                </span>
                <span style={{
                  fontSize: isMobile ? 13 : 14, fontFamily: 'Inter, sans-serif',
                  color: isDone ? 'rgba(74,222,128,0.75)' : isActive ? '#FFFFFF' : 'rgba(175,233,253,0.25)',
                  fontWeight: isActive ? 500 : 400, transition: 'color 0.3s',
                }}>{step.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}