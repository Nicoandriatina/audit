'use client'

/**
 * RadarChart.tsx
 * Radar chart des 5 piliers — utilise Recharts.
 * Dépendance : npm install recharts
 *
 * Usage :
 *   <RadarChart scores={{ social: 14, web: 10, gbp: 16, funnel: 10, branding: 15 }} />
 */

import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RadarScores {
  social: number
  web: number
  gbp: number
  funnel: number
  branding: number
}

interface RadarChartProps {
  scores: RadarScores
  /** Hauteur du conteneur. Default : 300 */
  height?: number
}

// ─── Tooltip personnalisé ─────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { subject: string } }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={{
      background: '#050A34',
      border: '1px solid rgba(175,233,253,0.2)',
      borderRadius: 10,
      padding: '10px 16px',
      fontSize: 13,
      fontFamily: 'Inter, sans-serif',
      boxShadow: '0 8px 32px rgba(5,10,52,0.3)',
    }}>
      <div style={{ color: 'rgba(175,233,253,0.6)', marginBottom: 4, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
        {item.payload.subject}
      </div>
      <div style={{ color: '#FFFFFF', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20 }}>
        {item.value}<span style={{ color: 'rgba(175,233,253,0.4)', fontSize: 13, fontWeight: 400 }}>/20</span>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RadarChart({ scores, height = 300 }: RadarChartProps) {
  const data = [
    { subject: 'Réseaux sociaux', value: scores.social, fullMark: 20 },
    { subject: 'Web & SEO', value: scores.web, fullMark: 20 },
    { subject: 'Google Business', value: scores.gbp, fullMark: 20 },
    { subject: 'Funnel', value: scores.funnel, fullMark: 20 },
    { subject: 'Branding', value: scores.branding, fullMark: 20 },
  ]

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1.5px solid rgba(9,38,118,0.1)',
      borderRadius: 16,
      padding: '28px 20px',
      boxShadow: '0 2px 12px rgba(5,10,52,0.08)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#085CF0' }} />
        <span style={{
          fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#092676',
        }}>
          Vue d'ensemble — 5 piliers
        </span>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadar data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid
              gridType="polygon"
              stroke="rgba(9,38,118,0.08)"
              strokeWidth={1}
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                fill: '#7A82A0',
                fontWeight: 500,
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 20]}
              tick={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fill: '#C5CADB' }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#085CF0"
              fill="#085CF0"
              fillOpacity={0.12}
              strokeWidth={2}
              dot={{ r: 4, fill: '#085CF0', strokeWidth: 2, stroke: '#FFFFFF' }}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Tooltip content={<CustomTooltip />} />
          </RechartsRadar>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 24,
        marginTop: 16, flexWrap: 'wrap' as const,
      }}>
        {data.map((d) => (
          <div key={d.subject} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: '#7A82A0',
            fontFamily: 'Inter, sans-serif',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: getPilierDotColor(d.value) }} />
            {d.subject}
            <span style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#050A34', fontSize: 12,
            }}>
              {d.value}/20
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=Inter:wght@400;500&display=swap');
      `}</style>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPilierDotColor(score: number): string {
  const pct = (score / 20) * 100
  if (pct < 40) return '#E03131'
  if (pct < 65) return '#E8890C'
  return '#2B9348'
}