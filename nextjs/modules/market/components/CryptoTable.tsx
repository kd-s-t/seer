'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Link,
  Autocomplete,
  TextField,
  InputAdornment,
} from '@mui/material'
import { Close, Refresh, AccountBalance, Search } from '@mui/icons-material'
import { TrendingUp, TrendingDown, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { getCryptoPrices, type CryptoPrice, type NewsSource } from '@/lib/coingecko'
import { getCryptoLibrary, type CryptoLibraryItem } from '@/lib/coingecko/library'
import { useStaking } from '@/hooks'
import { parseEther } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { PREDICTION_STAKING_ABI } from '@/lib/blockchain/predictionStaking'
import { useContract } from '@/hooks/useContract'
import { useCurrency } from '@/contexts/CurrencyContext'
import { type SortOption, type SortDirection } from '../types'
import { formatPercent as formatPercentUtil, formatLastFetchTime as formatLastFetchTimeUtil, sortCryptos as sortCryptosUtil, getCacheKey as getCacheKeyUtil } from '../utils'
import { CACHE_TTL_DEFAULT, CACHE_TTL_FILTERED } from '../const'

export default function CryptoTable() {
  const router = useRouter()
  const { currency, formatPrice, convertPrice } = useCurrency()
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([])
  const [usdCryptos, setUsdCryptos] = useState<CryptoPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [tradingLoading, setTradingLoading] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReasoning, setSelectedReasoning] = useState<{ crypto: string; reasoning: string; newsSources?: NewsSource[] } | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cryptoLibrary, setCryptoLibrary] = useState<CryptoLibraryItem[]>([])
  const [selectedCryptos, setSelectedCryptos] = useState<CryptoLibraryItem[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [stakeModalOpen, setStakeModalOpen] = useState(false)
  const [selectedCryptoForStake, setSelectedCryptoForStake] = useState<CryptoPrice | null>(null)
  const [stakeAmount, setStakeAmount] = useState('0.01')
  const [stakeDirection, setStakeDirection] = useState<'up' | 'down'>('up')
  const [creatingPrediction, setCreatingPrediction] = useState(false)
  const [stakeFieldError, setStakeFieldError] = useState<string | null>(null)
  const [pendingRecordHash, setPendingRecordHash] = useState<`0x${string}` | null>(null)
  const [pendingStake, setPendingStake] = useState<{ amount: string; direction: 'up' | 'down' } | null>(null)
  const { stakeOnCrypto, isPending, isConfirming, isConfirmed, error: stakeError, hash: stakeHash, receipt } = useStaking()
  const { predictionStakingAddress } = useContract()
  const { writeContract: writeRecordPrediction, data: recordHash, isPending: isRecordingPrediction, error: recordError } = useWriteContract()
  const { isLoading: isWaitingRecord, isSuccess: isRecordConfirmed, data: recordReceipt, isError: isRecordError } = useWaitForTransactionReceipt({
    hash: recordHash,
    query: {
      enabled: !!recordHash,
      retry: 20, // Increased retries
      retryDelay: 2000,
      refetchInterval: (data) => {
        if (data) return false
        return 2000
      },
    },
    confirmations: 1,
    timeout: 120000, // Increased to 120 seconds (2 minutes)
  })
  const publicClient = usePublicClient()
  const [localReceipt, setLocalReceipt] = useState<any>(null)
  // Removed useStakeablePredictions - stakes should only be loaded on staking page

  useEffect(() => {
    if (recordError && creatingPrediction) {
      const error = recordError as any

      let errorMsg = 'Transaction failed'

      if (error?.shortMessage) {
        errorMsg = error.shortMessage
      } else if (error?.message) {
        errorMsg = error.message
        if (errorMsg.includes('revert')) {
          const revertMatch = errorMsg.match(/revert\s+(.+)/i)
          if (revertMatch) {
            errorMsg = revertMatch[1]
          }
        }
      } else if (error?.cause?.message) {
        errorMsg = error.cause.message
      } else if (error?.data?.message) {
        errorMsg = error.data.message
      }

      setStakeFieldError(errorMsg)
      setCreatingPrediction(false)
      setPendingRecordHash(null)
      setPendingStake(null)
    }
  }, [recordError, creatingPrediction])

  useEffect(() => {
    if (isRecordError && creatingPrediction) {
      const error = isRecordError as any

      let errorMsg = 'Transaction reverted. Please check the transaction details.'

      if (error?.shortMessage) {
        errorMsg = error.shortMessage
      } else if (error?.message) {
        errorMsg = error.message
        if (errorMsg.includes('revert')) {
          const revertMatch = errorMsg.match(/revert\s+(.+)/i)
          if (revertMatch) {
            errorMsg = revertMatch[1]
          }
        }
      } else if (error?.cause?.message) {
        errorMsg = error.cause.message
      }

      if (recordHash && publicClient) {
        (async () => {
          try {
            const tx = await publicClient.getTransaction({ hash: recordHash })

            try {
              await publicClient.call({
                to: tx.to,
                data: tx.input,
                value: tx.value,
                account: tx.from
              })
            } catch (callErr: any) {
              if (callErr?.data) {
                try {
                  const { decodeErrorResult } = await import('viem')
                  const decoded = decodeErrorResult({
                    abi: PREDICTION_STAKING_ABI,
                    data: callErr.data as `0x${string}`
                  })
                  if (decoded.errorName && decoded.args) {
                    const newErrorMsg = `${decoded.errorName}: ${decoded.args[0] || JSON.stringify(decoded.args)}`
                    setStakeFieldError(newErrorMsg)
                  }
                } catch (decodeErr) {
                  if (callErr?.message) {
                    const msgMatch = callErr.message.match(/revert\s+(.+)/i)
                    if (msgMatch) {
                      setStakeFieldError(msgMatch[1])
                    }
                  }
                }
              } else if (callErr?.message) {
                const msgMatch = callErr.message.match(/revert\s+(.+)/i)
                if (msgMatch) {
                  setStakeFieldError(msgMatch[1])
                }
              }
            }
          } catch (err) {
            // Silent
          }
        })()
      }

      setStakeFieldError(errorMsg)
      setCreatingPrediction(false)
      setPendingRecordHash(null)
      setPendingStake(null)
    }
  }, [isRecordError, creatingPrediction, recordHash, publicClient])

  useEffect(() => {
    if (isRecordConfirmed && recordReceipt && pendingRecordHash && recordHash && recordHash === pendingRecordHash && creatingPrediction) {
      const processRecordPrediction = async () => {
        try {
          if (recordReceipt.status !== 'success') {
            const errorMsg = recordReceipt.status === 'reverted'
              ? 'Transaction reverted. Check console for details.'
              : 'Transaction failed'
            setStakeFieldError(errorMsg)
            setCreatingPrediction(false)
            setPendingRecordHash(null)
            setPendingStake(null)
            return
          }

          const { decodeEventLog, parseEventLogs } = await import('viem')
          const contractAddress = predictionStakingAddress?.toLowerCase()
          if (!contractAddress) {
            throw new Error('Contract address not configured')
          }

          setCreatingPrediction(false)
          setPendingRecordHash(null)
          setPendingStake(null)
        } catch (error: any) {
          setStakeFieldError(error.message || 'Failed to process prediction')
          setCreatingPrediction(false)
          setPendingRecordHash(null)
          setPendingStake(null)
        }
      }
      processRecordPrediction()
    }
  }, [isRecordConfirmed, recordReceipt, pendingRecordHash, recordHash, predictionStakingAddress, selectedCryptoForStake, creatingPrediction, pendingStake])

  useEffect(() => {
    if (recordHash && creatingPrediction && !pendingRecordHash) {
      setPendingRecordHash(recordHash)
    }
  }, [recordHash, creatingPrediction, pendingRecordHash])

  useEffect(() => {
    if (pendingRecordHash && !isRecordConfirmed && !isWaitingRecord && creatingPrediction) {
      const timeout = setTimeout(async () => {
        if (creatingPrediction && pendingRecordHash) {
          if (publicClient) {
            try {
              const receipt = await publicClient.getTransactionReceipt({ hash: pendingRecordHash })
              if (receipt) {
                return
              }
              const tx = await publicClient.getTransaction({ hash: pendingRecordHash })
              if (tx) {
                setStakeFieldError(`Transaction pending. Hash: ${pendingRecordHash.slice(0, 10)}... Please wait or check your wallet.`)
                return
              }
            } catch (checkError) {
              // Silent
            }
          }

          setStakeFieldError(`Transaction confirmation timed out. Transaction hash: ${pendingRecordHash.slice(0, 10)}... Please check the transaction in your wallet or try again.`)
          setCreatingPrediction(false)
          setPendingRecordHash(null)
          setPendingStake(null)
        }
      }, 60000)
      return () => clearTimeout(timeout)
    }
  }, [pendingRecordHash, isRecordConfirmed, isWaitingRecord, creatingPrediction, publicClient])

  useEffect(() => {
    if (isRecordingPrediction && creatingPrediction && !recordHash) {
      const timeout = setTimeout(() => {
        if (isRecordingPrediction && creatingPrediction && !recordHash) {
          setStakeFieldError('Transaction submission timed out. Please check your wallet and try again.')
          setCreatingPrediction(false)
          setPendingStake(null)
        }
      }, 20000)
      return () => clearTimeout(timeout)
    }
  }, [isRecordingPrediction, creatingPrediction, recordHash])

  const processedReceiptRef = useRef<string | null>(null)

  useEffect(() => {
    if (stakeError) {
      const errorAny = stakeError as any
      const errorMsg = stakeError?.message || errorAny?.info?.error?.message || ''
      if (errorMsg.includes('nonce') || errorMsg.includes('NONCE') || errorMsg.includes('Nonce')) {
        setStakeFieldError('Transaction already pending. Please wait for the current transaction to complete before trying again.')
      } else {
        setStakeFieldError(errorMsg)
      }
    }
  }, [stakeError])

  const selectedCryptosRef = useRef(selectedCryptos)

  useEffect(() => {
    selectedCryptosRef.current = selectedCryptos
  }, [selectedCryptos])

  useEffect(() => {
    const currentReceipt = receipt || localReceipt
    const receiptHash = currentReceipt?.transactionHash

    if (isConfirmed || currentReceipt) {
      const success = isConfirmed || (currentReceipt && currentReceipt.status === 'success')

      if (success && !creatingPrediction && receiptHash && receiptHash !== processedReceiptRef.current) {
        processedReceiptRef.current = receiptHash
        console.log('Response: Stake confirmed')
        setStakeModalOpen(false)
        setStakeAmount('0.01')
        setStakeDirection('up')
        setSelectedCryptoForStake(null)
        setStakeFieldError(null)

        // Redirect to staking page
        router.push('/staking')
      } else if (currentReceipt && currentReceipt.status !== 'success') {
        setStakeFieldError('Transaction reverted. Please check the transaction details.')
      }
    }
  }, [isConfirmed, receipt, localReceipt, creatingPrediction])

  useEffect(() => {
    if (!stakeHash || isConfirmed || receipt || localReceipt) {
      return
    }

    let cancelled = false
    const checkReceipt = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          const { createPublicClient, custom } = await import('viem')

          const client = createPublicClient({
            transport: custom(window.ethereum),
          })

          const txReceipt = await client.getTransactionReceipt({ hash: stakeHash as `0x${string}` })
          if (txReceipt && txReceipt.status === 'success' && !cancelled) {
            setLocalReceipt(txReceipt)
          }
        }
      } catch (error) {
        // Transaction not yet mined, continue polling
      }
    }

    const interval = setInterval(() => {
      checkReceipt()
    }, 1000)

    checkReceipt()

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [stakeHash, isConfirmed, receipt, localReceipt])

  useEffect(() => {
    if (stakeHash && !isConfirmed && !receipt && !localReceipt) {
      const timeout = setTimeout(() => {
        if (!isConfirming && !isPending) {
          setStakeModalOpen(false)
          setStakeAmount('0.01')
          setSelectedCryptoForStake(null)
        }
      }, 30000)

      return () => clearTimeout(timeout)
    }
  }, [stakeHash, isConfirmed, receipt, localReceipt, isConfirming, isPending])

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('crypto_last_fetch')
    if (saved) {
      try {
        setLastFetchTime(new Date(saved))
      } catch (e) {
        // Invalid date, ignore
      }
    }

    // Only use default cache if no cryptos are selected
    if (selectedCryptos.length === 0) {
      const cachedData = localStorage.getItem('crypto_prices_cache')
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData)
          const cacheAge = Date.now() - timestamp

          if (cacheAge < CACHE_TTL_DEFAULT && data && data.length > 0) {
            setUsdCryptos(data)
            setLoading(false)
          } else {
            localStorage.removeItem('crypto_prices_cache')
          }
        } catch (e) {
          localStorage.removeItem('crypto_prices_cache')
        }
      }
    }
  }, [])

  const fetchCryptoData = async (showLoading = true, forceRefresh = false, tags?: string[]) => {
    const cacheKey = getCacheKeyUtil(tags)

    if (forceRefresh) {
      // Clear cache for this specific key on force refresh
      localStorage.removeItem(cacheKey)
    }

    if (!forceRefresh) {
      const cachedData = localStorage.getItem(cacheKey)
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData)
          const cacheAge = Date.now() - timestamp

          if (cacheAge < CACHE_TTL_FILTERED) {
            setUsdCryptos(data)
            if (showLoading) {
              setLoading(false)
            }
            return
          }
        } catch (e) {
          // Invalid cache, continue to fetch
        }
      }
    }


    if (showLoading) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)
    try {
      const data = await getCryptoPrices(undefined, tags, 'usd', forceRefresh)

      if (data.success && data.cryptos && data.cryptos.length > 0) {
        console.log('List of predictions:', data.cryptos.length, 'predictions')
        // Attach libraryId from response to each crypto
        const cryptosWithLibraryId = data.cryptos.map(crypto => ({
          ...crypto,
          libraryId: data.libraryId || crypto.libraryId || null
        }))
        setUsdCryptos(cryptosWithLibraryId)
        const fetchTime = new Date()
        setLastFetchTime(fetchTime)
        localStorage.setItem('crypto_last_fetch', fetchTime.toISOString())
        localStorage.setItem(cacheKey, JSON.stringify({
          data: data.cryptos,
          timestamp: Date.now()
        }))
        setError(null)
      } else {
        localStorage.removeItem(cacheKey)
        setError(data.error || 'Failed to load crypto data')
        setUsdCryptos([])
      }
    } catch (err: any) {
      setError('Error loading crypto data: ' + err.message)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    if (lastFetchTime) {
      const timeSinceLastRefresh = Date.now() - lastFetchTime.getTime()
      const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds
      if (timeSinceLastRefresh < oneHour) {
        return // Cooldown active, don't refresh
      }
    }
    const tags = selectedCryptos.length > 0 ? selectedCryptos.map(c => c.id) : undefined
    fetchCryptoData(false, true, tags)
  }

  const isRefreshCooldown = () => {
    if (!lastFetchTime) return false
    const timeSinceLastRefresh = Date.now() - lastFetchTime.getTime()
    const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds
    return timeSinceLastRefresh < oneHour
  }

  const getCooldownRemaining = () => {
    if (!lastFetchTime) return null
    const timeSinceLastRefresh = Date.now() - lastFetchTime.getTime()
    const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds
    const remaining = oneHour - timeSinceLastRefresh
    if (remaining <= 0) return null
    const minutes = Math.ceil(remaining / (60 * 1000))
    return minutes
  }


  useEffect(() => {
    if (!mounted) return

    const initialTags = selectedCryptosRef.current.length > 0 ? selectedCryptosRef.current.map(c => c.id) : undefined
    fetchCryptoData(true, false, initialTags)

    const interval = setInterval(() => {
      const currentTags = selectedCryptosRef.current.length > 0 ? selectedCryptosRef.current.map(c => c.id) : undefined
      fetchCryptoData(false, false, currentTags)
    }, 60000)

    return () => clearInterval(interval)
  }, [mounted])

  useEffect(() => {
    if (usdCryptos.length === 0) return

    setCryptos(usdCryptos)
  }, [usdCryptos])

  useEffect(() => {
    const allCryptos = getCryptoLibrary()
    setCryptoLibrary(allCryptos)
    setLibraryLoading(false)
  }, [])

  const handleCryptoSelect = (values: CryptoLibraryItem[]) => {
    setSelectedCryptos(values)
  }

  // const handleBuy = async (crypto: CryptoPrice) => {
  //   const symbol = `${crypto.symbol}USDT`
  //   setTradingLoading(`buy-${crypto.id}`)
  //   try {
  //     const result = await buyCrypto({
  //       symbol,
  //       type: 'MARKET',
  //       quoteOrderQty: 100,
  //     })
  //     alert(`Buy order placed successfully!\nOrder ID: ${result.order.orderId}`)
  //   } catch (err: any) {
  //     alert(`Failed to place buy order: ${err.message}`)
  //   } finally {
  //     setTradingLoading(null)
  //   }
  // }

  // const handleSell = async (crypto: CryptoPrice) => {
  //   const symbol = `${crypto.symbol}USDT`
  //   setTradingLoading(`sell-${crypto.id}`)
  //   try {
  //     const quantity = prompt(`Enter quantity to sell for ${crypto.symbol}:`)
  //     if (!quantity || parseFloat(quantity) <= 0) {
  //       setTradingLoading(null)
  //       return
  //     }
  //     
  //     const result = await sellCrypto({
  //       symbol,
  //       type: 'MARKET',
  //       quantity: parseFloat(quantity),
  //     })
  //     alert(`Sell order placed successfully!\nOrder ID: ${result.order.orderId}`)
  //   } catch (err: any) {
  //     alert(`Failed to place sell order: ${err.message}`)
  //   } finally {
  //     setTradingLoading(null)
  //   }
  // }

  const handleShowMore = (crypto: CryptoPrice) => {
    if (crypto.reasoning) {
      setSelectedReasoning({
        crypto: `${crypto.name} (${crypto.symbol})`,
        reasoning: crypto.reasoning,
        newsSources: crypto.newsSources || []
      })
      setModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedReasoning(null)
  }

  const handleSort = (column: SortOption) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('desc')
    }
  }

  const sortedCryptos = useMemo(() => {
    return sortCryptosUtil(cryptos, sortBy, sortDirection)
  }, [cryptos, sortBy, sortDirection])

  if (!mounted) {
    return null
  }

  if (loading && cryptos.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && cryptos.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap', mt: 4, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" fontWeight="bold" sx={{ minWidth: 'fit-content' }}>
            Market
          </Typography>
          {lastFetchTime && (
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
              Last updated: {formatLastFetchTimeUtil(lastFetchTime)}
              {(() => {
                const cooldownMinutes = getCooldownRemaining()
                if (cooldownMinutes !== null) {
                  return ` (${cooldownMinutes}m cooldown)`
                }
                return ''
              })()}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <Autocomplete
            size='small'
            multiple
            options={cryptoLibrary}
            getOptionLabel={(option) => `${option.name} (${option.symbol})`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedCryptos}
            onChange={(_, newValue) => handleCryptoSelect(newValue)}
            loading={libraryLoading}
            filterOptions={(options, state) => {
              // Filter out already selected options from the dropdown
              const filtered = options.filter(
                (option) => !selectedCryptos.some((selected) => selected.id === option.id)
              )
              // But allow searching through all options
              if (state.inputValue) {
                return filtered.filter(option =>
                  option.name.toLowerCase().includes(state.inputValue.toLowerCase()) ||
                  option.symbol.toLowerCase().includes(state.inputValue.toLowerCase())
                )
              }
              return filtered
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start" sx={{ mr: '2px' }}>
                        <Search sx={{ color: 'rgba(0, 0, 0, 0.6)' }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'text.primary',
                    '&::placeholder': {
                      color: 'rgba(0, 0, 0, 0.6)',
                      opacity: 1,
                    },
                  },
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {option.image && (
                    <Box
                      component="img"
                      src={option.image}
                      alt={option.name}
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
                  )}
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.symbol}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index })
                return (
                  <Chip
                    key={key}
                    {...tagProps}
                    label={`${option.symbol}`}
                    size="small"
                    icon={option.image ? (
                      <Box
                        component="img"
                        src={option.image}
                        alt={option.name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : undefined}
                    sx={{
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                      '& .MuiChip-deleteIcon': {
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'text.primary',
                        },
                      },
                    }}
                  />
                )
              })
            }
            sx={{
              flex: 1,
              minWidth: 400,
              maxWidth: 'none',
              '& .MuiAutocomplete-inputRoot': {
                color: 'text.primary',
              },
              '& .MuiAutocomplete-popupIndicator': {
                display: 'none',
              },
              '& .MuiAutocomplete-clearIndicator': {
                color: 'text.secondary',
              },
              '& .MuiAutocomplete-listbox': {
                bgcolor: 'background.paper',
                '& .MuiAutocomplete-option': {
                  color: 'text.primary',
                  '&[aria-selected="true"]': {
                    bgcolor: 'action.selected',
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                },
              },
            }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={isRefreshing || loading || isRefreshCooldown()}
            sx={{
              color: 'text.primary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover'
              },
              '&:disabled': {
                borderColor: 'divider',
                color: 'text.disabled'
              }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          bgcolor: '#ffffff',
          overflowX: 'auto',
          borderRadius: '0.75rem',
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#ffffff' }}>
              <TableCell
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => handleSort('name')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <strong>Name</strong>
                  {sortBy === 'name' && (
                    sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => handleSort('price')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  <strong>Price</strong>
                  {sortBy === 'price' && (
                    sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  display: { xs: 'none', md: 'table-cell' }
                }}
              >
                <strong>Last 24hr</strong>
              </TableCell>
              <TableCell align="left">
                <strong>Analysis</strong>
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => handleSort('ai')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  <strong>Prediction</strong>
                  {sortBy === 'ai' && (
                    sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell align="right">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCryptos.length === 0 ? (
              <TableRow sx={{ bgcolor: '#ffffff' }}>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    {loading ? 'Loading...' : 'No cryptos found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedCryptos.map((crypto) => (
                <TableRow key={crypto.id} hover
                  sx={{
                    bgcolor: '#ffffff',
                    '& > td, & > th': {
                      verticalAlign: 'top',
                    },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      {crypto.image && (
                        <Box
                          component="img"
                          src={crypto.image}
                          alt={crypto.name}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />
                      )}
                      <Box>
                        <Typography variant="body1" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                          {crypto.symbol}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {crypto.name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight="medium">
                      {formatPrice(crypto.price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      {crypto.change24h >= 0 ? (
                        <TrendingUp sx={{ color: 'success.main', fontSize: 18 }} />
                      ) : (
                        <TrendingDown sx={{ color: 'error.main', fontSize: 18 }} />
                      )}
                      <Typography
                        variant="body1"
                        sx={{
                          color: crypto.change24h >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 'medium'
                        }}
                      >
                        {formatPercentUtil(crypto.change24h)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="left">
                    {(() => {
                      if (crypto.reasoning) {
                        return (
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: { xs: 150, sm: 250 },
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                mb: 0.5,
                                lineHeight: 1.4
                              }}
                            >
                              {crypto.reasoning}
                            </Typography>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleShowMore(crypto)}
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                p: 0,
                                minWidth: 'auto',
                                color: 'primary.main'
                              }}
                            >
                              See more
                            </Button>
                          </Box>
                        )
                      }
                      return (
                        <Typography variant="body2" color="text.secondary">
                          No analysis available
                        </Typography>
                      )
                    })()}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      {(() => {
                        const suggestionPercent = crypto.suggestionPercent
                        if (crypto.suggestion && typeof suggestionPercent === 'number') {
                          return (
                            <Chip
                              label={`${crypto.suggestion === 'up' ? '↑' : '↓'} ${formatPercentUtil(suggestionPercent)}`}
                              color={crypto.suggestion === 'up' ? 'success' : 'error'}
                              size="small"
                            />
                          )
                        }
                        return (
                          <Typography variant="body2" color="text.secondary">
                            No prediction
                          </Typography>
                        )
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedCryptoForStake(crypto)
                        setStakeModalOpen(true)
                      }}
                      sx={{
                        bgcolor: 'white',
                        borderColor: 'rgba(0, 0, 0, 0.23)',
                        color: 'text.primary',
                        '&:hover': {
                          bgcolor: 'white',
                          borderColor: 'rgba(0, 0, 0, 0.4)'
                        },
                        borderRadius: '16px'
                      }}
                    >
                      Stake
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus={false}
        disableAutoFocus={false}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedReasoning?.crypto}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseModal}
              sx={{ color: 'text.secondary' }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, mb: 2 }}>
            {selectedReasoning?.reasoning}
          </Typography>

          {selectedReasoning?.newsSources && selectedReasoning.newsSources.length > 0 && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                Sources:
              </Typography>
              <Stack spacing={1}>
                {selectedReasoning.newsSources.map((source, idx) => (
                  <Link
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: 'primary.main',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      {source.title} ({source.source})
                    </Typography>
                  </Link>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={stakeModalOpen}
        onClose={() => {
          setStakeModalOpen(false)
          setStakeDirection('up')
          setCreatingPrediction(false)
          setPendingRecordHash(null)
          setPendingStake(null)
          setStakeFieldError(null)
        }}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus={false}
        disableAutoFocus={false}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Stake on Prediction</Typography>
            <IconButton onClick={() => {
              setStakeModalOpen(false)
              setStakeDirection('up')
              setCreatingPrediction(false)
              setPendingRecordHash(null)
              setPendingStake(null)
              setStakeFieldError(null)
            }} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCryptoForStake && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {selectedCryptoForStake.symbol} - {selectedCryptoForStake.name}
                </Typography>
                {selectedCryptoForStake.suggestion && (
                  <Typography variant="body2" color="text.secondary">
                    Prediction: {selectedCryptoForStake.suggestion === 'up' ? '↑' : '↓'} {selectedCryptoForStake.suggestionPercent}%
                  </Typography>
                )}
              </Box>
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
                error={!!(stakeError || stakeFieldError)}
                helperText={
                  (() => {
                    if (stakeError) {
                      const errorAny = stakeError as any
                      const errorMsg = stakeError?.message || errorAny?.info?.error?.message || ''
                      if (errorMsg.includes('nonce') || errorMsg.includes('NONCE') || errorMsg.includes('Nonce')) {
                        return 'Transaction already pending. Please wait for the current transaction to complete before trying again.'
                      }
                      return errorMsg
                    }
                    return stakeFieldError || ''
                  })()
                }
              />
              {isConfirmed && (
                <Typography variant="body2" color="success.main">
                  Stake placed successfully!
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setStakeModalOpen(false)
            setStakeDirection('up')
          }}>
            Cancel
          </Button>
          <Button
            sx={{
              bgcolor: '#7248d6',
              '&:hover': {
                bgcolor: '#5d3ab0'
              }
            }}
            variant="contained"
            onClick={async () => {
              // Clear previous errors when starting a new transaction attempt
              setStakeFieldError(null)

              // Prevent multiple clicks
              if (isPending || isConfirming || creatingPrediction) {
                return
              }

              if (!stakeAmount || parseFloat(stakeAmount) < 0.00001) {
                setStakeFieldError('Please enter a valid stake amount (minimum 0.00001 BNB)')
                return
              }

              if (!selectedCryptoForStake || !predictionStakingAddress) {
                setStakeFieldError('Missing required information')
                return
              }

              try {
                const currentPrice = typeof selectedCryptoForStake.price === 'number' ? selectedCryptoForStake.price : parseFloat(String(selectedCryptoForStake.price || '0'))
                const percentChange = selectedCryptoForStake.suggestionPercent || 0
                const direction = selectedCryptoForStake.suggestion === 'up' ? 'up' : 'down'
                const predictedPrice = currentPrice * (1 + (percentChange / 100) * (direction === 'up' ? 1 : -1))

                if (!selectedCryptoForStake.id || selectedCryptoForStake.id.trim() === '') {
                  throw new Error('Crypto ID is required')
                }

                if (currentPrice <= 0) {
                  throw new Error('Current price must be greater than 0')
                }


                // Use stakeOnCrypto - it automatically creates prediction if needed
                // Pass libraryId if available from the crypto data
                await stakeOnCrypto(
                  selectedCryptoForStake.id,
                  currentPrice.toString(),
                  predictedPrice.toString(),
                  direction,
                  percentChange,
                  stakeAmount,
                  stakeDirection === 'up',
                  selectedCryptoForStake.libraryId || null
                )
                // Note: Success handling is done in useEffect that watches isConfirmed/receipt
                // The stake hook will set the transaction hash, and the useEffect will handle the success case
              } catch (error: any) {
                let errorMsg = error?.message || error?.info?.error?.message || 'Failed to stake'
                if (errorMsg.includes('nonce') || errorMsg.includes('NONCE') || errorMsg.includes('Nonce') || errorMsg.includes('Transaction already')) {
                  errorMsg = 'Transaction already in progress. Please wait for the current transaction to complete before trying again.'
                }
                setStakeFieldError(errorMsg)
              }
            }}
            disabled={isPending || isConfirming || creatingPrediction || isRecordingPrediction || isWaitingRecord || !stakeAmount || parseFloat(stakeAmount) < 0.00001}
            startIcon={(isPending || isConfirming || creatingPrediction || isRecordingPrediction || isWaitingRecord) ? <CircularProgress size={16} /> : undefined}
          >
            {creatingPrediction || isRecordingPrediction || isWaitingRecord ? 'Creating prediction...' : isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Stake BNB'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

