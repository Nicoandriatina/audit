'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ background: '#050A34', minHeight: '100vh' }} />}>
      <AdminLoginInner />
    </Suspense>
  )
}

function AdminLoginInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const from         = searchParams.get('from') ?? '/admin/dashboard'

  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [shake, setShake]         = useState(false)
  const inputRef                  = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async () => {
    if (!password.trim() || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push(from)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Mot de passe incorrect.')
        setPassword('')
        setShake(true)
        setTimeout(() => setShake(false), 500)
        inputRef.current?.focus()
      }
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050A34',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '20px',
    }}>
      {/* Fond décoratif */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(8,92,240,0.15) 0%, transparent 70%)',
      }} />

      <div style={{
        width: '100%', maxWidth: 400,
        animation: 'fadeUp 0.4s ease both',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, justifyContent: 'center' }}>
          <div style={{
            width: 36, height: 36, background: '#085CF0', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900, color: 'white',
          }}>CS</div>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(175,233,253,0.7)' }}>
            Cabinet Stratège
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(175,233,253,0.10)',
          borderRadius: 18,
          padding: '40px 36px',
          backdropFilter: 'blur(12px)',
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}>
          <h1 style={{
            margin: '0 0 6px',
            fontSize: 22, fontWeight: 800,
            color: 'white',
            fontFamily: 'Syne, sans-serif',
          }}>
            Accès admin
          </h1>
          <p style={{ margin: '0 0 32px', fontSize: 13, color: 'rgba(175,233,253,0.45)', lineHeight: 1.6 }}>
            Zone réservée. Entrez votre mot de passe.
          </p>

          {/* Input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.07em', textTransform: 'uppercase' as const,
              color: 'rgba(175,233,253,0.45)', marginBottom: 8,
            }}>
              Mot de passe
            </label>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••••••"
              autoComplete="current-password"
              style={{
                width: '100%', boxSizing: 'border-box' as const,
                background: 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${error ? 'rgba(224,49,49,0.5)' : 'rgba(175,233,253,0.12)'}`,
                borderRadius: 10,
                padding: '13px 16px',
                fontSize: 15, color: 'white',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(8,92,240,0.6)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? 'rgba(224,49,49,0.5)' : 'rgba(175,233,253,0.12)'
              }}
            />
          </div>

          {/* Erreur */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              background: 'rgba(224,49,49,0.08)',
              border: '1px solid rgba(224,49,49,0.2)',
              borderRadius: 8,
              marginBottom: 16,
              animation: 'fadeUp 0.2s ease',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E03131" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <span style={{ fontSize: 12, color: '#E03131' }}>{error}</span>
            </div>
          )}

          {/* Bouton */}
          <button
            onClick={handleSubmit}
            disabled={loading || !password.trim()}
            style={{
              width: '100%',
              background: loading || !password.trim() ? 'rgba(8,92,240,0.4)' : '#085CF0',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '14px',
              fontSize: 14, fontWeight: 600,
              cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Vérification…
              </>
            ) : (
              <>
                Accéder au dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Sécurité note */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(175,233,253,0.2)', lineHeight: 1.6 }}>
          Accès protégé · Session 7 jours · Sion, Suisse
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        @keyframes spin   { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(175,233,253,0.2); }
      `}</style>
    </div>
  )
}