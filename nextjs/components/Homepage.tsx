'use client'

import { useState, useEffect } from 'react'
import { Grid, Card, CardContent, Typography, Box, CircularProgress, IconButton } from '@mui/material'
import { Refresh } from '@mui/icons-material'
import { motion } from 'framer-motion'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016'

interface NewsItem {
  title: string
  summary: string
  date?: string
  source?: string
  url?: string
  sentiment?: string
  image?: string | null
}

function getCryptoImageUrl(item: NewsItem, index: number): string {
  if (item.image) {
    return item.image
  }
  const keywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 'nft', 'solana', 'cardano', 'polkadot']
  const lowerTitle = item.title.toLowerCase()
  const matchedKeyword = keywords.find(k => lowerTitle.includes(k)) || 'cryptocurrency'
  const imageId = (index * 100) % 1000
  return `https://source.unsplash.com/800x600/?${matchedKeyword},blockchain&sig=${imageId}`
}

export default function Homepage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchNews = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/news/trending`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.news && Array.isArray(data.news) && data.news.length > 0) {
        setNews(data.news)
        setLastRefreshed(new Date())
      } else {
        setError(data.message || 'No news available')
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
  }

  useEffect(() => {
    if (!mounted) return
    fetchNews()
  }, [mounted])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchNews()
  }

  const formatRefreshDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          News feed temporarily unavailable
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We're having trouble loading the latest crypto news. Please try again later.
        </Typography>
      </Box>
    )
  }

  if (news.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No news available at the moment
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Check back soon for the latest cryptocurrency updates.
        </Typography>
      </Box>
    )
  }

  const rowPatterns = [
    [{ xs: 12, md: 8 }, { xs: 12, md: 4 }],
    [{ xs: 12, md: 4 }, { xs: 12, md: 8 }],
    [{ xs: 12, md: 6 }, { xs: 12, md: 6 }],
  ]

  const getGridSizes = () => {
    const sizes: Array<{ xs: number; md: number }> = []
    let itemIndex = 0
    const recentPatterns: number[] = []
    const minDistance = 2
    
    while (itemIndex < news.length) {
      let patternIndex
      let attempts = 0
      
      do {
        const seed = itemIndex * 7 + (news[itemIndex]?.title?.charCodeAt(0) || 0) + attempts
        patternIndex = seed % rowPatterns.length
        attempts++
      } while (recentPatterns.includes(patternIndex) && attempts < 20)
      
      const pattern = rowPatterns[patternIndex]
      recentPatterns.push(patternIndex)
      if (recentPatterns.length > minDistance) {
        recentPatterns.shift()
      }
      
      pattern.forEach((size) => {
        if (itemIndex < news.length) {
          sizes.push(size)
          itemIndex++
        }
      })
    }
    
    return sizes
  }

  const gridSizes = getGridSizes()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Grid container spacing={2}>
        {news.map((item, index) => {
        const size = gridSizes[index] || { xs: 12, md: 12 }
        const imageUrl = getCryptoImageUrl(item, index)
        
        return (
          <Grid item {...size} key={index}>
            <motion.div
              variants={cardVariants}
              whileHover={item.url ? {
                scale: 1.02,
                y: -4,
                transition: { duration: 0.2 }
              } : {}}
              whileTap={item.url ? { scale: 0.98 } : {}}
            >
              <Card
                component={item.url ? 'a' : 'div'}
                href={item.url || undefined}
                target={item.url ? '_blank' : undefined}
                rel={item.url ? 'noopener noreferrer' : undefined}
                sx={{
                  height: '100%',
                  minHeight: 300,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: item.url ? 'pointer' : 'default',
                  textDecoration: 'none',
                }}
              >
              {imageUrl && (
              <Box
                  component="img"
                  src={imageUrl}
                  alt={item.title}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  opacity: 0.3,
                  zIndex: 0,
                }}
              />
              )}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
                  zIndex: 1,
                }}
              />
              <CardContent
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  color: 'white',
                  minHeight: 300,
                  pb: 2,
                  pt: 2,
                }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    mb: 1.5,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 1.5,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.4,
                  }}
                >
                  {item.summary}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                  {item.source && (
                    <Typography 
                      component="span"
                      variant="caption" 
                      sx={{ 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        fontSize: '0.7rem'
                      }}
                    >
                      {item.source}
                    </Typography>
                  )}
                  {item.date && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        fontSize: '0.7rem'
                      }}
                    >
                      {item.date}
                    </Typography>
                  )}
                  {item.url && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)', 
                        color: 'primary.light',
                        fontSize: '0.7rem',
                        fontWeight: 500
                      }}
                    >
                      Read more →
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
            </motion.div>
          </Grid>
        )
      })}
      </Grid>
      {news.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mt: 3,
            gap: 1.5,
            px: 1,
          }}
        >
          {lastRefreshed && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
              }}
            >
              Refreshed at {formatRefreshDate(lastRefreshed)}
            </Typography>
          )}
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing || loading}
            size="small"
            sx={{
              color: 'text.secondary',
              opacity: 0.7,
              '&:hover': {
                opacity: 1,
                bgcolor: 'action.hover',
              },
              '&:disabled': {
                opacity: 0.4,
              },
            }}
          >
            <Refresh
              sx={{
                fontSize: '1rem',
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}

