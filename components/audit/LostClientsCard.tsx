'use client'

import { useState } from 'react'
import { useWindowWidth } from '@/lib/useWindowWidth'
import type { LostClientsEstimate } from '@/lib/lost-clients'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LostClientsCardProps {
  estimate:    LostClientsEstimate
  headline:    string
  subline:     string
  urgency:     'critical' | 'high' | 'medium'
  sector:      string
  city?:       string
  /** Si true, on affiche le détail des hypothèses (accordéon) */
  showDetails?: boolean
}

// ─── Palette urgence ──────────────────────────────────────────────────────────

// SVG icons for urgency badges
const URGENCY_ICONS = {
  critical: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  high: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  medium: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
}

const URGENCY_STYLES = {
  critical: {
    border:      '#E53E3E',
    bg:          'rgba(229, 62, 62, 0.06)',
    badge:       { bg: '#FFF5F5', color: '#C53030', border: '#FEB2B2' },
    label:       'Alerte critique',
    barColor:    '#E53E3E',
  },
  high: {
    border:      '#DD6B20',
    bg:          'rgba(221, 107, 32, 0.06)',
    badge:       { bg: '#FFFAF0', color: '#C05621', border: '#FBD38D' },
    label:       'Impact élevé',
    barColor:    '#DD6B20',
  },
  medium: {
    border:      '#3B82F6',
    bg:          'rgba(59, 130, 246, 0.06)',
    badge:       { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    label:       'Potentiel identifié',
    barColor:    '#3B82F6',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCHF(amount: number): string {
  if (amount >= 1_000_000) return `CHF ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `CHF ${Math.round(amount / 1_000)}k`
  return `CHF ${amount.toLocaleString('fr-CH')}`
}

function ConversionBar({
  estimated,
  sectorAvg,
  barColor,
}: {
  estimated:  number
  sectorAvg:  number
  barColor:   string
}) {
  const maxRate    = sectorAvg * 2
  const estPct     = Math.min(100, (estimated  / maxRate) * 100)
  const avgPct     = Math.min(100, (sectorAvg  / maxRate) * 100)

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#718096' }}>Votre taux de conversion estimé</span>
        <span style={{ fontSize: 12, color: '#718096' }}>Moyenne sectorielle</span>
      </div>
      <div style={{
        position: 'relative',
        height: 8,
        background: '#EDF2F7',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {/* Barre votre taux */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${estPct}%`,
          background: barColor,
          borderRadius: 4,
          transition: 'width 0.8s ease',
        }} />
        {/* Marqueur moyenne sectorielle */}
        <div style={{
          position: 'absolute',
          left: `${avgPct}%`,
          top: -2,
          bottom: -2,
          width: 2,
          background: '#2D3748',
          borderRadius: 1,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: barColor, fontWeight: 600 }}>
          {(estimated * 100).toFixed(1)}%
        </span>
        <span style={{ fontSize: 11, color: '#4A5568', fontWeight: 600 }}>
          {(sectorAvg * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function LostClientsCard({
  estimate,
  headline,
  subline,
  urgency,
  sector,
  city,
  showDetails = false,
}: LostClientsCardProps) {
  const isMobile = useWindowWidth() < 960
  const [detailsOpen, setDetailsOpen] = useState(false)
  const style = URGENCY_STYLES[urgency]

  const {
    yearlyLostRevenue,
    yearlyPotentialGain,
    monthlyLostLeads,
    range,
    estimatedConversionRate,
    sectorAvgConversionRate,
    estimatedMonthlyTraffic,
    hypotheses,
  } = estimate

  return (
    <div style={{
      border:       `1.5px solid ${style.border}`,
      background:   style.bg,
      borderRadius: 16,
      padding:      isMobile ? '20px 16px' : '28px 32px',
      marginBottom: 24,
    }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: isMobile ? 44 : 52, height: isMobile ? 44 : 52,
          borderRadius: 12, background: style.bg,
          border: `1.5px solid ${style.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width={isMobile ? 22 : 26} height={isMobile ? 22 : 26} viewBox="0 0 24 24" fill="none" stroke={style.barColor} strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize:     11,
              fontWeight:   700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding:      '2px 8px',
              borderRadius: 6,
              background:   style.badge.bg,
              color:        style.badge.color,
              border:       `1px solid ${style.badge.border}`,
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>{URGENCY_ICONS[urgency]}</span> {style.label}
            </span>
            <span style={{ fontSize: 11, color: '#718096' }}>{sector}</span>
          </div>
          <h3 style={{
            margin:     0,
            fontSize:   isMobile ? 18 : 22,
            fontWeight: 800,
            color:      '#1A202C',
            lineHeight: 1.2,
          }}>
            {headline}
          </h3>
          <p style={{
            margin:     '6px 0 0',
            fontSize:   isMobile ? 13 : 14,
            color:      '#4A5568',
            lineHeight: 1.5,
          }}>
            {subline}
          </p>
        </div>
      </div>

      {/* ── Métriques clés ─────────────────────────────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
        gap:                 12,
        marginBottom:        20,
      }}>
        <MetricBox
          value={formatCHF(yearlyLostRevenue)}
          label="CA annuel non capturé"
          sub={`fourchette : ${formatCHF(range.low)} – ${formatCHF(range.high)}`}
          highlight
          color={style.barColor}
        />
        <MetricBox
          value={`${monthlyLostLeads}`}
          label="clients perdus / mois"
          sub="vers vos concurrents"
        />
        {!isMobile && (
          <MetricBox
            value={formatCHF(yearlyPotentialGain)}
            label="potentiel si top sectoriel"
            sub="gain annuel estimé"
            color="#38A169"
          />
        )}
      </div>

      {/* ── Barre conversion ────────────────────────────────────────────── */}
      <ConversionBar
        estimated={estimatedConversionRate}
        sectorAvg={sectorAvgConversionRate}
        barColor={style.barColor}
      />

      {/* ── Potentiel sur mobile ─────────────────────────────────────────── */}
      {isMobile && (
        <div style={{
          marginTop:    12,
          padding:      '10px 14px',
          background:   'rgba(56, 161, 105, 0.08)',
          border:       '1px solid rgba(56, 161, 105, 0.3)',
          borderRadius: 8,
          display:      'flex',
          justifyContent: 'space-between',
          alignItems:   'center',
        }}>
          <span style={{ fontSize: 12, color: '#276749' }}>Potentiel si top sectoriel</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#276749' }}>
            {formatCHF(yearlyPotentialGain)}/an
          </span>
        </div>
      )}

      {/* ── Trafic estimé ───────────────────────────────────────────────── */}
      <div style={{
        marginTop:    14,
        padding:      '8px 12px',
        background:   'rgba(113, 128, 150, 0.08)',
        borderRadius: 8,
        fontSize:     12,
        color:        '#4A5568',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4A5568" strokeWidth="2" style={{ flexShrink: 0 }}>
            <rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/>
          </svg>
          Volume estimé : <strong style={{ margin: '0 2px' }}>{estimatedMonthlyTraffic.toLocaleString('fr-CH')}</strong> recherches locales/mois
          {city ? ` autour de ${city}` : ''} dans votre secteur
        </span>
      </div>

      {/* ── Accordéon hypothèses ─────────────────────────────────────────── */}
      {showDetails && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            style={{
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              fontSize:   12,
              color:      '#718096',
              padding:    0,
              display:    'flex',
              alignItems: 'center',
              gap:        4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.2s', transform: detailsOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg> Voir les hypothèses de calcul
          </button>

          {detailsOpen && (
            <ul style={{
              marginTop:   10,
              paddingLeft: 16,
              listStyle:   'disc',
            }}>
              {hypotheses.map((h, i) => (
                <li key={i} style={{
                  fontSize:    12,
                  color:       '#718096',
                  marginBottom: 4,
                  lineHeight:  1.5,
                }}>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ─── MetricBox ────────────────────────────────────────────────────────────────

function MetricBox({
  value,
  label,
  sub,
  highlight = false,
  color,
}: {
  value:      string
  label:      string
  sub:        string
  highlight?: boolean
  color?:     string
}) {
  return (
    <div style={{
      background:   highlight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)',
      borderRadius: 10,
      padding:      '12px 14px',
      border:       '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{
        fontSize:   18,
        fontWeight: 800,
        color:      color ?? '#2D3748',
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: '#718096' }}>{sub}</div>
    </div>
  )
}