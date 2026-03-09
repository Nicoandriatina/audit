'use client'

import { useState } from 'react'
import { useWindowWidth } from '@/lib/useWindowWidth'
import type { CompetitorResult, CompetitorsAnalysis } from '@/lib/competitors'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CompetitorCardProps {
  analysis:     CompetitorsAnalysis
  clientScore:  number
  businessName: string
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function CompetitorCard({
  analysis,
  clientScore,
  businessName,
}: CompetitorCardProps) {
  const isMobile = useWindowWidth() < 960
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const { competitors, clientRank, summary, gapToLeader, avgCompetitorScore } = analysis

  // ── Couleur du rank ───────────────────────────────────────────────────────
  const rankConfig = {
    1: { label: `🏆 1ᵉʳ de votre marché`, bg: 'rgba(43,147,72,0.12)', color: '#2B9348', border: 'rgba(43,147,72,0.25)' },
    2: { label: `2ᵉ position`, bg: 'rgba(232,160,32,0.10)', color: '#B87A00', border: 'rgba(232,160,32,0.25)' },
    3: { label: `3ᵉ position`, bg: 'rgba(232,160,32,0.10)', color: '#B87A00', border: 'rgba(232,160,32,0.25)' },
    4: { label: `4ᵉ position`, bg: 'rgba(224,49,49,0.08)', color: '#C92A2A', border: 'rgba(224,49,49,0.20)' },
  }
  const rank = rankConfig[clientRank as keyof typeof rankConfig] ?? rankConfig[4]

  // ── Tous les joueurs pour les barres ──────────────────────────────────────
  const allPlayers = [
    {
      name: businessName.length > 18 ? businessName.slice(0, 16) + '…' : businessName,
      score: clientScore,
      isClient: true,
      color: '#085CF0',
      borderColor: '#085CF0',
    },
    ...competitors.map((c) => ({
      name: c.name.length > 20 ? c.name.slice(0, 18) + '…' : c.name,
      score: c.score,
      isClient: false,
      color: c.rankColor,
      borderColor: 'transparent',
      competitor: c,
    })),
  ].sort((a, b) => b.score - a.score)

  const maxScore = Math.max(...allPlayers.map((p) => p.score), 100)

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1.5px solid rgba(9,38,118,0.1)',
      borderRadius: 16,
      padding: isMobile ? 20 : 28,
      boxShadow: '0 2px 12px rgba(5,10,52,0.06)',
    }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(8,92,240,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#085CF0" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          color: '#085CF0',
        }}>
          Concurrents locaux
        </span>
      </div>

      {/* ── Rank badge ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: rank.bg,
        border: `1px solid ${rank.border}`,
        borderRadius: 100,
        padding: '7px 14px',
        marginBottom: 20,
      }}>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700,
          color: rank.color,
        }}>
          {rank.label}
        </span>
      </div>

      {/* ── Barres de score ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {allPlayers.map((player, i) => {
          const barWidth = (player.score / maxScore) * 100
          const isHovered = !player.isClient && hoveredIndex === i
          const competitorData = !player.isClient ? (player as typeof allPlayers[1]).competitor : null

          return (
            <div
              key={i}
              style={{ cursor: competitorData ? 'pointer' : 'default' }}
              onMouseEnter={() => !player.isClient && setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Ligne nom + score */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Indicateur client */}
                  {player.isClient && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                      background: '#085CF0', color: 'white',
                      padding: '2px 7px', borderRadius: 100,
                      fontFamily: 'Inter, sans-serif',
                    }}>
                      VOUS
                    </span>
                  )}
                  <span style={{
                    fontSize: 12,
                    fontWeight: player.isClient ? 600 : 400,
                    color: player.isClient ? '#050A34' : '#7A82A0',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {player.name}
                  </span>
                  {/* Rank label du concurrent */}
                  {competitorData && (
                    <span style={{
                      fontSize: 10, fontWeight: 500,
                      color: competitorData.rankColor,
                      fontFamily: 'Inter, sans-serif',
                    }}>
                      {competitorData.rankLabel === 'En avance' ? '↓' :
                       competitorData.rankLabel === 'À dépasser' ? '↑' : '→'}
                    </span>
                  )}
                </div>
                <span style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: player.isClient ? 14 : 12,
                  fontWeight: 700,
                  color: player.isClient ? '#085CF0' : '#7A82A0',
                }}>
                  {player.score}
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#9BA3BC' }}>/100</span>
                </span>
              </div>

              {/* Barre de progression */}
              <div style={{
                height: player.isClient ? 8 : 6,
                background: 'rgba(9,38,118,0.06)',
                borderRadius: 100,
                overflow: 'hidden',
                transition: 'opacity 0.2s',
                opacity: isHovered ? 0.85 : 1,
              }}>
                <div style={{
                  height: '100%',
                  width: `${barWidth}%`,
                  background: player.isClient
                    ? 'linear-gradient(90deg, #085CF0 0%, #4A8FFF 100%)'
                    : player.color,
                  borderRadius: 100,
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: player.isClient ? 1 : 0.65,
                }} />
              </div>

              {/* Tooltip survol — points forts/faibles du concurrent */}
              {isHovered && competitorData && (
                <div style={{
                  marginTop: 8, padding: '10px 12px',
                  background: '#F8F7F5',
                  border: '1px solid rgba(9,38,118,0.08)',
                  borderRadius: 10,
                  animation: 'fadeUp 0.15s ease both',
                }}>
                  {competitorData.strengths.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 4 }}>
                      {competitorData.strengths.map((s, si) => (
                        <span key={si} style={{
                          fontSize: 10, color: '#2B9348',
                          background: 'rgba(43,147,72,0.08)',
                          border: '1px solid rgba(43,147,72,0.15)',
                          padding: '2px 8px', borderRadius: 100,
                          fontFamily: 'Inter, sans-serif',
                        }}>
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {competitorData.weaknesses.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                      {competitorData.weaknesses.map((w, wi) => (
                        <span key={wi} style={{
                          fontSize: 10, color: '#C92A2A',
                          background: 'rgba(224,49,49,0.06)',
                          border: '1px solid rgba(224,49,49,0.12)',
                          padding: '2px 8px', borderRadius: 100,
                          fontFamily: 'Inter, sans-serif',
                        }}>
                          ✗ {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Métriques rapides ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 8, marginBottom: 16,
      }}>
        <MetricChip
          label="Moy. concurrents"
          value={`${avgCompetitorScore}/100`}
          delta={clientScore - avgCompetitorScore}
        />
        <MetricChip
          label="Écart au leader"
          value={gapToLeader === 0 ? '—' : `${gapToLeader} pts`}
          delta={gapToLeader === 0 ? 1 : -gapToLeader}
          invertDelta
        />
      </div>

      {/* ── Résumé textuel ───────────────────────────────────────────────── */}
      <div style={{
        padding: '12px 14px',
        background: 'rgba(9,38,118,0.04)',
        border: '1px solid rgba(9,38,118,0.08)',
        borderRadius: 10,
        marginBottom: 12,
      }}>
        <p style={{
          fontSize: 12, color: '#3D4A6B', lineHeight: 1.6,
          fontFamily: 'Inter, sans-serif', margin: 0,
        }}>
          {summary}
        </p>
      </div>

      {/* ── Note méthodologique ──────────────────────────────────────────── */}
      <p style={{
        fontSize: 10, color: '#9BA3BC', fontFamily: 'Inter, sans-serif',
        lineHeight: 1.5, margin: 0,
        display: 'flex', alignItems: 'flex-start', gap: 4,
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
        </svg>
        Estimations basées sur les benchmarks sectoriels de votre zone géographique.
      </p>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Sub-composants ───────────────────────────────────────────────────────────

function MetricChip({
  label,
  value,
  delta,
  invertDelta = false,
}: {
  label:        string
  value:        string
  delta:        number
  invertDelta?: boolean
}) {
  const positive = invertDelta ? delta <= 0 : delta > 0
  const neutral  = Math.abs(delta) <= 2

  const chipColor = neutral ? '#7A82A0' : positive ? '#2B9348' : '#E03131'
  const chipBg    = neutral
    ? 'rgba(122,130,160,0.06)'
    : positive
      ? 'rgba(43,147,72,0.06)'
      : 'rgba(224,49,49,0.06)'

  return (
    <div style={{
      padding: '10px 12px',
      background: chipBg,
      borderRadius: 10,
      border: `1px solid ${chipColor}22`,
    }}>
      <span style={{
        display: 'block', fontSize: 10, color: '#9BA3BC',
        fontFamily: 'Inter, sans-serif', marginBottom: 3,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
        color: chipColor,
      }}>
        {value}
      </span>
    </div>
  )
}