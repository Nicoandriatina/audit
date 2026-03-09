
'use client'

import type { JSX } from 'react'
import { useWindowWidth } from '@/lib/useWindowWidth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectorBenchmarkProps {
  score:           number
  sectorLabel:     string
  sectorTemplateId: string
  percentile:      number
  percentileLabel: string
  benchmarks: {
    avgScore:    number
    topQuartile: number
    median:      number
  }
  sectorTips: Record<string, string>
}

// ─── Piliers metadata ─────────────────────────────────────────────────────────

const PILIER_META: Record<string, { label: string; icon: JSX.Element }> = {
  social: {
    label: 'Réseaux sociaux',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
  },
  web: {
    label: 'Présence web & SEO',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
  },
  gbp: {
    label: 'Google Business',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  funnel: {
    label: 'Acquisition',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="22" y1="12" x2="18" y2="12"/>
        <line x1="6" y1="12" x2="2" y2="12"/>
        <line x1="12" y1="6" x2="12" y2="2"/>
        <line x1="12" y1="22" x2="12" y2="18"/>
      </svg>
    ),
  },
  branding: {
    label: 'Branding',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function SectorBenchmark({
  score,
  sectorLabel,
  percentile,
  percentileLabel,
  benchmarks,
  sectorTips,
}: SectorBenchmarkProps) {
  const isMobile = useWindowWidth() < 960
  const tips = Object.entries(sectorTips)

  // Couleur percentile
  const percentileColor =
    percentile >= 75 ? '#38A169' :
    percentile >= 50 ? '#3B82F6' :
    percentile >= 25 ? '#DD6B20' : '#E53E3E'

  return (
    <div style={{
      background:   '#FFFFFF',
      border:       '1.5px solid #E2E8F0',
      borderRadius: 16,
      padding:      isMobile ? '20px 16px' : '28px 32px',
      marginBottom: 24,
    }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            fontSize:      11,
            fontWeight:    700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:         '#718096',
          }}>
            Benchmark sectoriel
          </span>
          <span style={{
            fontSize:     11,
            fontWeight:   600,
            padding:      '2px 8px',
            borderRadius: 6,
            background:   '#EDF2F7',
            color:        '#4A5568',
            border:       '1px solid #E2E8F0',
          }}>
            {sectorLabel}
          </span>
        </div>
        <h3 style={{
          margin:     0,
          fontSize:   isMobile ? 17 : 20,
          fontWeight: 800,
          color:      '#1A202C',
        }}>
          {percentileLabel}
        </h3>
      </div>

      {/* ── Barre percentile ────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          position:     'relative',
          height:       12,
          background:   '#EDF2F7',
          borderRadius: 6,
          overflow:     'visible',
          marginBottom: 8,
        }}>
          {/* Zones colorées */}
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: '25%', background: 'rgba(229,62,62,0.15)', borderRadius: '6px 0 0 6px',
          }} />
          <div style={{
            position: 'absolute', left: '25%', top: 0, height: '100%',
            width: '25%', background: 'rgba(221,107,32,0.15)',
          }} />
          <div style={{
            position: 'absolute', left: '50%', top: 0, height: '100%',
            width: '25%', background: 'rgba(59,130,246,0.15)',
          }} />
          <div style={{
            position: 'absolute', left: '75%', top: 0, height: '100%',
            width: '25%', background: 'rgba(56,161,105,0.15)', borderRadius: '0 6px 6px 0',
          }} />

          {/* Curseur votre score */}
          <div style={{
            position:    'absolute',
            left:        `${Math.min(98, percentile)}%`,
            top:         '50%',
            transform:   'translate(-50%, -50%)',
            width:       18,
            height:      18,
            background:  percentileColor,
            borderRadius: '50%',
            border:      '3px solid white',
            boxShadow:   `0 0 0 2px ${percentileColor}`,
            transition:  'left 0.8s ease',
          }} />
        </div>

        {/* Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#718096' }}>
          <span>Bas du marché</span>
          <span>Médian</span>
          <span>Top 25%</span>
        </div>
      </div>

      {/* ── Comparaison scores ──────────────────────────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
        gap:                 10,
        marginBottom:        24,
      }}>
        <ScoreChip
          label="Votre score"
          value={score}
          color={percentileColor}
          highlight
        />
        <ScoreChip
          label="Moyenne secteur"
          value={benchmarks.avgScore}
          color="#718096"
        />
        <ScoreChip
          label="Top 25% secteur"
          value={benchmarks.topQuartile}
          color="#38A169"
        />
      </div>

      {/* ── Conseils sectoriels ──────────────────────────────────────────── */}
      {tips.length > 0 && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontWeight: 700, color: '#4A5568',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A5568" strokeWidth="2">
              <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8a6 6 0 00-12 0 4.65 4.65 0 001.5 3.5c.76.76 1.23 1.52 1.41 2.5"/>
            </svg>
            Priorités spécifiques à votre secteur
          </div>
          <div style={{
            display:   'flex',
            flexDirection: 'column',
            gap:       8,
          }}>
            {tips.map(([pilier, tip]) => {
              const meta = PILIER_META[pilier]
              if (!meta) return null
              return (
                <div key={pilier} style={{
                  display:      'flex',
                  gap:          10,
                  alignItems:   'flex-start',
                  padding:      '10px 12px',
                  background:   '#F7FAFC',
                  borderRadius: 8,
                  border:       '1px solid #E2E8F0',
                }}>
                  <span style={{ flexShrink: 0, color: '#4A5568', display: 'flex', alignItems: 'center' }}>{meta.icon}</span>
                  <div>
                    <div style={{
                      fontSize:   11,
                      fontWeight: 700,
                      color:      '#2D3748',
                      marginBottom: 2,
                    }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.4 }}>
                      {tip}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ScoreChip ────────────────────────────────────────────────────────────────

function ScoreChip({
  label,
  value,
  color,
  highlight = false,
}: {
  label:      string
  value:      number
  color:      string
  highlight?: boolean
}) {
  return (
    <div style={{
      padding:      '10px 12px',
      borderRadius: 10,
      background:   highlight ? 'rgba(255,255,255,0.9)' : '#F7FAFC',
      border:       highlight ? `1.5px solid ${color}` : '1px solid #E2E8F0',
      textAlign:    'center',
    }}>
      <div style={{
        fontSize:   20,
        fontWeight: 800,
        color,
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {value}<span style={{ fontSize: 12, fontWeight: 400 }}>/100</span>
      </div>
      <div style={{ fontSize: 11, color: '#718096' }}>{label}</div>
    </div>
  )
}