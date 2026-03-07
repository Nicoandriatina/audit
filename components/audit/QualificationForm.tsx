'use client'

/**
 * QualificationForm.tsx — Étape 1 : qualification entreprise
 * Responsive : breakpoint 960px (sidebar cachée, layout colonne)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWindowWidth } from '@/lib/useWindowWidth'

export type ActivityType = 'B2B' | 'B2C'

export interface QualificationData {
  businessName: string
  city: string
  sector: string
  activityType: ActivityType
}

interface QualificationFormProps {
  onSubmit: (data: QualificationData) => void
  defaultValues?: Partial<QualificationData>
  showBack?: boolean
}

const SECTORS = [
  'Restauration & Hôtellerie', 'Commerce de détail', 'Services aux particuliers',
  'Services aux entreprises (B2B)', 'Artisanat & Bâtiment', 'Santé & Bien-être',
  'Professions libérales', 'Immobilier', 'Beauté & Esthétique', 'Sport & Fitness',
  'Éducation & Formation', 'Transport & Logistique', 'Autre',
]

export default function QualificationForm({ onSubmit, defaultValues, showBack = false }: QualificationFormProps) {
  const router = useRouter()
  const isMobile = useWindowWidth() < 960

  const [form, setForm] = useState<QualificationData>({
    businessName: defaultValues?.businessName ?? '',
    city: defaultValues?.city ?? '',
    sector: defaultValues?.sector ?? '',
    activityType: defaultValues?.activityType ?? 'B2C',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof QualificationData, string>>>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    if (!form.businessName.trim()) newErrors.businessName = 'Champ requis'
    if (!form.city.trim()) newErrors.city = 'Champ requis'
    if (!form.sector) newErrors.sector = 'Veuillez sélectionner un secteur'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => { if (validate()) onSubmit(form) }

  const inputStyle = (field: string, hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '9px 13px',
    background: '#FFFFFF',
    border: `1.5px solid ${hasError ? '#E03131' : focusedField === field ? '#085CF0' : 'rgba(9,38,118,0.12)'}`,
    borderRadius: 8, color: '#050A34', fontSize: 13,
    fontFamily: 'Inter, sans-serif', outline: 'none',
    appearance: 'none' as const, transition: 'all 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(8,92,240,0.08)' : 'none',
  })

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
      width: '100%',
      maxWidth: isMobile ? '100%' : 820,
      minHeight: 'calc(100vh - 64px)',
      animation: 'fadeUp 0.6s ease both',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* ── Sidebar (cachée sur mobile) ──────────────────────── */}
      {!isMobile && (
        <aside style={{
          background: '#050A34', padding: '36px 28px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: '#AFE9FD', marginBottom: 16, fontWeight: 500,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Processus en 3 étapes
          </div>
          <h3 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700,
            color: '#FFFFFF', marginBottom: 10, lineHeight: 1.2,
          }}>
            Votre diagnostic<br />commence ici
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(175,233,253,0.6)', lineHeight: 1.6, marginBottom: 24 }}>
            Ces informations personnalisent votre audit et adaptent le scoring à votre secteur.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SIDEBAR_STEPS.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 12, color: i === 0 ? '#FFFFFF' : 'rgba(175,233,253,0.4)',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `1px solid ${i === 0 ? 'transparent' : 'rgba(175,233,253,0.3)'}`,
                  background: i === 0 ? '#085CF0' : 'transparent',
                  color: i === 0 ? 'white' : 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* ── Form main ────────────────────────────────────────── */}
      <div style={{
        padding: isMobile ? '32px 20px' : '32px 36px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        background: '#F5F0E8', overflowY: 'auto',
      }}>

        {/* Mobile : étapes compactes en haut */}
        {isMobile && (
          <div style={{
            display: 'flex', gap: 8, marginBottom: 24,
            justifyContent: 'center',
          }}>
            {SIDEBAR_STEPS.map((_, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: i === 0 ? '#085CF0' : 'rgba(9,38,118,0.3)',
                fontFamily: 'Inter, sans-serif',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `1px solid ${i === 0 ? '#085CF0' : 'rgba(9,38,118,0.2)'}`,
                  background: i === 0 ? '#085CF0' : 'transparent',
                  color: i === 0 ? 'white' : 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700,
                }}>{i + 1}</span>
                {i < SIDEBAR_STEPS.length - 1 && (
                  <span style={{ width: 20, height: 1, background: 'rgba(9,38,118,0.15)' }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step tag */}
        <div style={{
          fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
          color: '#085CF0', marginBottom: 6, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 16, height: 2, background: '#085CF0', display: 'inline-block' }} />
          Étape 1 — Qualification
        </div>

        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 22 : 24, fontWeight: 700,
          color: '#050A34', marginBottom: 4,
        }}>Votre entreprise</h2>
        <p style={{ fontSize: 12, color: '#7A82A0', marginBottom: 18 }}>
          Renseignez les informations de base pour démarrer votre diagnostic personnalisé.
        </p>

        {/* Nom entreprise */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nom de l'entreprise</label>
          <input type="text" placeholder="Ex : Boulangerie Lefèvre" value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            onFocus={() => setFocusedField('businessName')} onBlur={() => setFocusedField(null)}
            style={inputStyle('businessName', !!errors.businessName)} />
          {errors.businessName && <p style={errorStyle}>{errors.businessName}</p>}
        </div>

        {/* Ville */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Ville</label>
          <input type="text" placeholder="Ex : Paris, Lyon, Genève…" value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            onFocus={() => setFocusedField('city')} onBlur={() => setFocusedField(null)}
            style={inputStyle('city', !!errors.city)} />
          {errors.city && <p style={errorStyle}>{errors.city}</p>}
        </div>

        {/* Secteur */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Secteur d'activité</label>
          <div style={{ position: 'relative' }}>
            <select value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              onFocus={() => setFocusedField('sector')} onBlur={() => setFocusedField(null)}
              style={{ ...inputStyle('sector', !!errors.sector), paddingRight: 36, cursor: 'pointer', color: form.sector ? '#050A34' : '#7A82A0' }}>
              <option value="">Sélectionner un secteur</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A82A0" strokeWidth="2"
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {errors.sector && <p style={errorStyle}>{errors.sector}</p>}
        </div>

        {/* Type B2B / B2C */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Type d'activité</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {ACTIVITY_TYPES.map((type) => (
              <button key={type.value} type="button"
                onClick={() => setForm({ ...form, activityType: type.value })}
                style={{
                  padding: '12px 14px',
                  border: `1.5px solid ${form.activityType === type.value ? '#085CF0' : 'rgba(9,38,118,0.12)'}`,
                  borderRadius: 10, cursor: 'pointer',
                  background: form.activityType === type.value ? 'rgba(8,92,240,0.04)' : '#FFFFFF',
                  display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
                  boxShadow: form.activityType === type.value ? '0 0 0 3px rgba(8,92,240,0.1)' : 'none',
                  textAlign: 'left' as const,
                }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(8,92,240,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#085CF0', flexShrink: 0,
                }}>{type.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#050A34' }}>{type.value}</div>
                  <div style={{ fontSize: 11, color: '#7A82A0', marginTop: 1 }}>{type.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
          <button type="button" onClick={handleSubmit} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: '#085CF0', color: '#FFFFFF',
            padding: '12px 28px', borderRadius: 100,
            fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
            fontFamily: 'Syne, sans-serif', letterSpacing: '0.04em',
            textTransform: 'uppercase' as const, transition: 'all 0.2s',
            boxShadow: '0 4px 16px rgba(8,92,240,0.25)',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1A6FF5' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#085CF0' }}>
            Démarrer l'audit
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          {showBack && (
            <button type="button" onClick={() => router.back()} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'none', color: '#7A82A0', padding: '10px 28px', borderRadius: 100,
              fontSize: 12, fontWeight: 500, border: '1.5px solid rgba(9,38,118,0.12)', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Retour
            </button>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        select option { color: #050A34; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase',
  color: '#7A82A0', marginBottom: 6, fontWeight: 500,
}
const errorStyle: React.CSSProperties = { fontSize: 11, color: '#E03131', marginTop: 4 }
const SIDEBAR_STEPS = ['Qualification entreprise', 'Audit 5 piliers digitaux', 'Résultat & rapport PDF']
const ACTIVITY_TYPES: Array<{ value: ActivityType; desc: string; icon: React.ReactNode }> = [
  {
    value: 'B2C', desc: 'Grand public',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>,
  },
  {
    value: 'B2B', desc: 'Professionnels',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  },
]