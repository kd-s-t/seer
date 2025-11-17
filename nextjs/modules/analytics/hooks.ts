'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getAnalytics } from '@/lib/seery/analytics'
import { type AnalyticsData } from './types'
import { ADMIN_ADDRESSES, REFRESH_INTERVAL } from './const'

export function useAnalytics() {
  const [mounted, setMounted] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { address: wagmiAddress } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchAnalytics = async () => {
      const isAdmin = wagmiAddress && ADMIN_ADDRESSES.some(addr => addr.toLowerCase() === wagmiAddress.toLowerCase())
      if (!wagmiAddress || !isAdmin) {
        if (!cancelled) {
          setLoading(false)
        }
        return
      }

      try {
        if (!cancelled) {
          setLoading(true)
          setError(null)
        }

        const data = await getAnalytics()
        
        if (!cancelled && data.success && data.analytics) {
          setAnalytics(data.analytics)
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error fetching analytics:', err)
          setError(err.message || 'Failed to fetch analytics')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (mounted && wagmiAddress) {
      fetchAnalytics()
      const interval = setInterval(fetchAnalytics, REFRESH_INTERVAL)
      return () => {
        cancelled = true
        clearInterval(interval)
      }
    }

    return () => {
      cancelled = true
    }
  }, [mounted, wagmiAddress])

  const isAdmin = wagmiAddress ? ADMIN_ADDRESSES.some(addr => addr.toLowerCase() === wagmiAddress.toLowerCase()) : false

  return { analytics, loading, error, mounted, isAdmin }
}

