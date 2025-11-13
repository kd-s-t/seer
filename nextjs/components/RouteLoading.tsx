'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { LinearProgress } from '@mui/material'
import { useNavigation } from '@/contexts/NavigationContext'

export default function RouteLoading() {
  const pathname = usePathname()
  const { isLoading: contextLoading, setLoading } = useNavigation()
  const [localLoading, setLocalLoading] = useState(false)
  const prevPathnameRef = useRef<string>(pathname)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Combine context loading and local loading
  const loading = contextLoading || localLoading

  useEffect(() => {
    // Only show loading if pathname actually changed
    if (prevPathnameRef.current !== pathname) {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      // Show loading immediately
      setLocalLoading(true)
      setLoading(true)
      prevPathnameRef.current = pathname
      
      // Hide loading after navigation completes
      timerRef.current = setTimeout(() => {
        setLocalLoading(false)
        setLoading(false)
        timerRef.current = null
      }, 500)

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    }
  }, [pathname, setLoading])

  if (!loading) return null

  return (
    <LinearProgress
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        '& .MuiLinearProgress-bar': {
          backgroundColor: '#667eea',
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          transition: 'transform 0.3s ease-out'
        }
      }}
    />
  )
}

