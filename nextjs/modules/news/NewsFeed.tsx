'use client'

import { Grid, Typography, Box, CircularProgress, IconButton } from '@mui/material'
import { Refresh } from '@mui/icons-material'
import { motion } from 'framer-motion'

import { useNews } from './hooks'
import { getGridSizes } from './utils'
import NewsCard from './NewsCard'

export default function NewsFeed() {
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

  const { news, loading, error, lastRefreshed, refreshing, mounted, handleRefresh } = useNews()
  const gridSizes = getGridSizes(news)

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
          We&apos;re having trouble loading the latest crypto news. Please try again later.
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
                <NewsCard item={item} index={index} />
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

