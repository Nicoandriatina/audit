'use client'

/**
 * UnlockForm.tsx
 * Formulaire de capture lead — déblocage du résultat complet.
 * Affiché sur fond navy à droite, avec l'aperçu flou à gauche.
 *
 * Usage :
 *   <UnlockForm
 *     auditId="clxxx"
 *     previewScore={72}
 *     onUnlocked={(data) => { ... }}
 *   />
 */

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeadData {
  fullName: string
  email: string
  phone: string
}

interface UnlockFormProps {
  auditId: string
  /** Score flou à afficher (pour l'effet teaser) */
  previewScore?: number
  /** Appelé une fois le lead validé et sauvegardé */
  onUnlocked: (lead: LeadData & { recommendations: unknown[]; audit: unknown }) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UnlockForm({ auditId, previewScore = 0, onUnlocked }: UnlockFormProps) {
  const [form, setForm] = useState<LeadData>({ fullName: '', email: '', phone: '' })
  const [errors, setErrors] = useState<Partial<LeadData>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Partial<LeadData> = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Champ requis'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Email invalide'
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 8)
      newErrors.phone = 'Numéro invalide'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch('/api/audit/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, ...form }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const data = await res.json()
      onUnlocked({ ...form, recommendations: data.recommendations, audit: data.audit })
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Erreur serveur. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  // ── Styles helpers ──────────────────────────────────────────────────────────
  const fieldStyle = (name: string, hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: `1.5px solid ${hasError ? '#EF4444' : focusedField === name ? '#085CF0' : 'rgba(175,233,253,0.15)'}`,
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'all 0.2s',
    boxShadow: focusedField === name ? '0 0 0 4px rgba(8,92,240,0.2)' : 'none',
  })

  return (
    <div style={{
      background: '#050A34',
      padding: '56px 48px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      minHeight: 'calc(100vh - 64px)',
    }}>

      {/* Score teaser */}
      <div style={{
        background: 'rgba(8,92,240,0.15)',
        border: '1px solid rgba(8,92,240,0.3)',
        borderRadius: 16, padding: '28px 24px',
        textAlign: 'center', marginBottom: 40,
      }}>
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(175,233,253,0.4)', fontWeight: 500 }}>
            Votre score
          </span>
        </div>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 72, fontWeight: 800,
          color: 'white',
          filter: 'blur(12px)',
          lineHeight: 1,
          userSelect: 'none' as const,
        }}>
          {previewScore || '??'}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(175,233,253,0.45)', marginTop: 10 }}>
          /100 — Résultat verrouillé
        </div>
      </div>

      {/* Lock icon + text */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
        }}>
          <span style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(8,92,240,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#AFE9FD',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </span>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700,
            color: '#FFFFFF', margin: 0,
          }}>
            Débloquez votre rapport
          </h2>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(175,233,253,0.55)', lineHeight: 1.7, margin: 0 }}>
          Votre analyse est prête. Entrez vos informations pour débloquer votre rapport complet et recevoir vos recommandations personnalisées.
        </p>
      </div>

      {/* Form fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {/* Nom */}
        <div>
          <label style={darkLabelStyle}>Nom complet</label>
          <input
            type="text"
            placeholder="Jean Dupont"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            onFocus={() => setFocusedField('fullName')}
            onBlur={() => setFocusedField(null)}
            style={fieldStyle('fullName', !!errors.fullName)}
          />
          {errors.fullName && <p style={darkErrorStyle}>{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label style={darkLabelStyle}>Adresse email</label>
          <input
            type="email"
            placeholder="jean@monentreprise.fr"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            style={fieldStyle('email', !!errors.email)}
          />
          {errors.email && <p style={darkErrorStyle}>{errors.email}</p>}
        </div>

        {/* Téléphone */}
        <div>
          <label style={darkLabelStyle}>Numéro de téléphone</label>
          <input
            type="tel"
            placeholder="+33 6 12 34 56 78"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
            style={fieldStyle('phone', !!errors.phone)}
          />
          {errors.phone && <p style={darkErrorStyle}>{errors.phone}</p>}
        </div>
      </div>

      {/* API error */}
      {apiError && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#FCA5A5', fontSize: 13,
        }}>
          {apiError}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: loading ? 'rgba(8,92,240,0.5)' : '#085CF0',
          color: 'white',
          padding: '16px 24px', borderRadius: 100,
          fontSize: 15, fontWeight: 600, border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'Syne, sans-serif',
          transition: 'all 0.2s',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(8,92,240,0.3)',
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#1A6FF5' }}
        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#085CF0' }}
      >
        {loading ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Chargement…
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Débloquer mon rapport complet
          </>
        )}
      </button>

      {/* Privacy note */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginTop: 14, fontSize: 12, color: 'rgba(175,233,253,0.3)',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Vos données sont confidentielles et ne seront jamais revendues.
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=Inter:wght@400;500&display=swap');
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        input::placeholder { color: rgba(175,233,253,0.25) !important; }
      `}</style>
    </div>
  )
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const darkLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase',
  color: 'rgba(175,233,253,0.45)', marginBottom: 8, fontWeight: 500,
}

const darkErrorStyle: React.CSSProperties = {
  fontSize: 12, color: '#FCA5A5', marginTop: 5,
}