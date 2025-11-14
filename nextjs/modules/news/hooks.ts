'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTrendingNews } from '@/lib/seery'
import { NewsItem } from './types'
import { CACHE_KEY, CACHE_TTL } from './const'

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchNews = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      localStorage.removeItem(CACHE_KEY)
    }
    
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(CACHE_KEY)
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData)
          const cacheAge = Date.now() - timestamp
          
          if (cacheAge < CACHE_TTL) {
            setNews(data)
            setLastRefreshed(new Date(timestamp))
            setLoading(false)
            setRefreshing(false)
            return
          }
        } catch (e) {
          // Invalid cache, continue to fetch
        }
      }
    }
    
    setLoading(true)
    setError(null)
    try {
      const data = await getTrendingNews()
      
      if (data.success && data.news && Array.isArray(data.news) && data.news.length > 0) {
        console.log('List of news:', data.news.length, 'items')
        setNews(data.news)
        setLastRefreshed(new Date())
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: data.news,
          timestamp: Date.now()
        }))
      } else {
        setError('No news available')
        setNews([])
      }
    } catch (err: any) {
      console.error('Error fetching news:', err)
      setError('Error loading news: ' + err.message)
      setNews([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetchNews()
  }, [mounted, fetchNews])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchNews(true)
  }, [fetchNews])

  return {
    news,
    loading,
    error,
    lastRefreshed,
    refreshing,
    mounted,
    handleRefresh,
    fetchNews
  }
}

