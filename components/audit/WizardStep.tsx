'use client'

/**
 * WizardStep.tsx — Conteneur générique pour chaque étape du wizard.
 * Responsive : breakpoint 960px (sidebar cachée, barre de progression mobile)
 */

import React from 'react'
import { useWindowWidth } from '@/lib/useWindowWidth'

export interface PilierConfig {
  name: string
  score: string
  icon: React.ReactNode
}

interface WizardStepProps {
  currentStep: number
  totalSteps?: number
  piliers: PilierConfig[]
  onNext: () => void
  onPrev: () => void
  isLastStep?: boolean
  isNextDisabled?: boolean
  children: React.ReactNode
}

export default function WizardStep({
  currentStep, piliers, onNext, onPrev,
  isLastStep = false, isNextDisabled = false, children,
}: WizardStepProps) {
  const isMobile = useWindowWidth() < 960
  const minutesLeft = Math.max(1, piliers.length - currentStep)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
      minHeight: 'calc(100vh - 64px)',
      animation: 'fadeUp 0.5s ease both',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* ── Sidebar (desktop uniquement) ─────────────────────── */}
      {!isMobile && (
        <aside style={{
          background: '#050A34', padding: '48px 28px',
          position: 'sticky', top: 64, height: 'calc(100vh - 64px)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          <div style={{
            fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' as const,
            color: 'rgba(175,233,253,0.4)', marginBottom: 28, fontWeight: 500,
          }}>Piliers d'analyse</div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {piliers.map((p, i) => {
              const isDone = i < currentStep
              const isActive = i === currentStep
              return (
                <li key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 14px', borderRadius: 10, fontSize: 13,
                  color: isActive ? '#FFFFFF' : isDone ? 'rgba(175,233,253,0.6)' : 'rgba(175,233,253,0.35)',
                  background: isActive ? 'rgba(8,92,240,0.25)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(8,92,240,0.4)' : 'transparent'}`,
                  transition: 'all 0.2s', userSelect: 'none' as const,
                }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? '#085CF0' : isDone ? 'rgba(43,147,72,0.2)' : 'rgba(175,233,253,0.06)',
                    color: isActive ? 'white' : isDone ? '#4ADE80' : 'inherit',
                    transition: 'all 0.2s',
                  }}>{p.icon}</span>
                  <span style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11, marginTop: 1, color: isActive ? 'rgba(175,233,253,0.7)' : 'rgba(175,233,253,0.3)' }}>
                      {p.score}
                    </div>
                  </span>
                  {isDone && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </li>
              )
            })}
          </ul>

          <div style={{ paddingTop: 24, borderTop: '1px solid rgba(175,233,253,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(175,233,253,0.4)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              Environ {minutesLeft} minute{minutesLeft > 1 ? 's' : ''} restante{minutesLeft > 1 ? 's' : ''}
            </div>
          </div>
        </aside>
      )}

      {/* ── Main content ─────────────────────────────────────── */}
      <main style={{
        padding: isMobile ? '24px 20px' : '48px 60px',
        maxWidth: isMobile ? '100%' : 720,
        width: '100%',
        background: '#F5F0E8',
        overflowY: 'auto',
      }}>

        {/* Mobile : barre de progression horizontale */}
        {isMobile && (
          <div style={{ marginBottom: 24 }}>
            {/* Pilier actif label */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: '#085CF0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', flexShrink: 0,
                }}>
                  {piliers[currentStep]?.icon}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#050A34', fontFamily: 'Syne, sans-serif' }}>
                  {piliers[currentStep]?.name}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#7A82A0', fontWeight: 500 }}>
                {currentStep + 1}/{piliers.length}
              </span>
            </div>

            {/* Barre de progression */}
            <div style={{
              display: 'flex', gap: 4,
            }}>
              {piliers.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i < currentStep ? '#092676' : i === currentStep ? '#085CF0' : '#EDE8DF',
                  transition: 'background 0.3s ease',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Desktop : dots + counter */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 48,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {piliers.map((_, i) => (
                <div key={i} style={{
                  height: 8, borderRadius: i === currentStep ? 4 : '50%',
                  width: i === currentStep ? 24 : 8,
                  background: i < currentStep ? '#092676' : i === currentStep ? '#085CF0' : '#EDE8DF',
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: '#7A82A0', fontWeight: 500 }}>
              Pilier {currentStep + 1} / {piliers.length}
            </span>
          </div>
        )}

        {/* Step content */}
        <div key={currentStep} style={{ animation: 'fadeUp 0.4s ease both' }}>
          {children}
        </div>

        {/* Footer nav */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: isMobile ? 32 : 48,
          paddingTop: isMobile ? 20 : 28,
          borderTop: '1.5px solid rgba(9,38,118,0.12)',
          gap: 12,
        }}>
          <button type="button" onClick={onPrev} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: isMobile ? '12px 18px' : '12px 24px',
            border: '1.5px solid rgba(9,38,118,0.12)', borderRadius: 100,
            background: 'none', color: '#7A82A0', fontSize: 14, cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
            flex: isMobile ? 1 : 'none',
            justifyContent: 'center',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#050A34'; e.currentTarget.style.color = '#050A34' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(9,38,118,0.12)'; e.currentTarget.style.color = '#7A82A0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Retour
          </button>

          <button type="button" onClick={onNext} disabled={isNextDisabled} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: isNextDisabled ? 'rgba(8,92,240,0.4)' : '#085CF0',
            color: 'white',
            padding: isMobile ? '12px 20px' : '14px 32px',
            borderRadius: 100, fontSize: 14, fontWeight: 600, border: 'none',
            cursor: isNextDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', fontFamily: 'Syne, sans-serif',
            letterSpacing: '0.02em',
            boxShadow: isNextDisabled ? 'none' : '0 4px 20px rgba(8,92,240,0.25)',
            flex: isMobile ? 2 : 'none',
          }}
            onMouseEnter={(e) => {
              if (!isNextDisabled) {
                e.currentTarget.style.background = '#1A6FF5'
                e.currentTarget.style.boxShadow = '0 4px 28px rgba(8,92,240,0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isNextDisabled) {
                e.currentTarget.style.background = '#085CF0'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(8,92,240,0.25)'
              }
            }}>
            {isLastStep ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Lancer l'analyse
              </>
            ) : (
              <>
                {isMobile ? 'Suivant' : 'Pilier suivant'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

// ─── Sub-components utilitaires ───────────────────────────────────────────────

export function YNButton({ label, icon, selected, onClick }: {
  label: string; icon?: React.ReactNode; selected: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '11px 20px',
      border: `1.5px solid ${selected ? '#085CF0' : 'rgba(9,38,118,0.12)'}`,
      borderRadius: 100,
      background: selected ? '#085CF0' : '#FFFFFF',
      color: selected ? 'white' : '#3A4060',
      fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
      fontFamily: 'Inter, sans-serif', fontWeight: selected ? 600 : 400,
    }}>
      {icon}{label}
    </button>
  )
}

export function CheckboxCard({ label, icon, selected, onClick }: {
  label: string; icon: React.ReactNode; selected: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 20px',
      border: `1.5px solid ${selected ? '#085CF0' : 'rgba(9,38,118,0.12)'}`,
      borderRadius: 12,
      background: selected ? 'rgba(8,92,240,0.04)' : '#FFFFFF',
      color: selected ? '#085CF0' : '#050A34',
      fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
      width: '100%', textAlign: 'left' as const,
      fontFamily: 'Inter, sans-serif',
      boxShadow: selected ? '0 0 0 3px rgba(8,92,240,0.08)' : undefined,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        border: `1.5px solid ${selected ? '#085CF0' : 'rgba(9,38,118,0.2)'}`,
        background: selected ? '#085CF0' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {selected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
      </span>
      <span style={{ color: selected ? '#085CF0' : '#7A82A0' }}>{icon}</span>
      {label}
    </button>
  )
}

export function URLInput({ prefix, placeholder, value, onChange }: {
  prefix: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#FFFFFF', border: '1.5px solid rgba(9,38,118,0.12)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      <span style={{
        padding: '13px 16px', background: '#F5F0E8',
        fontSize: 13, color: '#7A82A0',
        borderRight: '1px solid rgba(9,38,118,0.12)',
        whiteSpace: 'nowrap' as const, fontFamily: 'Inter, sans-serif',
      }}>{prefix}</span>
      <input type="text" placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, padding: '13px 16px', background: 'none', border: 'none', outline: 'none',
          fontSize: 14, color: '#050A34', fontFamily: 'Inter, sans-serif',
        }} />
    </div>
  )
}

export function QuestionSection({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{
        fontSize: 15, fontWeight: 500, color: '#050A34',
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'rgba(8,92,240,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#085CF0', flexShrink: 0,
        }}>{icon}</span>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        {children}
      </div>
    </div>
  )
}