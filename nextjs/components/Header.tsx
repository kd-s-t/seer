'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { AppBar, Toolbar, Typography, Button, Chip, Stack, Alert, Box, ToggleButtonGroup, ToggleButton, Menu, MenuItem, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material'
import { AccountBalanceWallet, SwapHoriz, Logout, TrendingUp, Article, AccountBalance, ContentCopy, QrCode, CheckCircle, Close, Assessment, SportsEsports, Newspaper } from '@mui/icons-material'
import { useBalance, usePublicClient } from 'wagmi'
import { useNetwork } from '@/hooks/useNetwork'
import { localhost } from '@/lib/wagmi'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { fetchBnbPrice, shouldFetchPrice } from '@/lib/store/slices/priceSlice'
import { store } from '@/lib/store'
import { ADMIN_ADDRESSES } from '@/modules/analytics/const'

interface HeaderProps {
  address: string | undefined
  isConnected: boolean
  isConnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export default function Header({
  address,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { networkName, isTestnet, isLocalhost, isSwitching, switchToTestnet, chainId } = useNetwork()
  const { currency, setCurrency, convertPrice, formatPrice, getCurrencySymbol } = useCurrency()
  const { setLoading } = useNavigation()
  const [mounted, setMounted] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [qrOpen, setQrOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { bnbPrice, isLoading: priceLoading } = useAppSelector((state) => state.price)
  const dispatch = useAppDispatch()
  const [localhostBalance, setLocalhostBalance] = useState<string | null>(null)
  const publicClient = usePublicClient({
    chainId: isLocalhost ? localhost.id : undefined,
  })

  const { data: balance, refetch: refetchBalance } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: chainId === localhost.id ? localhost.id : chainId,
    query: {
      enabled: !!address && !!chainId && chainId !== localhost.id,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      staleTime: 0,
      gcTime: 0,
      retry: false,
    },
  })

  useEffect(() => {
    let hasFailed = false

    const fetchLocalhostBalance = async () => {
      if (hasFailed || !address || !publicClient || !isLocalhost) {
        if (!isLocalhost) {
          setLocalhostBalance(null)
        }
        return
      }

      try {
        const bal = await publicClient.getBalance({
          address: address as `0x${string}`,
        })
        const formatted = (Number(bal) / 1e18).toFixed(18)
        setLocalhostBalance(formatted)
        hasFailed = false
      } catch (error: any) {
        const isConnectionError =
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('ECONNREFUSED') ||
          error?.message?.includes('connection refused') ||
          error?.message?.includes('signal timed out') ||
          error?.code === 'ECONNREFUSED' ||
          error?.name === 'AbortError' ||
          error?.name === 'TimeoutError'

        if (isConnectionError) {
          hasFailed = true
          setLocalhostBalance(null)
          return
        }
      }
    }

    if (isLocalhost) {
      fetchLocalhostBalance()
      const interval = setInterval(() => {
        if (!hasFailed) {
          fetchLocalhostBalance()
        }
      }, 5000)
      return () => clearInterval(interval)
    } else {
      setLocalhostBalance(null)
    }
  }, [address, publicClient, isLocalhost])

  const displayBalance = useMemo(() => {
    if (localhostBalance && address) {
      return {
        formatted: localhostBalance,
        value: BigInt(Math.floor(parseFloat(localhostBalance) * 1e18)),
        decimals: 18,
        symbol: 'ETH',
      }
    }
    return balance
  }, [localhostBalance, balance, address])

  const formattedBalance = useMemo(() => {
    if (displayBalance && bnbPrice) {
      const usdValue = parseFloat(displayBalance.formatted) * bnbPrice
      return formatPrice(usdValue)
    }
    return null
  }, [displayBalance, bnbPrice, currency, formatPrice])

  const showFormattedBalance = formattedBalance !== null && displayBalance !== null

  const isNewsActive = pathname === '/news'
  const isMarketActive = pathname === '/market'
  const isStakingActive = pathname === '/staking'
  const isProfileActive = pathname === '/profile'
  const isAnalyticsActive = pathname === '/analytics'

  const isAdmin = address ? ADMIN_ADDRESSES.some(addr => addr.toLowerCase() === address.toLowerCase()) : false

  const open = Boolean(anchorEl)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isConnected) return

    const priceState = store.getState().price
    if (shouldFetchPrice(priceState)) {
      dispatch(fetchBnbPrice())
    }

    const interval = setInterval(() => {
      const currentPriceState = store.getState().price
      if (shouldFetchPrice(currentPriceState)) {
        dispatch(fetchBnbPrice())
      }
    }, 300000)

