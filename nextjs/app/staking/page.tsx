'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material'
import { TrendingUp, TrendingDown, AccessTime, AccountBalance, Close } from '@mui/icons-material'
import { useWallet, useContract } from '@/hooks'
import { useStaking, useStakeablePredictions } from '@/hooks'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import Header from '@/components/Header'
import NotificationSnackbar from '@/components/NotificationSnackbar'
import { SnackbarState } from '@/types'

export default function StakingPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { address, isConnected, handleConnect, handleDisconnect } = useWallet()
  const { predictionStakingAddress, loading: contractLoading } = useContract()
  const { address: wagmiAddress } = useAccount()
  const { predictions, loading: predictionsLoading, error: predictionsError, refetch: refetchPredictions } = useStakeablePredictions()
  const { stake, claimRewards, isPending, isConfirming, isConfirmed, error: stakeError, receipt } = useStaking()
  
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null)
  const [stakeModalOpen, setStakeModalOpen] = useState(false)
  const [stakeAmount, setStakeAmount] = useState('0.01')
  const [stakeDirection, setStakeDirection] = useState<'up' | 'down'>('up')
  const [stakeFieldError, setStakeFieldError] = useState<string | null>(null)
  const [claimablePredictions, setClaimablePredictions] = useState<any[]>([])
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  useEffect(() => {
    if (isConfirmed && selectedPrediction) {
      console.log('Stake transaction confirmed! Verifying stake on-chain...')
      console.log('Transaction receipt:', receipt)
      console.log('Staked on predictionId:', selectedPrediction.predictionId)
      
      setSnackbar({
        open: true,
        message: 'Transaction confirmed!',
        severity: 'success'
      })
      setStakeModalOpen(false)
      const stakedPredictionId = selectedPrediction.predictionId
      setSelectedPrediction(null)
      setStakeAmount('0.01')
      setStakeDirection('up')
      
      setTimeout(async () => {
        console.log('Calling refetchPredictions after stake confirmation')
        refetchPredictions()
      }, 3000)
    }
  }, [isConfirmed, receipt, selectedPrediction, address, predictionStakingAddress, refetchPredictions])

  useEffect(() => {
    if (stakeError) {
      setStakeFieldError(stakeError.message || 'Failed to stake')
      setSnackbar({
        open: true,
        message: stakeError.message || 'Failed to stake',
        severity: 'error'
      })
    }
  }, [stakeError])

  // Calculate claimable predictions from blockchain data
  // A prediction is claimable if:
  // 1. It's verified
  // 2. It has expired
  // 3. User has staked on it
  useEffect(() => {
    if (!predictions || predictions.length === 0) {
      setClaimablePredictions([])
      return
    }

    const now = Date.now()
    const claimable = predictions.filter((prediction: any) => {
      const expiresAt = parseInt(prediction.expiresAt) * 1000
      const hasStake = parseFloat(formatEther(BigInt(prediction.userStakeUp || '0'))) > 0 || 
                       parseFloat(formatEther(BigInt(prediction.userStakeDown || '0'))) > 0
      const isExpired = expiresAt > 0 && expiresAt < now
      const isVerified = prediction.verified === true
      
      return isVerified && isExpired && hasStake
    })

    setClaimablePredictions(claimable)
  }, [predictions])

  useEffect(() => {
    if (!mounted) return
    const params = new URLSearchParams(window.location.search)
    const predictionId = params.get('predictionId')
    if (predictionId && predictions.length > 0) {
      const prediction = predictions.find((p: any) => p.predictionId === parseInt(predictionId))
      if (prediction) {
        setSelectedPrediction(prediction)
      }
    }
  }, [predictions, mounted])

  const handleStake = async () => {
    if (!selectedPrediction) return
    
    if (!stakeAmount || parseFloat(stakeAmount) < 0.001) {
      setStakeFieldError('Please enter a valid stake amount (minimum 0.001 BNB)')
      return
    }

    setStakeFieldError(null)
    
    console.log('🔴 STAKE BUTTON CLICKED:', {
      predictionId: selectedPrediction.predictionId,
      amount: stakeAmount,
      direction: stakeDirection,
      cryptoId: selectedPrediction.cryptoId,
      address: address
    })
    
    try {
      await stake(BigInt(selectedPrediction.predictionId), stakeAmount, stakeDirection === 'up')
    } catch (error: any) {
      const errorMsg = error?.message || error?.info?.error?.message || 'Failed to stake'
      setStakeFieldError(errorMsg)
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error'
      })
    }
  }

  const handleClaimRewards = async (predictionId: string) => {
    try {
      claimRewards(BigInt(predictionId))
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to claim rewards',
        severity: 'error'
      })
    }
  }

  const formatPrice = (priceWei: string) => {
    try {
      return parseFloat(formatEther(BigInt(priceWei))).toFixed(2)
    } catch {
      return '0.00'
    }
  }

  const formatPercent = (percent: string) => {
    try {
      const num = parseFloat(percent)
      return (num / 100).toFixed(2)
    } catch {
      return '0.00'
    }
  }

  // Calculate predicted price from current price and percentChange
  // percentChange is stored scaled by 100 (e.g., 830 = 8.30%), so divide by 10000 to get decimal (0.083)
  const calculatePredictedPrice = (currentPriceWei: string, percentChange: string, direction: string) => {
    try {
      const currentPrice = parseFloat(formatEther(BigInt(currentPriceWei)))
      const percentDecimal = parseFloat(percentChange) / 10000 // percentChange is scaled by 100, so divide by 10000 to get decimal
      const multiplier = direction === 'up' ? (1 + percentDecimal) : (1 - percentDecimal)
      const calculatedPredicted = currentPrice * multiplier
      return calculatedPredicted.toFixed(6) // Use more precision for small prices
    } catch {
      return formatPrice(currentPriceWei) // Fallback to current price
    }
  }

  // Calculate actual direction based on calculated predicted price
  // The stored predictedPrice may be incorrect, so we calculate it from currentPrice and percentChange
  const getActualDirection = (currentPriceWei: string, percentChange: string, storedDirection: string) => {
    try {
      const currentPrice = parseFloat(formatEther(BigInt(currentPriceWei)))
      const percentDecimal = parseFloat(percentChange) / 10000 // percentChange is scaled by 100, so divide by 10000 to get decimal
      
      // Calculate predicted price based on stored direction
      const calculatedPredicted = currentPrice * (storedDirection === 'up' ? (1 + percentDecimal) : (1 - percentDecimal))
      
      // Direction is determined by whether calculated predicted price is higher or lower than current
      return calculatedPredicted > currentPrice ? 'up' : 'down'
    } catch {
      return storedDirection // Fallback to stored direction
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const expiry = parseInt(expiresAt) * 1000
    const now = Date.now()
    const diff = expiry - now
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (!mounted || !isConnected) {
    return null
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Header
          address={address}
          isConnected={isConnected}
          isConnecting={false}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />

        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mt: 4, mb: 2 }}>
          Stake on Predictions
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>

            {predictionsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {contractLoading && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Loading contract configuration...
              </Alert>
            )}

            {!contractLoading && !predictionStakingAddress && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Contract address not configured. Please set PREDICTION_STAKING_ADDRESS in your backend .env file.
              </Alert>
            )}

            {predictionsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {predictionsError}
              </Alert>
            )}

            {!predictionsLoading && predictions.length === 0 && (
              <Alert 
                severity="info"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => router.push('/market')}
                  >
                    Go to Market
                  </Button>
                }
              >
                No stakeable predictions available. Predictions are created when you refresh the market page. Click the refresh button on the market page to create new predictions.
              </Alert>
            )}

            <Stack spacing={2}>
              {predictions.map((prediction: any) => (
                <Card
                  key={prediction.predictionId}
                  sx={{
                    cursor: 'pointer',
                    border: selectedPrediction?.predictionId === prediction.predictionId ? 2 : 1,
                    borderColor: selectedPrediction?.predictionId === prediction.predictionId ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main'
                    }
                  }}
                  onClick={() => setSelectedPrediction(prediction)}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {prediction.cryptoId}
                          </Typography>
                          <Tooltip title="Current market price vs the predicted price after the prediction period ends">
                            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'help' }}>
                              {(() => {
                                const calculatedPredicted = calculatePredictedPrice(prediction.currentPrice, prediction.percentChange, prediction.direction)
                                return `Current: $${formatPrice(prediction.currentPrice)} → Predicted: $${calculatedPredicted}`
                              })()}
                            </Typography>
                          </Tooltip>
                        </Box>
                        {(() => {
                          const actualDirection = getActualDirection(prediction.currentPrice, prediction.percentChange, prediction.direction)
                          return (
                            <Tooltip title={`Predicted ${actualDirection === 'up' ? 'increase' : 'decrease'} in price by ${formatPercent(prediction.percentChange)}% - by Seery`}>
                              <Chip
                                icon={actualDirection === 'up' ? <TrendingUp /> : <TrendingDown />}
                                label={`${actualDirection === 'up' ? '↑' : '↓'} ${formatPercent(prediction.percentChange)}%`}
                                color={actualDirection === 'up' ? 'success' : 'error'}
                                size="small"
                              />
                            </Tooltip>
                          )
                        })()}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Tooltip title="Total amount staked by all users betting the price will go UP. If the price goes up, these stakers win rewards from the DOWN pool.">
                            <Chip
                              icon={<TrendingUp />}
                              label={`↑ ${parseFloat(formatEther(BigInt(prediction.totalStakedUp || '0'))).toFixed(4)} BNB`}
                              size="small"
                              variant="outlined"
                              color="success"
                            />
                          </Tooltip>
                          <Tooltip title="Total amount staked by all users betting the price will go DOWN. If the price goes down, these stakers win rewards from the UP pool.">
                            <Chip
                              icon={<TrendingDown />}
                              label={`↓ ${parseFloat(formatEther(BigInt(prediction.totalStakedDown || '0'))).toFixed(4)} BNB`}
                              size="small"
                              variant="outlined"
                              color="error"
                            />
                          </Tooltip>
                          <Tooltip title="Time remaining until this prediction expires. After expiry, rewards are distributed to winning stakers.">
                            <Chip
                              icon={<AccessTime />}
                              label={getTimeRemaining(prediction.expiresAt)}
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                          {(() => {
                            const stakeUp = parseFloat(formatEther(BigInt(prediction.userStakeUp || '0')))
                            const stakeDown = parseFloat(formatEther(BigInt(prediction.userStakeDown || '0')))
                            if (stakeUp > 0 || stakeDown > 0) {
                              return (
                                <Tooltip title="Your personal stake amounts. The first number is your stake for UP, the second is for DOWN.">
                                  <Chip
                                    icon={<AccountBalance />}
                                    label={`Your stake: ↑${stakeUp.toFixed(4)} ↓${stakeDown.toFixed(4)}`}
                                    size="small"
                                    color="primary"
                                  />
                                </Tooltip>
                              )
                            }
                            return null
                          })()}
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPrediction(prediction);
                            setStakeModalOpen(true);
                            setStakeAmount('0.01');
                            setStakeDirection('up');
                            setStakeFieldError(null);
                          }}
                        >
                          {parseFloat(formatEther(BigInt(prediction.userStakeUp || '0'))) > 0 || parseFloat(formatEther(BigInt(prediction.userStakeDown || '0'))) > 0 ? 'Stake More' : 'Stake'}
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12}>
            {claimablePredictions.length > 0 && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Claimable Rewards
                  </Typography>
                  <Stack spacing={1}>
                    {claimablePredictions.map((prediction: any) => (
                      <Box key={prediction.predictionId} sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="body2">
                          Prediction #{prediction.predictionId}: {prediction.cryptoId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Your stake: ↑{parseFloat(formatEther(BigInt(prediction.userStakeUp || '0'))).toFixed(4)} ↓{parseFloat(formatEther(BigInt(prediction.userStakeDown || '0'))).toFixed(4)} BNB
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleClaimRewards(prediction.predictionId)}
                          disabled={isPending || isConfirming}
                          sx={{ mt: 1 }}
                        >
                          Claim Rewards
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Grid>

        </Grid>

        <Dialog open={stakeModalOpen} onClose={() => setStakeModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {selectedPrediction ? `Stake on ${selectedPrediction.cryptoId}` : 'Stake on Prediction'}
                  </Typography>
              <IconButton onClick={() => setStakeModalOpen(false)} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedPrediction && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current: ${formatPrice(selectedPrediction.currentPrice)} → Predicted: ${calculatePredictedPrice(selectedPrediction.currentPrice, selectedPrediction.percentChange, selectedPrediction.direction)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                    Prediction: {selectedPrediction.direction === 'up' ? '↑' : '↓'} {formatPercent(selectedPrediction.percentChange)}%
                        </Typography>
                </Box>
                {(parseFloat(formatEther(BigInt(selectedPrediction.userStakeUp || '0'))) > 0 || parseFloat(formatEther(BigInt(selectedPrediction.userStakeDown || '0'))) > 0) && (
                  <Alert severity="info">
                    Your current stake: ↑{parseFloat(formatEther(BigInt(selectedPrediction.userStakeUp || '0'))).toFixed(4)} BNB ↓{parseFloat(formatEther(BigInt(selectedPrediction.userStakeDown || '0'))).toFixed(4)} BNB
                  </Alert>
                )}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Choose Direction
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant={stakeDirection === 'up' ? 'contained' : 'outlined'}
                      color="success"
                      onClick={() => setStakeDirection('up')}
                      fullWidth
                      startIcon={<TrendingUp />}
                    >
                      Up
                    </Button>
                    <Button
                      variant={stakeDirection === 'down' ? 'contained' : 'outlined'}
                      color="error"
                      onClick={() => setStakeDirection('down')}
                      fullWidth
                      startIcon={<TrendingDown />}
                    >
                      Down
                    </Button>
                  </Stack>
                </Box>
                <TextField
                  label="Stake Amount (BNB)"
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => {
                    setStakeAmount(e.target.value)
                    setStakeFieldError(null)
                  }}
                  fullWidth
                  inputProps={{ min: '0.001', step: '0.001' }}
                  error={!!stakeFieldError}
                  helperText={stakeFieldError || 'Minimum stake: 0.001 BNB'}
                />
                {isConfirmed && (
                  <Alert severity="success">
                    Stake placed successfully!
                  </Alert>
            )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStakeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleStake}
              disabled={isPending || isConfirming || !stakeAmount || parseFloat(stakeAmount) < 0.001}
              startIcon={(isPending || isConfirming) ? <CircularProgress size={16} /> : null}
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Stake BNB'}
            </Button>
          </DialogActions>
        </Dialog>

        <NotificationSnackbar
          snackbar={snackbar}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Container>
    </Box>
  )
}

