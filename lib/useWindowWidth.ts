'use client'

import { useState, useEffect } from 'react'

/**
 * useWindowWidth — retourne la largeur de la fenêtre en temps réel.
 * SSR-safe : retourne 1440 côté serveur pour éviter le flash mobile.
 *
 * Usage :
 *   const isMobile = useWindowWidth() < 960
 */
export function useWindowWidth(): number {
  const [width, setWidth] = useState(1440)

  useEffect(() => {
    const update = () => setWidth(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return width
}