    return () => clearInterval(interval)
  }, [isConnected, dispatch])

  const handleLogoClick = () => {
    setLoading(true)
    router.push('/')
  }

  const handleMarketClick = () => {
    setLoading(true)
    router.push('/market')
  }

  const handleNewsClick = () => {
    setLoading(true)
    router.push('/news')
  }

  const handleStakingClick = () => {
    setLoading(true)
    router.push('/staking')
  }

  const handleAnalyticsClick = () => {
    setLoading(true)
    router.push('/analytics')
  }

  const handleProfileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleNavigateToProfile = () => {
    handleProfileClose()
    setLoading(true)
    router.push('/profile')
  }

  const handleProfileClose = () => {
    setAnchorEl(null)
  }

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      handleProfileClose()
    }
  }

  const handleShowQR = () => {
    setQrOpen(true)
    handleProfileClose()
  }

  return (
    <>
      <AppBar
        position="static"
        sx={{
          background: '#fff',
          borderRadius: '1.25rem',
          mb: 3
        }}
      >
        <Toolbar>
          <Box
            component="img"
            src="/serrylogo.png"
            alt="Seery"
            onClick={handleLogoClick}
            sx={{
              cursor: 'pointer',
              userSelect: 'none',
              mr: 3,
              height: 38,
              width: 'auto',
              objectFit: 'contain',
              backgroundColor: 'transparent',
              filter: 'brightness(1.1)',
              '&:hover': {
                opacity: 0.8
              }
            }}
          />

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mr: 2 }}
          >
            <Button
              variant={isNewsActive ? "contained" : "text"}
              size="small"
              startIcon={<Newspaper />}
              onClick={handleNewsClick}
              sx={{
                minWidth: { xs: 80, sm: 100 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                borderRadius: '1rem',
                ...(isNewsActive ? {
                  bgcolor: '#7248d6',
                  color: 'white',
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  },
                  '&:hover': {
                    bgcolor: '#5d3ab0'
                  }
                } : {
                  color: 'black',
                  '& .MuiSvgIcon-root': {
                    color: 'black'
                  },
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }
                })
              }}
            >
              News
            </Button>
            {mounted && isConnected && (
              <>
                <Button
                  variant={isMarketActive ? "contained" : "text"}
                  size="small"
                  startIcon={<TrendingUp />}
                  onClick={handleMarketClick}
                  sx={{
                    minWidth: { xs: 80, sm: 100 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    borderRadius: '1rem',
                    ...(isMarketActive ? {
                      bgcolor: '#7248d6',
                      color: 'white',
                      '& .MuiSvgIcon-root': {
                        color: 'white'
                      },
                      '&:hover': {
                        bgcolor: '#5d3ab0'
                      }
                    } : {
                      color: 'black',
                      '& .MuiSvgIcon-root': {
                        color: 'black'
                      },
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                      }
                    })
                  }}
                >
                  Market
                </Button>
                <Button
                  variant={isStakingActive ? "contained" : "text"}
                  size="small"
                  startIcon={<SportsEsports />}
                  onClick={handleStakingClick}
                  sx={{
                    minWidth: { xs: 80, sm: 100 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    borderRadius: '1rem',
                    ...(isStakingActive ? {
                      bgcolor: '#7248d6',
                      color: 'white',
                      '& .MuiSvgIcon-root': {
                        color: 'white'
                      },
                      '&:hover': {
                        bgcolor: '#5d3ab0'
                      }
                    } : {
                      color: 'black',
                      '& .MuiSvgIcon-root': {
                        color: 'black'
                      },
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                      }
                    })
                  }}
                >
                  Staking
                </Button>
                {isAdmin && (
                  <Button
                    variant={isAnalyticsActive ? "contained" : "text"}
                    size="small"
                    startIcon={<Assessment />}
                    onClick={handleAnalyticsClick}
                    sx={{
                      minWidth: { xs: 80, sm: 100 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      borderRadius: '1rem',
                      ...(isAnalyticsActive ? {
                        bgcolor: '#7248d6',
                        color: 'white',
                        '& .MuiSvgIcon-root': {
                          color: 'white'
                        },
                        '&:hover': {
                          bgcolor: '#5d3ab0'
                        }
                      } : {
                        color: 'black',
                        '& .MuiSvgIcon-root': {
                          color: 'black'
                        },
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.04)'
                        }
                      })
                    }}
                  >
                    Analytics
                  </Button>
                )}
              </>
            )}
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              mr: { xs: 0, sm: 2 },
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              justifyContent: { xs: 'flex-end', sm: 'flex-start' }
            }}
          >
            {mounted && isConnected && (
              <ToggleButtonGroup
                value={currency}
                exclusive
                onChange={(_, newCurrency) => {
                  if (newCurrency !== null) {
                    setCurrency(newCurrency)
                  }
                }}
                size="small"
                sx={{
                  height: 28,
                  '& .MuiToggleButton-root': {
                    color: 'black',
                    borderColor: '#e0e0e0',
                    bgcolor: 'white',
                    fontSize: '0.7rem',
                    padding: '4px 12px',
                    minWidth: 'auto',
                    '&.Mui-selected': {
                      color: 'white',
                      bgcolor: '#7248d6',
                      '&:hover': {
                        bgcolor: '#5d3ab0',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  },
                }}
              >
                <ToggleButton value="usd">USD</ToggleButton>
                <ToggleButton value="php">PHP</ToggleButton>
              </ToggleButtonGroup>
            )}
            {mounted && isConnected ? (
              <>
                <IconButton
                  onClick={handleProfileMenuClick}
                  sx={{
                    padding: '4px',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <Avatar
                    src="/10790816.png"
                    alt="Profile"
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid #7248d6'
                    }}
                  />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleProfileClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem
                    onClick={handleNavigateToProfile}
                    sx={{
                      justifyContent: 'flex-start',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    Profile
                  </MenuItem>
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      minHeight: 48,
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#000000' }}>
                        Wallet Address
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={handleCopyAddress}
                          sx={{
                            color: '#000000',
                            p: 0.5,
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                          }}
                        >
                          {copied ? <CheckCircle sx={{ fontSize: 18 }} /> : <ContentCopy sx={{ fontSize: 18 }} />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={handleShowQR}
                          sx={{
                            color: '#000000',
                            p: 0.5,
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                          }}
                        >
                          <QrCode sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ wordBreak: 'break-all', color: '#000000' }}>
                      {address}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      minHeight: 48,
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#000000' }}>
                        Balance
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#000000', display: 'flex', alignItems: 'center', gap: 1 }}>
                        {displayBalance ? (
                          <>
                            <span>{parseFloat(displayBalance.formatted).toFixed(4)} {displayBalance.symbol || 'BNB'}</span>
                            {showFormattedBalance && (
                              <span>({formattedBalance})</span>
                            )}
                            {!showFormattedBalance && priceLoading && (
                              <span style={{ opacity: 0.5 }}>(loading...)</span>
                            )}
                          </>
                        ) : (
                          <span>0.0000 BNB</span>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                  <MenuItem
                    onClick={() => { handleProfileClose(); onDisconnect(); }}
                    sx={{
                      justifyContent: 'center',
                      color: '#d32f2f',
                      '&:hover': {
                        bgcolor: 'rgba(211, 47, 47, 0.08)'
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#d32f2f'
                      }
                    }}
                  >
                    <Logout sx={{ mr: 1, fontSize: 18 }} />
                    Disconnect
                  </MenuItem>
                </Menu>
                <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs" fullWidth>
                  <DialogTitle>
                    Wallet Address QR Code
                    <IconButton
                      onClick={() => setQrOpen(false)}
                      sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                      <Close />
                    </IconButton>
                  </DialogTitle>
                  <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                      <Box
                        component="img"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`}
                        alt="QR Code"
                        sx={{ width: 200, height: 200, mb: 2 }}
                      />
                      <Typography variant="body2" sx={{ wordBreak: 'break-all', textAlign: 'center', color: 'text.primary' }}>
                        {address}
                      </Typography>
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setQrOpen(false)}>Close</Button>
                    <Button onClick={handleCopyAddress} startIcon={<ContentCopy />}>
                      Copy Address
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={
                  <Box
                    component="span"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                    }}
                  >
                    <Image
                      src="/metamask.png"
                      alt="MetaMask"
                      width={20}
                      height={20}
                      style={{ objectFit: 'contain' }}
                    />
                  </Box>
                }
                onClick={onConnect}
                disabled={mounted && isConnecting}
                sx={{
                  minWidth: { xs: 80, sm: 100 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  bgcolor: 'white',
                  color: '#7248d6',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  },
                  '&:disabled': {
                    bgcolor: 'rgba(255, 255, 255, 0.5)',
                    color: 'rgba(102, 126, 234, 0.6)',
                  },
                }}
              >
                {mounted && isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {mounted && isConnected && !isTestnet && !isLocalhost && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={switchToTestnet}
              disabled={isSwitching}
              startIcon={<SwapHoriz />}
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                minWidth: { xs: 'auto', sm: 120 }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {isSwitching ? 'Switching...' : 'Switch to Testnet'}
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                {isSwitching ? '...' : 'Switch'}
              </Box>
            </Button>
          }
        >
          Wrong Network! Please switch to BNB Testnet.
        </Alert>
      )}
    </>
  )
}

