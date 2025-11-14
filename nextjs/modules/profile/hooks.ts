'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getUserStats, getUserStakes } from '@/lib/seery'
import { type UserStats, type UserStake } from './types'

export function useProfile() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userStakes, setUserStakes] = useState<UserStake[]>([])
  const [loadingStakes, setLoadingStakes] = useState(true)
  const { address: wagmiAddress } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchStats = async () => {
      if (!wagmiAddress) {
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

        const data = await getUserStats(wagmiAddress)
        
        if (!cancelled && data.success && data.stats) {
          setStats({
            wins: BigInt(data.stats.wins),
            losses: BigInt(data.stats.losses),
            totalStaked: BigInt(data.stats.totalStaked),
            totalWon: BigInt(data.stats.totalWon),
            totalLost: BigInt(data.stats.totalLost),
            winRate: BigInt(data.stats.winRate)
          })
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error fetching user stats:', err)
          setError(err.message || 'Failed to fetch user stats')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (mounted && wagmiAddress) {
      fetchStats()
    }

    return () => {
      cancelled = true
    }
  }, [mounted, wagmiAddress])

  useEffect(() => {
    let cancelled = false

    const fetchUserStakes = async () => {
      if (!wagmiAddress) {
        if (!cancelled) {
          setLoadingStakes(false)
        }
        return
      }

      try {
        if (!cancelled) {
          setLoadingStakes(true)
        }
        
        const apiData = await getUserStakes(wagmiAddress)
        
        if (cancelled) return
        
        if (!apiData.success || !apiData.stakes) {
          setUserStakes([])
          if (!cancelled) {
            setLoadingStakes(false)
          }
          return
        }

        if (!cancelled) {
          setUserStakes(apiData.stakes)
        }
      } catch (err: any) {
        console.error('Error fetching user stakes:', err)
      } finally {
        if (!cancelled) {
          setLoadingStakes(false)
        }
      }
    }

    if (mounted && wagmiAddress) {
      fetchUserStakes()
    }

    return () => {
      cancelled = true
    }
  }, [mounted, wagmiAddress])

  return { stats, loading, error, userStakes, loadingStakes, mounted }
}

