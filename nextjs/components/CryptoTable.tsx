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
import { Close, Refresh } from '@mui/icons-material'
import { TrendingUp, TrendingDown, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import { getCryptoPrices, type CryptoPrice } from '@/lib/coingecko'
import { getCryptoLibrary, type CryptoLibraryItem } from '@/lib/coingecko/library'
import { buyCrypto, sellCrypto } from '@/lib/binance/trading'
import { useCurrency } from '@/contexts/CurrencyContext'

type SortOption = 'price' | 'symbol' | 'name' | 'ai' | ''
type SortDirection = 'asc' | 'desc'

export default function CryptoTable() {
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
  const [selectedReasoning, setSelectedReasoning] = useState<{ crypto: string; reasoning: string } | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cryptoLibrary, setCryptoLibrary] = useState<CryptoLibraryItem[]>([])
  const [selectedCryptos, setSelectedCryptos] = useState<CryptoLibraryItem[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  
  const selectedCryptosRef = useRef(selectedCryptos)
  
  useEffect(() => {
    selectedCryptosRef.current = selectedCryptos
  }, [selectedCryptos])

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
          
          if (cacheAge < CACHE_TTL) {
            setUsdCryptos(data)
            setLoading(false)
          }
        } catch (e) {
          // Invalid cache, ignore
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
      
      if (data.success) {
        console.log('Frontend: Received cryptos count:', data.cryptos.length, 'for tags:', tags)
        console.log('Frontend: Received crypto IDs:', data.cryptos.map(c => c.id))
        setUsdCryptos(data.cryptos)
        const fetchTime = new Date()
        setLastFetchTime(fetchTime)
        localStorage.setItem('crypto_last_fetch', fetchTime.toISOString())
        localStorage.setItem(cacheKey, JSON.stringify({
          data: data.cryptos,
          timestamp: Date.now()
        }))
        console.log('Frontend: Cached data for key:', cacheKey)
      } else {
        setError(data.error || 'Failed to load crypto data')
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

  const handleBuy = async (crypto: CryptoPrice) => {
    const symbol = `${crypto.symbol}USDT`
    setTradingLoading(`buy-${crypto.id}`)
    try {
      const result = await buyCrypto({
        symbol,
        type: 'MARKET',
        quoteOrderQty: 100,
      })
      alert(`Buy order placed successfully!\nOrder ID: ${result.order.orderId}`)
    } catch (err: any) {
      alert(`Failed to place buy order: ${err.message}`)
    } finally {
      setTradingLoading(null)
    }
  }

  const handleSell = async (crypto: CryptoPrice) => {
    const symbol = `${crypto.symbol}USDT`
    setTradingLoading(`sell-${crypto.id}`)
    try {
      const quantity = prompt(`Enter quantity to sell for ${crypto.symbol}:`)
      if (!quantity || parseFloat(quantity) <= 0) {
        setTradingLoading(null)
        return
      }
      
      const result = await sellCrypto({
        symbol,
        type: 'MARKET',
        quantity: parseFloat(quantity),
      })
      alert(`Sell order placed successfully!\nOrder ID: ${result.order.orderId}`)
    } catch (err: any) {
      alert(`Failed to place sell order: ${err.message}`)
    } finally {
      setTradingLoading(null)
    }
  }

  const handleShowMore = (crypto: CryptoPrice) => {
    if (crypto.reasoning) {
      setSelectedReasoning({
        crypto: `${crypto.name} (${crypto.symbol})`,
        reasoning: crypto.reasoning,
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ color: 'white', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Market
      </Typography>
      </Box>

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
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index })
              return (
                <Chip
                  key={key}
                  {...tagProps}
                  label={`${option.symbol}`}
                  size="small"
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
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {crypto.symbol}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {crypto.name}
                    </Typography>
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
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      disabled={tradingLoading === `buy-${crypto.id}`}
                      onClick={() => handleBuy(crypto)}
                    >
                      {tradingLoading === `buy-${crypto.id}` ? <CircularProgress size={16} /> : 'Buy'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      disabled={tradingLoading === `sell-${crypto.id}`}
                      onClick={() => handleSell(crypto)}
                    >
                      {tradingLoading === `sell-${crypto.id}` ? <CircularProgress size={16} /> : 'Sell'}
                    </Button>
                  </Stack>
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
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {selectedReasoning?.reasoning}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

