'use client'

import { useRouter } from 'next/navigation'
import { useWindowWidth } from '@/lib/useWindowWidth'

interface IntroHeroProps {
  startUrl?: string
}

export default function IntroHero({ startUrl = '/audit/start' }: IntroHeroProps) {
  const router = useRouter()
  const isMobile = useWindowWidth() < 960

  return (
    <section style={{
      background: '#050A34',
      height: 'calc(100vh - 60px)',   // ← exactement l'espace sous la navbar
      marginTop: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background shapes */}
      <div style={{
        position: 'absolute',
        width: isMobile ? 340 : 560, height: isMobile ? 340 : 560, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(8,92,240,0.18) 0%, transparent 70%)',
        top: -160, right: -160, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(175,233,253,0.06) 0%, transparent 70%)',
        bottom: -80, left: -80, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(rgba(175,233,253,1) 1px, transparent 1px), linear-gradient(90deg, rgba(175,233,253,1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px', pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        textAlign: 'center',
        maxWidth: isMobile ? '100%' : 680,
        width: '100%',
        padding: isMobile ? '40px 24px 32px' : '0 32px',
        animation: 'fadeUp 0.8s ease both',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(175,233,253,0.3)',
          background: 'rgba(175,233,253,0.08)',
          padding: '5px 14px', borderRadius: 100,
          fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          color: '#AFE9FD', marginBottom: 16,
          fontFamily: 'Inter, sans-serif', fontWeight: 500,
        }}>
          <span style={{
            width: 5, height: 5, background: '#4ADE80', borderRadius: '50%',
            animation: 'pulse 2s infinite', boxShadow: '0 0 6px #4ADE80',
          }} />
          Audit Digital Gratuit — Résultat immédiat
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: isMobile ? '28px' : 'clamp(30px, 3.2vw, 44px)',
          fontWeight: 800, lineHeight: 1.15,
          color: '#FFFFFF', marginBottom: 12,
          letterSpacing: '-0.02em',
        }}>
          Des clients vous cherchent en ligne chaque jour.{' '}
          <span style={{ color: '#AFE9FD' }}>Êtes-vous visible ?</span>
        </h1>

        {/* Subline */}
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: 'rgba(175,233,253,0.75)',
          maxWidth: isMobile ? '100%' : 460,
          margin: '0 auto 22px',
          fontWeight: 300, lineHeight: 1.6,
          fontFamily: 'Inter, sans-serif',
        }}>
          Obtenez un diagnostic complet de votre présence digitale en 5 minutes.
          Score /100, recommandations prioritaires et rapport PDF offert.
        </p>

        {/* CTA */}
        <button
          onClick={() => router.push(startUrl)}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#085CF0', color: '#FFFFFF',
            padding: '12px 28px', borderRadius: 100,
            fontSize: 12, fontWeight: 600,
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '0.04em', textTransform: 'uppercase' as const,
            border: 'none', cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 36px rgba(8,92,240,0.4)',
            width: isMobile ? '100%' : 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1A6FF5'
            e.currentTarget.style.boxShadow = '0 0 52px rgba(8,92,240,0.6)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#085CF0'
            e.currentTarget.style.boxShadow = '0 0 36px rgba(8,92,240,0.4)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Lancer mon audit gratuit
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        {/* Trust row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: isMobile ? 10 : 24,
          marginTop: 20, flexWrap: 'wrap' as const,
        }}>
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: 'rgba(175,233,253,0.6)',
              fontFamily: 'Inter, sans-serif',
            }}>
              <span style={{ color: '#AFE9FD', opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex', gap: 1,
          marginTop: 24,
          border: '1px solid rgba(175,233,253,0.12)',
          borderRadius: 12, overflow: 'hidden',
          background: 'rgba(175,233,253,0.04)',
          maxWidth: isMobile ? '100%' : 480,
          marginLeft: 'auto', marginRight: 'auto',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              flex: 1,
              padding: isMobile ? '10px 6px' : '12px 14px',
              textAlign: 'center',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(175,233,253,0.08)' : 'none',
            }}>
              <span style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: isMobile ? 15 : 18,
                fontWeight: 700, color: '#FFFFFF', display: 'block',
              }}>{s.num}</span>
              <span style={{ fontSize: isMobile ? 9 : 10, color: 'rgba(175,233,253,0.5)', marginTop: 2, display: 'block' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
        * { box-sizing: border-box; }
      `}</style>
    </section>
  )
}

const TRUST_ITEMS = [
  { label: '3 minutes chrono', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> },
  { label: 'Résultat immédiat', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { label: 'Rapport PDF premium', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
  { label: '100% confidentiel', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
]

const STATS = [
  { num: '+200', label: 'Audits réalisés' },
  { num: '3 min', label: 'Temps moyen' },
  { num: '94%', label: 'Satisfaction client' },
]