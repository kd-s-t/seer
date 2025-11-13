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
} from '@mui/material'
import { Close, Refresh, AccountBalance } from '@mui/icons-material'
import { TrendingUp, TrendingDown, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { getCryptoPrices, type CryptoPrice, type NewsSource } from '@/lib/coingecko'
import { getCryptoLibrary, type CryptoLibraryItem } from '@/lib/coingecko/library'
import { useStaking } from '@/hooks'
import { parseEther } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { PREDICTION_STAKING_ABI } from '@/lib/blockchain/predictionStaking'
import { useContract } from '@/hooks/useContract'
// import { buyCrypto, sellCrypto } from '@/lib/binance/trading'
import { useCurrency } from '@/contexts/CurrencyContext'

type SortOption = 'price' | 'symbol' | 'name' | 'ai' | ''
type SortDirection = 'asc' | 'desc'

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
  const { stake, isPending, isConfirming, isConfirmed, error: stakeError, hash: stakeHash, receipt } = useStaking()
  const { predictionStakingAddress } = useContract()
  const { writeContract: writeRecordPrediction, data: recordHash, isPending: isRecordingPrediction, error: recordError } = useWriteContract()
  const { isLoading: isWaitingRecord, isSuccess: isRecordConfirmed, data: recordReceipt, isError: isRecordError } = useWaitForTransactionReceipt({
    hash: recordHash
  })
  const publicClient = usePublicClient()
  const [localReceipt, setLocalReceipt] = useState<any>(null)
  
  useEffect(() => {
    if (recordError && creatingPrediction) {
      console.error('❌ Record prediction write error:', recordError)
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
      
      console.error('Error details:', {
        message: error?.message,
        shortMessage: error?.shortMessage,
        cause: error?.cause,
        data: error?.data,
        extractedMessage: errorMsg
      })
      
      setStakeFieldError(errorMsg)
      setCreatingPrediction(false)
      setPendingRecordHash(null)
      setPendingStake(null)
    }
  }, [recordError, creatingPrediction])
  
  useEffect(() => {
    if (isRecordError && creatingPrediction) {
      console.error('❌ Record prediction receipt error:', isRecordError)
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
      
      console.error('Receipt error details:', {
        message: error?.message,
        shortMessage: error?.shortMessage,
        cause: error?.cause,
        data: error?.data,
        reason: error?.reason,
        extractedMessage: errorMsg,
        fullError: error
      })
      
      if (recordHash && publicClient) {
        (async () => {
          try {
            const tx = await publicClient.getTransaction({ hash: recordHash })
            console.log('🔍 Transaction details:', {
              to: tx.to,
              from: tx.from,
              value: tx.value.toString(),
              data: tx.input.substring(0, 20) + '...'
            })
            
            try {
              const revertReason = await publicClient.call({
                to: tx.to,
                data: tx.input,
                value: tx.value,
                account: tx.from
              })
              console.log('📋 Call result:', revertReason)
            } catch (callErr: any) {
              console.log('📋 Revert reason from call:', callErr?.message || callErr)
              
              if (callErr?.data) {
                console.log('📋 Revert reason data:', callErr.data)
                try {
                  const { decodeErrorResult } = await import('viem')
                  const decoded = decodeErrorResult({
                    abi: PREDICTION_STAKING_ABI,
                    data: callErr.data as `0x${string}`
                  })
                  console.log('✅ Decoded revert reason:', decoded)
                  if (decoded.errorName && decoded.args) {
                    const newErrorMsg = `${decoded.errorName}: ${decoded.args[0] || JSON.stringify(decoded.args)}`
                    setStakeFieldError(newErrorMsg)
                  }
                } catch (decodeErr) {
                  console.log('Could not decode error:', decodeErr)
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
            console.log('Could not get revert reason:', err)
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
            console.error('❌ Transaction failed with status:', recordReceipt.status)
            console.error('Receipt details:', recordReceipt)
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
          
          console.log('🔍 Processing recordPrediction receipt:', {
            receiptStatus: recordReceipt.status,
            receiptLogsCount: recordReceipt.logs?.length || 0,
            contractAddress,
            receiptTransactionHash: recordReceipt.transactionHash
          })
          
          const logs = recordReceipt.logs.filter((log: any) => 
            log.address?.toLowerCase() === contractAddress
          )
          
          console.log('📋 Filtered logs for contract:', {
            totalLogs: recordReceipt.logs?.length || 0,
            contractLogs: logs.length,
            contractAddress,
            allLogAddresses: recordReceipt.logs?.map((l: any) => l.address?.toLowerCase()) || []
          })
          
          let predictionRecordedLog = null
          
          try {
            const parsedEvents = parseEventLogs({
              abi: PREDICTION_STAKING_ABI,
              logs: recordReceipt.logs
            })
            console.log('📦 Parsed events using parseEventLogs:', parsedEvents)
            
            const predictionEvent = parsedEvents.find((e: any) => e.eventName === 'PredictionRecorded')
            if (predictionEvent) {
              console.log('🎯 Found PredictionRecorded event via parseEventLogs!', predictionEvent)
              predictionRecordedLog = { decoded: predictionEvent }
            }
          } catch (parseErr) {
            console.log('⚠️ parseEventLogs failed, trying manual decode:', parseErr)
          }
          
          if (!predictionRecordedLog) {
            for (const log of logs) {
              try {
                console.log('🔎 Attempting to decode log manually:', {
                  address: log.address?.toLowerCase(),
                  topics: log.topics,
                  data: log.data
                })
                const decoded = decodeEventLog({
                  abi: PREDICTION_STAKING_ABI,
                  data: log.data,
                  topics: log.topics
                })
                console.log('✅ Decoded event:', decoded)
                if (decoded.eventName === 'PredictionRecorded') {
                  predictionRecordedLog = { log, decoded }
                  console.log('🎯 Found PredictionRecorded event!', decoded)
                  break
                }
              } catch (err) {
                console.log('❌ Failed to decode log:', err)
                continue
              }
            }
          }
          
          if (logs.length === 0) {
            console.error('⚠️ No logs found for contract address:', contractAddress)
            console.error('All receipt logs:', recordReceipt.logs)
          }
          
          if (predictionRecordedLog && selectedCryptoForStake) {
            const predictionId = Number(predictionRecordedLog.decoded.args.predictionId)
            setSelectedCryptoForStake({ ...selectedCryptoForStake, predictionId })
            setCreatingPrediction(false)
            setPendingRecordHash(null)
            
            if (pendingStake) {
              try {
                await stake(BigInt(predictionId), pendingStake.amount, pendingStake.direction === 'up')
                setPendingStake(null)
              } catch (error: any) {
                const errorMsg = error?.message || error?.info?.error?.message || 'Failed to stake'
                setStakeFieldError(errorMsg)
                setPendingStake(null)
              }
            }
          } else {
            console.error('No PredictionRecorded event found. Receipt:', recordReceipt, 'Logs:', logs)
            setStakeFieldError('Failed to find PredictionRecorded event. Transaction may have failed.')
            setCreatingPrediction(false)
            setPendingRecordHash(null)
            setPendingStake(null)
          }
        } catch (error: any) {
          console.error('Error processing record prediction:', error)
          setStakeFieldError(error.message || 'Failed to process prediction')
          setCreatingPrediction(false)
          setPendingRecordHash(null)
          setPendingStake(null)
        }
      }
      processRecordPrediction()
    }
  }, [isRecordConfirmed, recordReceipt, pendingRecordHash, recordHash, predictionStakingAddress, selectedCryptoForStake, creatingPrediction, pendingStake, stake])
  
  useEffect(() => {
    if (recordHash && creatingPrediction && !pendingRecordHash) {
      setPendingRecordHash(recordHash)
    }
  }, [recordHash, creatingPrediction, pendingRecordHash])
  
  useEffect(() => {
    if (pendingRecordHash && !isRecordConfirmed && !isWaitingRecord && creatingPrediction) {
      const timeout = setTimeout(() => {
        if (creatingPrediction) {
          setStakeFieldError('Transaction confirmation timed out. Please check the transaction in your wallet.')
          setCreatingPrediction(false)
          setPendingRecordHash(null)
        }
      }, 60000)
      return () => clearTimeout(timeout)
    }
  }, [pendingRecordHash, isRecordConfirmed, isWaitingRecord, creatingPrediction])

  useEffect(() => {
    if (isConfirmed && receipt && !creatingPrediction && selectedCryptoForStake?.predictionId) {
      if (receipt.status === 'success') {
        setStakeFieldError(null)
        setStakeModalOpen(false)
        setStakeAmount('0.01')
        setStakeDirection('up')
        setSelectedCryptoForStake(null)
      } else {
        setStakeFieldError('Transaction reverted. Please check the transaction details.')
      }
    }
  }, [isConfirmed, receipt, creatingPrediction, selectedCryptoForStake])
  
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
    if (isConfirmed || receipt || localReceipt) {
      setStakeModalOpen(false)
      setStakeAmount('0.01')
      setStakeDirection('up')
      setSelectedCryptoForStake(null)
      setStakeFieldError(null)
    }
  }, [isConfirmed, receipt, localReceipt])

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
          const CACHE_TTL = 21600000
          
          if (cacheAge < CACHE_TTL && data && data.length > 0) {
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
    const cacheKey = tags && tags.length > 0 
      ? `crypto_prices_cache_${tags.sort().join(',')}` 
      : 'crypto_prices_cache'
    
    if (forceRefresh) {
      // Clear cache for this specific key on force refresh
      localStorage.removeItem(cacheKey)
      console.log('Frontend: Cleared cache for key:', cacheKey)
    }
    
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(cacheKey)
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData)
          const cacheAge = Date.now() - timestamp
          const CACHE_TTL = 21600000
          
          if (cacheAge < CACHE_TTL) {
            console.log('Frontend: Using cached data for key:', cacheKey, 'count:', data.length)
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
    
    console.log('Frontend: Fetching fresh data for tags:', tags)
    
    if (showLoading) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)
    try {
      const data = await getCryptoPrices(undefined, tags, 'usd', forceRefresh)
      
      if (data.success && data.cryptos && data.cryptos.length > 0) {
        console.log('Frontend: Received cryptos count:', data.cryptos.length, 'for tags:', tags)
        console.log('Frontend: Received crypto IDs:', data.cryptos.map(c => c.id))
        console.log('Frontend: Predictions with IDs:', data.cryptos.filter(c => c.predictionId).map(c => ({ id: c.id, predictionId: c.predictionId })))
        setUsdCryptos(data.cryptos)
        const fetchTime = new Date()
        setLastFetchTime(fetchTime)
        localStorage.setItem('crypto_last_fetch', fetchTime.toISOString())
        localStorage.setItem(cacheKey, JSON.stringify({
          data: data.cryptos,
          timestamp: Date.now()
        }))
        console.log('Frontend: Cached data for key:', cacheKey)
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
    const tags = selectedCryptos.length > 0 ? selectedCryptos.map(c => c.id) : undefined
    fetchCryptoData(false, true, tags)
  }

  const formatLastFetchTime = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    
    if (seconds < 10) return 'Just now'
    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    return date.toLocaleTimeString()
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

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(2)}%`
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
    let sorted = [...cryptos]

    if (sortBy) {
      sorted.sort((a, b) => {
        let comparison = 0
        switch (sortBy) {
          case 'price':
            comparison = b.price - a.price
            break
          case 'symbol':
            comparison = a.symbol.localeCompare(b.symbol)
            break
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'ai':
            const aSuggestion = a.suggestionPercent ?? 0
            const bSuggestion = b.suggestionPercent ?? 0
            comparison = Math.abs(bSuggestion) - Math.abs(aSuggestion)
            break
          default:
            return 0
        }
        return sortDirection === 'asc' ? -comparison : comparison
      })
    }

    return sorted
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
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Autocomplete
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
              label="Search or select cryptocurrencies"
              variant="outlined"
              InputLabelProps={{
                ...params.InputLabelProps,
                shrink: true,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.MuiInputLabel-shrink': {
                    color: 'rgba(255, 255, 255, 0.9)',
                    transform: 'translate(14px, -9px) scale(0.75)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
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
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        color: 'white',
                      },
                    },
                  }}
                />
              )
            })
          }
          sx={{
            maxWidth: 600,
            '& .MuiAutocomplete-inputRoot': {
              color: 'white',
            },
            '& .MuiAutocomplete-popupIndicator': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
            '& .MuiAutocomplete-clearIndicator': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
            '& .MuiAutocomplete-listbox': {
              bgcolor: 'rgba(102, 126, 234, 0.95)',
              backdropFilter: 'blur(10px)',
              '& .MuiAutocomplete-option': {
                color: 'white',
                '&[aria-selected="true"]': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              },
            },
          }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.5)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.8)',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Refresh
          </Button>
          {lastFetchTime && (
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
              Last updated: {formatLastFetchTime(lastFetchTime)}
            </Typography>
          )}
        </Box>
      </Box>
      
      <TableContainer 
        component={Paper} 
        sx={{ 
          bgcolor: 'background.paper',
          overflowX: 'auto'
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
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
                <strong>Story</strong>
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
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    {loading ? 'Loading...' : 'No cryptos found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedCryptos.map((crypto) => (
              <TableRow key={crypto.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                      <Typography variant="body1" fontWeight="bold">
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
                      {formatPercent(crypto.change24h)}
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
                            color="text.secondary" 
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
                            Show more
                          </Button>
                        </Box>
                      )
                    }
                    return (
                      <Typography variant="body2" color="text.secondary">
                        No story available
                      </Typography>
                    )
                  })()}
                </TableCell>
                <TableCell align="right">
                  {(() => {
                    const suggestionPercent = crypto.suggestionPercent
                    if (crypto.suggestion && typeof suggestionPercent === 'number') {
                      return (
                        <Chip
                          label={`${crypto.suggestion === 'up' ? '↑' : '↓'} ${formatPercent(suggestionPercent)}`}
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
                </TableCell>
                <TableCell align="right">
                    <Button
                      variant="contained"
                    color="primary"
                      size="small"
                    onClick={() => {
                      setSelectedCryptoForStake(crypto)
                      setStakeModalOpen(true)
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

      <Dialog open={stakeModalOpen} onClose={() => {
        setStakeModalOpen(false)
        setStakeDirection('up')
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Stake on Prediction</Typography>
            <IconButton onClick={() => {
              setStakeModalOpen(false)
              setStakeDirection('up')
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
                inputProps={{ min: '0.001', step: '0.001' }}
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
            variant="contained"
            onClick={async () => {
              // Clear previous errors when starting a new transaction attempt
              setStakeFieldError(null)
              
              // Prevent multiple clicks
              if (isPending || isConfirming || creatingPrediction) {
                return
              }
              
              if (!stakeAmount || parseFloat(stakeAmount) < 0.001) {
                setStakeFieldError('Please enter a valid stake amount (minimum 0.001 BNB)')
                return
              }

              let predictionId = selectedCryptoForStake?.predictionId

              if (!predictionId && selectedCryptoForStake && predictionStakingAddress) {
                setCreatingPrediction(true)
                setPendingStake({ amount: stakeAmount, direction: stakeDirection })
                try {
                  const currentPrice = typeof selectedCryptoForStake.price === 'number' ? selectedCryptoForStake.price : parseFloat(String(selectedCryptoForStake.price || '0'))
                  const percentChange = selectedCryptoForStake.suggestionPercent || 0
                  const direction = selectedCryptoForStake.suggestion === 'up' ? 'up' : 'down'
                  const predictedPrice = currentPrice * (1 + (percentChange / 100) * (direction === 'up' ? 1 : -1))
                  
                  const currentPriceWei = parseEther(String(currentPrice))
                  const predictedPriceWei = parseEther(String(predictedPrice))
                  const percentChangeWei = BigInt(Math.floor(Math.abs(percentChange) * 100))
                  
                  console.log('📤 Calling recordPrediction with:', {
                    cryptoId: selectedCryptoForStake.id,
                    currentPrice: currentPrice.toString(),
                    currentPriceWei: currentPriceWei.toString(),
                    predictedPrice: predictedPrice.toString(),
                    predictedPriceWei: predictedPriceWei.toString(),
                    direction,
                    percentChange: percentChange.toString(),
                    percentChangeWei: percentChangeWei.toString(),
                    contractAddress: predictionStakingAddress
                  })
                  
                  if (!selectedCryptoForStake.id || selectedCryptoForStake.id.trim() === '') {
                    throw new Error('Crypto ID is required')
                  }
                  
                  if (currentPrice <= 0) {
                    throw new Error('Current price must be greater than 0')
                  }
                  
                  writeRecordPrediction({
                    address: predictionStakingAddress as `0x${string}`,
                    abi: PREDICTION_STAKING_ABI,
                    functionName: 'recordPrediction',
                    args: [
                      selectedCryptoForStake.id,
                      currentPriceWei,
                      predictedPriceWei,
                      direction,
                      percentChangeWei
                    ]
                  })
                } catch (error: any) {
                  let errorMsg = 'Failed to create prediction'
                  if (error.message) {
                    errorMsg = error.message
                  } else if (error.error) {
                    errorMsg = error.error
                  }
                  setStakeFieldError(errorMsg)
                  setCreatingPrediction(false)
                  setPendingStake(null)
                }
                return
              }

              if (predictionId) {
                try {
                  await stake(BigInt(predictionId), stakeAmount, stakeDirection === 'up')
                } catch (error: any) {
                  let errorMsg = error?.message || error?.info?.error?.message || 'Failed to stake'
                  if (errorMsg.includes('nonce') || errorMsg.includes('NONCE') || errorMsg.includes('Nonce') || errorMsg.includes('Transaction already')) {
                    errorMsg = 'Transaction already in progress. Please wait for the current transaction to complete before trying again.'
                  }
                  setStakeFieldError(errorMsg)
                }
              }
            }}
            disabled={isPending || isConfirming || creatingPrediction || isRecordingPrediction || isWaitingRecord || !stakeAmount || parseFloat(stakeAmount) < 0.001}
            startIcon={(isPending || isConfirming || creatingPrediction || isRecordingPrediction || isWaitingRecord) ? <CircularProgress size={16} /> : undefined}
          >
            {creatingPrediction || isRecordingPrediction || isWaitingRecord ? 'Creating prediction...' : isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Stake BNB'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

