'use client'

/**
 * Recommendations.tsx
 * Affiche les 3 recommandations prioritaires générées par /api/audit/unlock.
 * Format : problème identifié + impact business + action concrète.
 *
 * Usage :
 *   <Recommendations items={recommendations} />
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Recommendation {
  pillar: string
  problem: string
  businessImpact: string
  action: string
  priority: number
}

interface RecommendationsProps {
  items: Recommendation[]
}

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG = [
  {
    bg: 'rgba(224,49,49,0.08)',
    color: '#E03131',
    border: 'rgba(224,49,49,0.2)',
    label: 'Priorité 1',
    badgeIcon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    bg: 'rgba(232,137,12,0.08)',
    color: '#E8890C',
    border: 'rgba(232,137,12,0.2)',
    label: 'Priorité 2',
    badgeIcon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    bg: 'rgba(8,92,240,0.06)',
    color: '#085CF0',
    border: 'rgba(8,92,240,0.2)',
    label: 'Priorité 3',
    badgeIcon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Recommendations({ items }: RecommendationsProps) {
  if (!items || items.length === 0) return null

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#085CF0' }} />
        <span style={{
          fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#092676',
        }}>
          Recommandations prioritaires
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.slice(0, 3).map((reco, i) => {
          const cfg = PRIORITY_CONFIG[i] ?? PRIORITY_CONFIG[2]
          return (
            <RecoCard key={i} reco={reco} cfg={cfg} index={i} />
          )
        })}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Single reco card ─────────────────────────────────────────────────────────

function RecoCard({
  reco,
  cfg,
  index,
}: {
  reco: Recommendation
  cfg: typeof PRIORITY_CONFIG[0]
  index: number
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1.5px solid rgba(9,38,118,0.1)',
        borderRadius: 14, padding: '20px 24px',
        display: 'flex', gap: 16,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: '0 2px 12px rgba(5,10,52,0.06)',
        animation: `fadeUp 0.5s ease ${index * 0.1}s both`,
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#085CF0'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(5,10,52,0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(9,38,118,0.1)'
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(5,10,52,0.06)'
      }}
    >
      {/* Priority badge */}
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
        marginTop: 2,
      }}>
        {cfg.badgeIcon}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {/* Pillar tag */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          color: cfg.color, fontWeight: 600, marginBottom: 8,
          background: cfg.bg, padding: '3px 10px', borderRadius: 100,
        }}>
          {reco.pillar}
        </div>

        {/* Problem */}
        <div style={{
          fontSize: 15, fontWeight: 600, color: '#050A34', marginBottom: 6,
          lineHeight: 1.4,
        }}>
          {reco.problem}
        </div>

        {/* Business impact */}
        <div style={{
          fontSize: 13, color: '#7A82A0', marginBottom: 12, lineHeight: 1.6,
          display: 'flex', alignItems: 'flex-start', gap: 6,
        }}>
          <span style={{ flexShrink: 0, color: cfg.color, marginTop: 2 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </span>
          <span><strong style={{ color: '#3A4060', fontWeight: 600 }}>Impact : </strong>{reco.businessImpact}</span>
        </div>

        {/* Action */}
        <div style={{
          fontSize: 13, color: '#085CF0', fontWeight: 500,
          display: 'flex', alignItems: 'flex-start', gap: 6,
          background: 'rgba(8,92,240,0.04)',
          padding: '10px 14px', borderRadius: 8,
          border: '1px solid rgba(8,92,240,0.1)',
        }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
          <span><strong>Action : </strong>{reco.action}</span>
        </div>
      </div>
    </div>
  )
}