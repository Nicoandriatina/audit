'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useWindowWidth } from '@/lib/useWindowWidth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditRow {
  id:              string
  createdAt:       string
  businessName:    string
  city:            string
  sector:          string
  activityType:    string
  scoreGlobal:     number
  scoreSocial:     number
  scoreWeb:        number
  scoreGBP:        number
  scoreFunnel:     number
  scoreBranding:   number
  sectorPercentile: number | null
  isUnlocked:      boolean
  fullName:        string | null
  email:           string | null
  phone:           string | null
}

interface Stats {
  totalAudits:     number
  scoreAvg:        number
  totalUnlocked:   number
  last7Days:       number
  conversionRate:  number
  topSectors:      { sector: string; count: number }[]
}

interface ApiResponse {
  audits:     AuditRow[]
  total:      number
  page:       number
  totalPages: number
  stats:      Stats
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score < 40) return '#E03131'
  if (score < 65) return '#E8890C'
  return '#2B9348'
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short' })
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router    = useRouter()
  const isMobile  = useWindowWidth() < 960

  const [data,        setData]        = useState<ApiResponse | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [page,        setPage]        = useState(1)
  const [search,      setSearch]      = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterSector,   setFilterSector]   = useState('')
  const [filterUnlocked, setFilterUnlocked] = useState('')
  const [loggingOut,  setLoggingOut]  = useState(false)
  const [copiedId,    setCopiedId]    = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [statsAnimated, setStatsAnimated] = useState(false)
  const [gaugeKey, setGaugeKey] = useState(0)

  // ── Mount animation ───────────────────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => {
      setTimeout(() => setMounted(true), 50)
    })
  }, [])

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true)
      setStatsAnimated(false)
      setGaugeKey(k => k + 1)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search)          params.set('search',   search)
      if (filterSector)    params.set('sector',   filterSector)
      if (filterUnlocked)  params.set('unlocked', filterUnlocked)

      const res = await fetch(`/api/admin/audits?${params}`)
      if (res.status === 401) { router.push('/admin/login'); return }
      if (!res.ok) throw new Error('Erreur serveur')
      const json = await res.json()
      setData(json)
      // Trigger gauge + stats animation after data loads
      setTimeout(() => setStatsAnimated(true), 100)
    } catch (err) {
      setError('Impossible de charger les données.')
      console.error(err)
    } finally {
      setLoading(false)
      if (isRefresh) {
        setTimeout(() => setIsRefreshing(false), 600)
      }
    }
  }, [page, search, filterSector, filterUnlocked, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Trigger stats animation after first load
  useEffect(() => {
    if (data && !statsAnimated) {
      setTimeout(() => setStatsAnimated(true), 200)
    }
  }, [data])

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogoutConfirm = async () => {
    setLoggingOut(true)
    await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => {})
    router.push('/admin/login')
  }

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearchSubmit = () => {
    setSearch(searchInput)
    setPage(1)
  }

  // ── Copier email ─────────────────────────────────────────────────────────
  const copyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  const APP_URL = typeof window !== 'undefined' ? window.location.origin : ''

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(5,10,52,0.55)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutModal(false) }}
        >
          <div style={{
            background: 'white', borderRadius: 20, padding: '32px 36px',
            width: 340, boxShadow: '0 24px 80px rgba(5,10,52,0.18)',
            animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            border: '1px solid rgba(9,38,118,0.08)',
          }}>
            {/* Icône */}
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(224,49,49,0.08)', border: '1px solid rgba(224,49,49,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E03131" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#050A34', fontFamily: 'Syne, sans-serif' }}>
              Se déconnecter ?
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#7A82A0', lineHeight: 1.5 }}>
              Vous allez quitter le dashboard admin. Vous devrez vous reconnecter pour y accéder à nouveau.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: '10px 16px',
                  background: '#F5F0E8', border: '1.5px solid #EDE8DF',
                  borderRadius: 10, fontSize: 13, fontWeight: 600,
                  color: '#7A82A0', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EDE8DF'; e.currentTarget.style.color = '#050A34' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F5F0E8'; e.currentTarget.style.color = '#7A82A0' }}
              >
                Annuler
              </button>
              <button
                onClick={handleLogoutConfirm}
                disabled={loggingOut}
                style={{
                  flex: 1, padding: '10px 16px',
                  background: loggingOut ? 'rgba(224,49,49,0.5)' : '#E03131',
                  border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 700, color: 'white',
                  cursor: loggingOut ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
                onMouseEnter={e => { if (!loggingOut) e.currentTarget.style.background = '#C92A2A' }}
                onMouseLeave={e => { if (!loggingOut) e.currentTarget.style.background = '#E03131' }}
              >
                {loggingOut ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                    </svg>
                    Déconnexion…
                  </>
                ) : 'Se déconnecter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav style={{
        background: '#050A34', borderBottom: '1px solid rgba(175,233,253,0.08)',
        padding: isMobile ? '0 20px' : '0 48px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        animation: 'slideDown 0.4s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, background: '#085CF0', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900, color: 'white',
            transition: 'transform 0.2s',
          }}>CS</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>Dashboard Admin</span>
          <span style={{ fontSize: 10, color: 'rgba(175,233,253,0.35)', background: 'rgba(175,233,253,0.06)', padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(175,233,253,0.1)' }}>PRIVÉ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Refresh button with spinning animation */}
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            style={{
              background: isRefreshing ? 'rgba(175,233,253,0.08)' : 'none',
              border: '1px solid rgba(175,233,253,0.15)', borderRadius: 8,
              padding: '6px 12px', color: isRefreshing ? 'rgba(175,233,253,0.9)' : 'rgba(175,233,253,0.6)',
              fontSize: 12, cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              style={{ animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none', transition: 'transform 0.3s' }}
            >
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            {isRefreshing ? 'Actualisation…' : 'Actualiser'}
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            style={{
              background: 'rgba(224,49,49,0.1)', border: '1px solid rgba(224,49,49,0.2)',
              borderRadius: 8, padding: '6px 14px', color: '#E03131',
              fontSize: 12, cursor: 'pointer', fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,49,49,0.18)'; e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(224,49,49,0.1)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            Se déconnecter
          </button>
        </div>
      </nav>

      <div style={{ padding: isMobile ? '24px 20px' : '36px 48px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
          marginBottom: 28,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#050A34', fontFamily: 'Syne, sans-serif' }}>
            Audits & Leads
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#7A82A0' }}>
            Vue d'ensemble de tous les audits soumis
          </p>
        </div>

        {/* ── KPI Cards ── */}
        {data?.stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              {[
                {
                  label: 'Total audits', value: data.stats.totalAudits, color: '#085CF0',
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#085CF0" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
                },
                {
                  label: 'Leads débloqués', value: data.stats.totalUnlocked, sub: `${data.stats.conversionRate}% taux de conv.`, color: '#2B9348',
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B9348" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
                },
                {
                  label: 'Score moyen', value: `${data.stats.scoreAvg}/100`, color: scoreColor(data.stats.scoreAvg),
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={scoreColor(data.stats.scoreAvg)} strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
                },
                {
                  label: '7 derniers jours', value: data.stats.last7Days, sub: 'nouveaux audits', color: '#E8890C',
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8890C" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                },
              ].map((card, i) => (
                <KpiCard
                  key={i}
                  label={card.label}
                  value={card.value}
                  sub={card.sub}
                  icon={card.icon}
                  color={card.color}
                  delay={i * 80}
                  mounted={mounted}
                />
              ))}
            </div>

            {/* ── Conversion bar + Top secteurs ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 24 }}>

              {/* Conversion */}
              <div style={{
                background: 'white', borderRadius: 14, padding: '20px 24px',
                border: '1px solid rgba(9,38,118,0.08)',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.55s ease 0.4s, transform 0.55s cubic-bezier(0.22,1,0.36,1) 0.4s`,
              }}>
                <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#092676' }}>Taux de conversion</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span style={{
                    fontSize: 32, fontWeight: 800, fontFamily: 'Syne, sans-serif',
                    color: data.stats.conversionRate >= 30 ? '#2B9348' : data.stats.conversionRate >= 15 ? '#E8890C' : '#E03131',
                    display: 'inline-block',
                    animation: statsAnimated ? 'countUp 0.6s cubic-bezier(0.22,1,0.36,1)' : 'none',
                  }}>
                    {data.stats.conversionRate}%
                  </span>
                  <span style={{ fontSize: 12, color: '#7A82A0' }}>{data.stats.totalUnlocked} / {data.stats.totalAudits} audits débloqués</span>
                </div>
                {/* Animated gauge bar */}
                <div style={{ height: 8, background: '#EDE8DF', borderRadius: 4, overflow: 'hidden' }}>
                  <div key={`conv-${gaugeKey}`} style={{
                    height: '100%',
                    width: statsAnimated ? `${Math.min(100, data.stats.conversionRate)}%` : '0%',
                    background: data.stats.conversionRate >= 30 ? '#2B9348' : data.stats.conversionRate >= 15 ? '#E8890C' : '#E03131',
                    borderRadius: 4,
                    transition: statsAnimated ? 'width 1.2s cubic-bezier(0.22,1,0.36,1) 0.1s' : 'none',
                    position: 'relative' as const,
                    overflow: 'hidden',
                  }}>
                    {/* Shimmer on gauge */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)', animation: 'shimmer 2s ease 1.3s 1' }} />
                  </div>
                </div>
              </div>

              {/* Top secteurs */}
              <div style={{
                background: 'white', borderRadius: 14, padding: '20px 24px',
                border: '1px solid rgba(9,38,118,0.08)',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.55s ease 0.48s, transform 0.55s cubic-bezier(0.22,1,0.36,1) 0.48s`,
              }}>
                <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#092676' }}>Top secteurs</p>
                {data.stats.topSectors.map((s, i) => {
                  const max = data.stats.topSectors[0]?.count ?? 1
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < data.stats.topSectors.length - 1 ? 10 : 0 }}>
                      <span style={{ fontSize: 11, color: '#7A82A0', width: 120, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={s.sector}>{s.sector}</span>
                      <div style={{ flex: 1, height: 5, background: '#EDE8DF', borderRadius: 3, overflow: 'hidden' }}>
                        <div key={`sector-${gaugeKey}-${i}`} style={{
                          height: '100%',
                          width: statsAnimated ? `${(s.count / max) * 100}%` : '0%',
                          background: '#085CF0',
                          borderRadius: 3,
                          opacity: 0.6 + 0.4 * (s.count / max),
                          transition: statsAnimated ? `width 1s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.1}s` : 'none',
                        }} />
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#050A34', width: 24, textAlign: 'right' as const,
                        animation: statsAnimated ? `countUp 0.5s ease ${0.2 + i * 0.1}s both` : 'none',
                      }}>{s.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Filtres ── */}
        <div style={{
          background: 'white', borderRadius: 14, padding: '16px 20px',
          border: '1px solid rgba(9,38,118,0.08)', marginBottom: 16,
          display: 'flex', flexWrap: 'wrap' as const, gap: 10, alignItems: 'center',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.5s ease 0.55s, transform 0.5s cubic-bezier(0.22,1,0.36,1) 0.55s',
        }}>
          <div style={{ display: 'flex', gap: 0, flex: 1, minWidth: 200 }}>
            <input
              type="text"
              placeholder="Rechercher entreprise, email, ville…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              style={{
                flex: 1, padding: '9px 14px', fontSize: 13,
                border: '1.5px solid #EDE8DF', borderRadius: '10px 0 0 10px',
                outline: 'none', fontFamily: 'Inter, sans-serif', color: '#050A34',
                background: '#FAFAF8', transition: 'border-color 0.2s',
              }}
            />
            <button
              onClick={handleSearchSubmit}
              style={{
                padding: '9px 16px', background: '#085CF0', color: 'white',
                border: 'none', borderRadius: '0 10px 10px 0',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0650D4'}
              onMouseLeave={e => e.currentTarget.style.background = '#085CF0'}
            >
              Chercher
            </button>
          </div>

          <select
            value={filterUnlocked}
            onChange={(e) => { setFilterUnlocked(e.target.value); setPage(1) }}
            style={{ padding: '9px 14px', border: '1.5px solid #EDE8DF', borderRadius: 10, fontSize: 12, color: '#050A34', background: '#FAFAF8', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            <option value="">Tous les statuts</option>
            <option value="true">Débloqués</option>
            <option value="false">Non débloqués</option>
          </select>

          {(search || filterSector || filterUnlocked) && (
            <button
              onClick={() => { setSearch(''); setSearchInput(''); setFilterSector(''); setFilterUnlocked(''); setPage(1) }}
              style={{ padding: '9px 14px', background: 'none', border: '1.5px solid #EDE8DF', borderRadius: 10, fontSize: 12, color: '#7A82A0', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E03131'; e.currentTarget.style.color = '#E03131' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDE8DF'; e.currentTarget.style.color = '#7A82A0' }}
            >
              ✕ Réinitialiser
            </button>
          )}

          {data && (
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#7A82A0', flexShrink: 0 }}>
              {data.total} résultat{data.total > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Table ── */}
        <div style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease 0.6s, transform 0.5s cubic-bezier(0.22,1,0.36,1) 0.6s',
        }}>
          {loading ? (
            <LoadingTable />
          ) : error ? (
            <div style={{ background: 'white', borderRadius: 14, padding: 40, textAlign: 'center', border: '1px solid rgba(224,49,49,0.2)' }}>
              <p style={{ color: '#E03131', margin: 0 }}>{error}</p>
            </div>
          ) : !data?.audits.length ? (
            <div style={{ background: 'white', borderRadius: 14, padding: 48, textAlign: 'center', border: '1px solid rgba(9,38,118,0.08)' }}>
              <p style={{ color: '#7A82A0', margin: 0, fontSize: 14 }}>Aucun audit trouvé.</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(9,38,118,0.08)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8F7F5', borderBottom: '1.5px solid #EDE8DF' }}>
                      {['Date', 'Entreprise', 'Secteur', 'Score', 'Statut', 'Lead', 'Actions'].map((h) => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left' as const, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: '#7A82A0', whiteSpace: 'nowrap' as const }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.audits.map((audit, i) => (
                      <tr
                        key={audit.id}
                        style={{
                          borderBottom: i < data.audits.length - 1 ? '1px solid #F5F0E8' : 'none',
                          transition: 'background 0.15s',
                          animation: `rowIn 0.35s cubic-bezier(0.22,1,0.36,1) ${i * 40}ms both`,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAF8')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Date */}
                        <td style={{ padding: '12px 16px', color: '#7A82A0', whiteSpace: 'nowrap' as const, fontSize: 12 }}>
                          {formatDateShort(audit.createdAt)}
                        </td>

                        {/* Entreprise */}
                        <td style={{ padding: '12px 16px', minWidth: 160 }}>
                          <div style={{ fontWeight: 600, color: '#050A34', marginBottom: 2 }}>{audit.businessName}</div>
                          {audit.city && <div style={{ fontSize: 11, color: '#7A82A0' }}>{audit.city}</div>}
                        </td>

                        {/* Secteur */}
                        <td style={{ padding: '12px 16px', maxWidth: 140 }}>
                          <span style={{ fontSize: 11, color: '#3D4A6B', background: 'rgba(9,38,118,0.05)', padding: '3px 9px', borderRadius: 100, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 130 }} title={audit.sector}>
                            {audit.sector || '—'}
                          </span>
                        </td>

                        {/* Score */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' as const }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: scoreColor(audit.scoreGlobal), fontFamily: 'Syne, sans-serif' }}>
                              {audit.scoreGlobal}
                            </span>
                            <span style={{ fontSize: 10, color: '#7A82A0' }}>/100</span>
                          </div>
                          {/* Animated score bar */}
                          <div style={{ width: 60, height: 3, background: '#EDE8DF', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                            <div key={`score-${gaugeKey}-${audit.id}`} style={{
                              height: '100%',
                              width: statsAnimated ? `${audit.scoreGlobal}%` : '0%',
                              background: scoreColor(audit.scoreGlobal),
                              borderRadius: 2,
                              transition: statsAnimated ? `width 0.8s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.03}s` : 'none',
                            }} />
                          </div>
                        </td>

                        {/* Statut */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                            background: audit.isUnlocked ? 'rgba(43,147,72,0.10)' : 'rgba(122,130,160,0.08)',
                            color: audit.isUnlocked ? '#2B9348' : '#7A82A0',
                            border: `1px solid ${audit.isUnlocked ? 'rgba(43,147,72,0.2)' : 'rgba(122,130,160,0.15)'}`,
                          }}>
                            {audit.isUnlocked ? '✓ Débloqué' : 'Non débloqué'}
                          </span>
                        </td>

                        {/* Lead */}
                        <td style={{ padding: '12px 16px', minWidth: 150 }}>
                          {audit.isUnlocked && audit.fullName ? (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#050A34', marginBottom: 2 }}>{audit.fullName}</div>
                              {audit.email && (
                                <button
                                  onClick={() => copyEmail(audit.email!, audit.id)}
                                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, color: copiedId === audit.id ? '#2B9348' : '#085CF0', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s' }}
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                                  {copiedId === audit.id ? 'Copié !' : audit.email}
                                </button>
                              )}
                              {audit.phone && <div style={{ fontSize: 11, color: '#7A82A0', marginTop: 1 }}>{audit.phone}</div>}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: '#C0C6D9' }}>—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' as const }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <a
                              href={`/audit/result?id=${audit.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(8,92,240,0.08)', border: '1px solid rgba(8,92,240,0.15)', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#085CF0', textDecoration: 'none', transition: 'all 0.2s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(8,92,240,0.15)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.04)' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(8,92,240,0.08)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)' }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              Voir
                            </a>
                            {audit.isUnlocked && (
                              <a
                                href={`${APP_URL}/api/pdf/${audit.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(43,147,72,0.07)', border: '1px solid rgba(43,147,72,0.15)', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#2B9348', textDecoration: 'none', transition: 'all 0.2s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(43,147,72,0.15)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.04)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(43,147,72,0.07)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)' }}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                PDF
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div style={{ padding: '14px 20px', borderTop: '1px solid #EDE8DF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#7A82A0' }}>
                    Page {data.page} sur {data.totalPages}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <PageBtn onClick={() => setPage(1)} disabled={page === 1} label="«" />
                    <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} label="‹" />
                    {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(data.totalPages - 4, page - 2)) + i
                      return (
                        <PageBtn key={p} label={String(p)} onClick={() => setPage(p)} disabled={false} active={p === page} />
                      )
                    })}
                    <PageBtn onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} label="›" />
                    <PageBtn onClick={() => setPage(data.totalPages)} disabled={page === data.totalPages} label="»" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        select { outline: none; }
        input:focus { border-color: rgba(8,92,240,0.4) !important; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(300%); }
        }
        @keyframes kpiIn {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  )
}

// ─── Sub-composants ───────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, color, delay, mounted,
}: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode;
  color: string; delay: number; mounted: boolean;
}) {
  return (
    <div style={{
      background: 'white', borderRadius: 14, padding: '20px 22px',
      border: '1px solid rgba(9,38,118,0.08)',
      display: 'flex', flexDirection: 'column', gap: 10,
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      cursor: 'default',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
        e.currentTarget.style.boxShadow = `0 8px 28px ${color}18`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#7A82A0', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{label}</span>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: `${color}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>{icon}</div>
      </div>
      <div>
        <div style={{
          fontSize: 28, fontWeight: 800, color: '#050A34',
          fontFamily: 'Syne, sans-serif', lineHeight: 1,
          animation: mounted ? `countUp 0.6s cubic-bezier(0.22,1,0.36,1) ${delay + 100}ms both` : 'none',
        }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: '#7A82A0', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

function PageBtn({ onClick, disabled, label, active }: { onClick: () => void; disabled: boolean; label: string; active?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: 7, fontSize: 12, fontWeight: active ? 700 : 400,
        border: `1.5px solid ${active ? '#085CF0' : '#EDE8DF'}`,
        background: active ? '#085CF0' : 'white',
        color: active ? 'white' : disabled ? '#C0C6D9' : '#050A34',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        transform: 'scale(1)',
      }}
      onMouseEnter={e => { if (!disabled && !active) { e.currentTarget.style.borderColor = '#085CF0'; e.currentTarget.style.transform = 'scale(1.08)' } }}
      onMouseLeave={e => { if (!disabled && !active) { e.currentTarget.style.borderColor = '#EDE8DF'; e.currentTarget.style.transform = 'scale(1)' } }}
    >
      {label}
    </button>
  )
}

function LoadingTable() {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(9,38,118,0.08)', overflow: 'hidden' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 20px', borderBottom: i < 5 ? '1px solid #F5F0E8' : 'none' }}>
          {[80, 160, 120, 60, 80, 140, 80].map((w, j) => (
            <div key={j} style={{
              height: 12, width: w, borderRadius: 6,
              background: 'linear-gradient(90deg, #F0EDE6 25%, #E8E4DC 50%, #F0EDE6 75%)',
              backgroundSize: '200% 100%',
              animation: `loadingShimmer 1.5s ease-in-out ${j * 0.08}s infinite`,
            }} />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes loadingShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}