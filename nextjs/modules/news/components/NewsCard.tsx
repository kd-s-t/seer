'use client'

import { Card, CardContent, Typography, Box } from '@mui/material'
import { NewsItem } from '../types'
import { getCryptoImageUrl } from '../utils'

interface NewsCardProps {
  item: NewsItem
  index: number
}

export default function NewsCard({ item, index }: NewsCardProps) {
  const imageUrl = getCryptoImageUrl(item, index)

  return (
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
  )
}

