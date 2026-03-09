'use client'

import { useWindowWidth } from '@/lib/useWindowWidth'

export default function AuditNav() {
  const isMobile = useWindowWidth() < 960

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: isMobile ? '0 20px' : '0 48px',
      height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#050A34',
      borderBottom: '1px solid rgba(175,233,253,0.1)',
      fontFamily: 'Inter, sans-serif',
    }}>
      <a href="/" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'Syne, sans-serif',
        fontSize: isMobile ? 12 : 14,
        fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: 'white', textDecoration: 'none',
      }}>
        <span style={{
          width: 28, height: 28, background: '#085CF0', borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 900, color: 'white',
          fontFamily: 'Syne, sans-serif',
        }}>CS</span>
        {!isMobile && 'Cabinet Stratège'}
      </a>

      <a href="https://landing-cabinet-stratege.vercel.app/" style={{
        fontSize: 12, color: '#AFE9FD', textDecoration: 'none',
        display: 'flex', alignItems: 'center', gap: 8,
        opacity: 0.8, transition: 'opacity 0.2s',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        {isMobile ? 'Retour' : 'Retour au site'}
      </a>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=Inter:wght@400;500&display=swap');
      `}</style>
    </nav>
  )
}