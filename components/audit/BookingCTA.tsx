'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingCTAProps {
  /** URL Cal.com complète ou chemin relatif */
  calLink?: string
  /** "popup" = embed Cal.com | "redirect" = nouvelle page */
  mode?: 'popup' | 'redirect'
  /** Score pour personnaliser le message */
  score?: number
  /** ID audit pour pré-remplir Cal.com */
  auditId?: string
  /** Nom de l'entreprise */
  businessName?: string
  /** Callback optionnel déclenché au clic */
  onBookingClick?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingCTA({
  calLink = process.env.NEXT_PUBLIC_CAL_LINK ?? 'https://cal.com/cabinet-stratege',
  mode = 'redirect',
  score,
  auditId,
  businessName,
  onBookingClick,
}: BookingCTAProps) {
  const [showPopup, setShowPopup] = useState(false)

  const handleBooking = () => {
    onBookingClick?.()
    if (mode === 'popup') {
      setShowPopup(true)
    } else {
      // Construire l'URL avec paramètres pré-remplis
      const url = new URL(calLink)
      if (auditId) url.searchParams.set('notes', `Audit ID: ${auditId}`)
      if (businessName) url.searchParams.set('name', businessName)
      window.open(url.toString(), '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
      <div style={{
        background: '#050A34',
        borderRadius: 16,
        padding: '36px',
        fontFamily: 'Inter, sans-serif',
        border: '1px solid rgba(8,92,240,0.2)',
        boxShadow: '0 0 0 1px rgba(175,233,253,0.06)',
      }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(8,92,240,0.2)', color: '#AFE9FD',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>

        {/* Score reminder */}
        {score !== undefined && (
          <div style={{
            textAlign: 'center',
            marginBottom: 16,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
              color: score < 40 ? '#EF4444' : score < 70 ? '#F97316' : '#22C55E',
              background: score < 40 ? 'rgba(239,68,68,0.1)' : score < 70 ? 'rgba(249,115,22,0.1)' : 'rgba(34,197,94,0.1)',
              padding: '5px 14px', borderRadius: 100,
              fontWeight: 600, fontFamily: 'Syne, sans-serif',
            }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800 }}>
                {score}/100
              </span>
              — {score < 40 ? 'Invisible en ligne' : score < 70 ? 'Potentiel non exploité' : 'À optimiser'}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700,
          color: '#FFFFFF', marginBottom: 10, textAlign: 'center',
          lineHeight: 1.3,
        }}>
          Explication stratégique<br />gratuite de votre audit
        </h3>

        {/* Sub */}
        <p style={{
          fontSize: 13, color: 'rgba(175,233,253,0.55)',
          lineHeight: 1.7, marginBottom: 28, textAlign: 'center',
        }}>
          Réservez 30 minutes avec un expert Cabinet Stratège pour analyser vos résultats
          et définir vos 3 priorités business. <strong style={{ color: 'rgba(175,233,253,0.75)' }}>Offert, sans engagement.</strong>
        </p>

        {/* Trust items */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28,
        }}>
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, color: 'rgba(175,233,253,0.55)',
            }}>
              <span style={{ color: '#4ADE80', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              {item}
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handleBooking}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: '#085CF0', color: 'white',
            border: 'none', borderRadius: 100,
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Syne, sans-serif',
            transition: 'all 0.2s',
            marginBottom: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 20px rgba(8,92,240,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1A6FF5'
            e.currentTarget.style.boxShadow = '0 4px 28px rgba(8,92,240,0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#085CF0'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(8,92,240,0.3)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Réserver mon diagnostic gratuit
        </button>

        {/* Secondary: Download PDF */}
        <a
          href={auditId ? `/api/pdf/${auditId}` : '#'}
          download
          style={{
            width: '100%',
            padding: '13px 24px',
            background: 'none', color: 'rgba(175,233,253,0.6)',
            border: '1px solid rgba(175,233,253,0.15)', borderRadius: 100,
            fontSize: 13,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(175,233,253,0.4)'
            e.currentTarget.style.color = '#AFE9FD'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(175,233,253,0.15)'
            e.currentTarget.style.color = 'rgba(175,233,253,0.6)'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Télécharger le rapport PDF
        </a>
      </div>

      {/* ── Cal.com popup modal ──────────────────────────────────── */}
      {showPopup && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowPopup(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(5,10,52,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            width: '100%', maxWidth: 800,
            height: '80vh', maxHeight: 700,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(5,10,52,0.4)',
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowPopup(false)}
              style={{
                position: 'absolute', top: 16, right: 16, zIndex: 10,
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid rgba(9,38,118,0.15)',
                background: '#FFFFFF', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#7A82A0', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F0E8' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Cal.com iframe */}
            <iframe
              src={calLink}
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ display: 'block' }}
              title="Réservation diagnostic stratégique"
            />
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500&display=swap');
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  '30 minutes d\'analyse personnalisée avec un expert',
  'Explication de chaque point de votre score',
  'Plan d\'action sur-mesure adapté à votre budget',
  'Sans engagement — 100% offert',
]