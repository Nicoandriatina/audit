'use client'

import { useState, useEffect } from 'react'

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