'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Stack,
  Divider
} from '@mui/material'
import { Assessment, TrendingUp, CheckCircle, People, EmojiEvents } from '@mui/icons-material'
import { useWallet } from '@/hooks'
import Header from '@/components/Header'
import { useAnalytics, formatTotalStaked, calculateAccuracyRate } from '../index'

export default function AnalyticsPage() {
  const router = useRouter()
  const { address, isConnected } = useWallet()
  const { analytics, loading, error, mounted, isAdmin } = useAnalytics()

  useEffect(() => {
    if (mounted && !isConnected) {
      router.push('/')
      return
    }

    if (mounted && !isAdmin) {
      router.push('/')
      return
    }
  }, [mounted, isConnected, isAdmin, router])

  if (!mounted || !isConnected) {
    return null
  }

  if (!isAdmin) {
    return null
  }

  return (
    <Box>
      <Header
        address={address}
        isConnected={isConnected}
        isConnecting={false}
        onConnect={() => {}}
        onDisconnect={() => {}}
      />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
          Analytics Dashboard
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && analytics && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                        {analytics.ongoingStakes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ongoing Stakes
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                        {analytics.resolvedStakes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Resolved Stakes
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <People sx={{ fontSize: 40, color: 'info.main' }} />
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                        {analytics.uniqueStakers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Unique Stakers
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <EmojiEvents sx={{ fontSize: 40, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                        {analytics.correctPredictions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Correct Predictions
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Stakes
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {analytics.totalStakes}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount Staked
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {formatTotalStaked(analytics.totalAmountStaked)} BNB
                      </Typography>
                    </Grid>
                    {analytics.resolvedStakes > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Accuracy Rate
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {calculateAccuracyRate(analytics)}%
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  )
}

