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
import { TrendingUp, TrendingDown, AccessTime, AttachMoney, Close, CurrencyBitcoin, CheckCircle, Pending } from '@mui/icons-material'
import { useWallet, useContract } from '@/hooks'
import { useStaking, useStakeablePredictions } from '@/hooks'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { getCryptoImageUrl } from '@/lib/coingecko/images'
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
  const { stakeOnCrypto, isPending, isConfirming, isConfirmed, error: stakeError, receipt, hash } = useStaking()

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
    if (isConfirmed || receipt) {
      console.log('Response: Stake transaction confirmed')

      if (selectedPrediction) {
        setSnackbar({
          open: true,
          message: 'Transaction confirmed! Refreshing predictions...',
          severity: 'success'
        })
        setStakeModalOpen(false)
        const stakedPredictionId = selectedPrediction.predictionId
        setSelectedPrediction(null)
        setStakeAmount('0.01')
        setStakeDirection('up')

        // Refetch with retries to ensure blockchain state is updated
        const refetchWithRetries = async (attempt = 1, maxAttempts = 3) => {
          const delays = [2000, 5000, 10000] // Increasing delays: 2s, 5s, 10s
          const delay = delays[Math.min(attempt - 1, delays.length - 1)]

          await new Promise(resolve => setTimeout(resolve, delay))

          try {
            console.log(`Refetching predictions (attempt ${attempt}/${maxAttempts})...`)
            await refetchPredictions()
            console.log(`Successfully refetched predictions on attempt ${attempt}`)

            if (attempt === maxAttempts) {
              setSnackbar({
                open: true,
                message: 'Predictions updated!',
                severity: 'success'
              })
            }
          } catch (error) {
            console.error(`Refetch attempt ${attempt} failed:`, error)
            if (attempt < maxAttempts) {
              // Retry with next delay
              refetchWithRetries(attempt + 1, maxAttempts)
            } else {
              setSnackbar({
                open: true,
                message: 'Predictions may take a moment to update. Please refresh the page if needed.',
                severity: 'success'
              })
            }
          }
        }

        refetchWithRetries()
      }
    }
  }, [isConfirmed, receipt, selectedPrediction, address, predictionStakingAddress, refetchPredictions])

  useEffect(() => {
    if (isPending || isConfirming) {
      const timeout = setTimeout(() => {
        if (isPending || isConfirming) {
          setStakeFieldError('Transaction is taking longer than expected. Please check your wallet or try again.')
          setSnackbar({
            open: true,
            message: 'Transaction timeout. Please check your wallet.',
            severity: 'error'
          })
        }
      }, 120000)

      return () => clearTimeout(timeout)
    }
  }, [isPending, isConfirming])

  useEffect(() => {
    if (stakeError) {
      const errorMsg = stakeError.message || 'Failed to stake'
      setStakeFieldError(errorMsg)
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error'
      })
      setStakeModalOpen(false)
      setSelectedPrediction(null)
      setStakeAmount('0.01')
      setStakeDirection('up')
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
      const expiresAtNum = parseInt(prediction.expiresAt)
      const expiresAt = expiresAtNum > 1e12 ? expiresAtNum : expiresAtNum * 1000
      const hasStake = parseFloat(prediction.userStakeUp || '0') > 0 ||
        parseFloat(prediction.userStakeDown || '0') > 0
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

    if (!stakeAmount || parseFloat(stakeAmount) < 0.00001) {
      setStakeFieldError('Please enter a valid stake amount (minimum 0.00001 BNB)')
      return
    }

    setStakeFieldError(null)


    try {
      const percentChange = parseFloat(selectedPrediction.percentChange || '0')
      await stakeOnCrypto(
        selectedPrediction.cryptoId,
        selectedPrediction.currentPrice,
        selectedPrediction.predictedPrice,
        selectedPrediction.direction,
        percentChange,
        stakeAmount,
        stakeDirection === 'up',
        selectedPrediction.libraryId || null,
        selectedPrediction.stakeId || null // Pass stakeId if it exists (for joining existing stake)
      )
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
    setSnackbar({
      open: true,
      message: 'Claim rewards functionality not available',
      severity: 'success'
    })
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
      // percentChange is already in percentage form (e.g., 10.5 = 10.5%), not scaled
      return num.toFixed(2)
    } catch {
      return '0.00'
    }
  }

  // Calculate predicted price from current price and percentChange
  // percentChange is already in percentage form (e.g., 10.5 = 10.5%), so divide by 100 to get decimal (0.105)
  const calculatePredictedPrice = (currentPrice: string, percentChange: string, direction: string) => {
    try {
      const currentPriceNum = parseFloat(currentPrice)
      const percentDecimal = parseFloat(percentChange) / 100 // percentChange is already a percentage, so divide by 100 to get decimal
      const multiplier = direction === 'up' ? (1 + percentDecimal) : (1 - percentDecimal)
      const calculatedPredicted = currentPriceNum * multiplier
      return calculatedPredicted.toFixed(6) // Use more precision for small prices
    } catch {
      return currentPrice // Fallback to current price
    }
  }

  // Calculate actual direction based on calculated predicted price
  // The stored predictedPrice may be incorrect, so we calculate it from currentPrice and percentChange
  const getActualDirection = (currentPrice: string, percentChange: string, storedDirection: string) => {
    try {
      const currentPriceNum = parseFloat(currentPrice)
      const percentDecimal = parseFloat(percentChange) / 100 // percentChange is already a percentage, so divide by 100 to get decimal

      // Calculate predicted price based on stored direction
      const calculatedPredicted = currentPriceNum * (storedDirection === 'up' ? (1 + percentDecimal) : (1 - percentDecimal))

      // Direction is determined by whether calculated predicted price is higher or lower than current
      return calculatedPredicted > currentPriceNum ? 'up' : 'down'
    } catch {
      return storedDirection // Fallback to stored direction
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const expiryNum = parseInt(expiresAt)
    // If expiresAt is already in milliseconds (large number), use as-is, otherwise convert from seconds
    const expiry = expiryNum > 1e12 ? expiryNum : expiryNum * 1000
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
                Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS environment variable.
              </Alert>
            )}

            {predictionsError && !(!contractLoading && !predictionStakingAddress) && (
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
                No stakeable predictions available. Go to the market page and refresh to create new predictions.
              </Alert>
            )}

            <Stack spacing={2}>
              {predictions.map((prediction: any, index: number) => (
                <Card
                  key={prediction.predictionId || prediction.stakeId || `prediction-${index}`}
                  sx={{
                    cursor: 'pointer',
                    border: selectedPrediction?.predictionId === prediction.predictionId ? 2 : 1,
                    borderColor: selectedPrediction?.predictionId === prediction.predictionId
                      ? 'primary.main'
                      : prediction.rewarded
                        ? 'success.main'
                        : 'divider',
                    backgroundColor: prediction.rewarded ? 'action.hover' : '#ffffff',
                    bgcolor: prediction.rewarded ? 'action.hover' : '#ffffff',
                    '& .MuiCardContent-root': {
                      backgroundColor: prediction.rewarded ? 'action.hover' : '#ffffff',
                    },
                    '&:hover': {
                      borderColor: prediction.rewarded ? 'success.dark' : 'primary.main'
                    }
                  }}
                  style={{ backgroundColor: 'white' }}
                  onClick={() => setSelectedPrediction(prediction)}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {(() => {
                              const imageUrl = getCryptoImageUrl(prediction.cryptoId)
                              return (
                                <Box
                                  component="img"
                                  src={imageUrl}
                                  alt={prediction.cryptoId}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    flexShrink: 0
                                  }}
                                />
                              )
                            })()}
                            <Typography variant="h6" fontWeight="bold">
                              {prediction.cryptoId}
                            </Typography>
                          </Box>
                          <Tooltip title="Current market price vs the predicted price after the prediction period ends">
                            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'help' }}>
                              {(() => {
                                const calculatedPredicted = calculatePredictedPrice(prediction.currentPrice, prediction.percentChange, prediction.direction)
                                return `Current: $${parseFloat(prediction.currentPrice).toFixed(2)} → Predicted: $${calculatedPredicted}`
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
                              label={`↑ ${parseFloat(prediction.totalStakedUp || '0').toFixed(4)} BNB`}
                              size="small"
                              variant="outlined"
                              color="success"
                            />
                          </Tooltip>
                          <Tooltip title="Total amount staked by all users betting the price will go DOWN. If the price goes down, these stakers win rewards from the UP pool.">
                            <Chip
                              icon={<TrendingDown />}
                              label={`↓ ${parseFloat(prediction.totalStakedDown || '0').toFixed(4)} BNB`}
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
                          {prediction.rewarded && (
                            <Tooltip title="This prediction has been resolved and rewards have been distributed.">
                              <Chip
                                icon={<CheckCircle />}
                                label="Resolved"
                                size="small"
                                color="success"
                                variant="filled"
                              />
                            </Tooltip>
                          )}
                          {!prediction.rewarded && getTimeRemaining(prediction.expiresAt) === 'Expired' && (
                            <Tooltip title="This prediction has expired but is pending resolution.">
                              <Chip
                                icon={<Pending />}
                                label="Pending Resolution"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            </Tooltip>
                          )}
                          {(() => {
                            const stakeUp = parseFloat(prediction.userStakeUp || '0')
                            const stakeDown = parseFloat(prediction.userStakeDown || '0')
                            if (stakeUp > 0 || stakeDown > 0) {
                              return (
                                <Tooltip title="Your personal stake amounts. The first number is your stake for UP, the second is for DOWN.">
                                  <Chip
                                    icon={<AttachMoney />}
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
                          sx={{
                            bgcolor: '#7248d6',
                            '&:hover': {
                              bgcolor: '#5d3ab0'
                            }
                          }}
                          variant="contained"
                          size="small"
                          disabled={prediction.rewarded || getTimeRemaining(prediction.expiresAt) === 'Expired'}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPrediction(prediction);
                            setStakeModalOpen(true);
                            setStakeAmount('0.01');
                            setStakeDirection('up');
                            setStakeFieldError(null);
                          }}
                        >
                          {prediction.rewarded
                            ? 'Resolved'
                            : getTimeRemaining(prediction.expiresAt) === 'Expired'
                              ? 'Expired'
                              : parseFloat(prediction.userStakeUp || '0') > 0 || parseFloat(prediction.userStakeDown || '0') > 0
                                ? 'Stake More'
                                : 'Stake'}
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
              <Card sx={{ mt: 2, bgcolor: '#ffffff' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Claimable Rewards
                  </Typography>
                  <Stack spacing={1}>
                    {claimablePredictions.map((prediction: any, claimIndex: number) => (
                      <Box key={prediction.stakeId || prediction.cryptoId || `claimable-${claimIndex}`} sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="body2">
                          Prediction #{prediction.predictionId}: {prediction.cryptoId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Your stake: ↑{parseFloat(prediction.userStakeUp || '0').toFixed(4)} ↓{parseFloat(prediction.userStakeDown || '0').toFixed(4)} BNB
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

        <Dialog
          open={stakeModalOpen}
          onClose={() => setStakeModalOpen(false)}
          maxWidth="sm"
          fullWidth
          disableEnforceFocus={false}
          disableAutoFocus={false}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {selectedPrediction && (() => {
                  const imageUrl = getCryptoImageUrl(selectedPrediction.cryptoId)
                  return (
                    <Box
                      component="img"
                      src={imageUrl}
                      alt={selectedPrediction.cryptoId}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />
                  )
                })()}
                <Typography variant="h6">
                  {selectedPrediction ? `Stake on ${selectedPrediction.cryptoId}` : 'Stake on Prediction'}
                </Typography>
              </Box>
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
                    Current: ${parseFloat(selectedPrediction.currentPrice).toFixed(2)} → Predicted: ${calculatePredictedPrice(selectedPrediction.currentPrice, selectedPrediction.percentChange, selectedPrediction.direction)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Prediction: {selectedPrediction.direction === 'up' ? '↑' : '↓'} {formatPercent(selectedPrediction.percentChange)}%
                  </Typography>
                </Box>
                {(parseFloat(selectedPrediction.userStakeUp || '0') > 0 || parseFloat(selectedPrediction.userStakeDown || '0') > 0) && (
                  <Alert severity="info">
                    Your current stake: ↑{parseFloat(selectedPrediction.userStakeUp || '0').toFixed(4)} BNB ↓{parseFloat(selectedPrediction.userStakeDown || '0').toFixed(4)} BNB
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
                  inputProps={{ min: '0.00001', step: '0.00001' }}
                  error={!!stakeFieldError}
                  helperText={stakeFieldError || 'Minimum stake: 0.00001 BNB'}
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
            <Button
              onClick={() => {
                setStakeModalOpen(false)
                setStakeFieldError(null)
                setSelectedPrediction(null)
                setStakeAmount('0.01')
                setStakeDirection('up')
              }}
              disabled={isPending && !isConfirming}
            >
              {isPending && !isConfirming ? 'Waiting for wallet...' : 'Cancel'}
            </Button>
            <Button
              variant="contained"
              onClick={handleStake}
              disabled={isPending || isConfirming || !stakeAmount || parseFloat(stakeAmount) < 0.00001}
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

