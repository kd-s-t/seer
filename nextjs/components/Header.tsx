'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { AppBar, Toolbar, Typography, Button, Chip, Stack, Alert, Box, ToggleButtonGroup, ToggleButton, Menu, MenuItem, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material'
import { AccountBalanceWallet, SwapHoriz, Logout, TrendingUp, Article, AccountBalance, ContentCopy, QrCode, CheckCircle, Close } from '@mui/icons-material'
import { useBalance } from 'wagmi'
import { useNetwork } from '@/hooks/useNetwork'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { getCryptoPrices } from '@/lib/coingecko/prices'

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
  const { networkName, isTestnet, isSwitching, switchToTestnet, chainId } = useNetwork()
  const { currency, setCurrency, convertPrice, formatPrice, getCurrencySymbol } = useCurrency()
  const { setLoading } = useNavigation()
  const [mounted, setMounted] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [qrOpen, setQrOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [bnbPrice, setBnbPrice] = useState<number | null>(null)
  
  const { data: balance } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: chainId,
  })
  
  const formattedBalance = useMemo(() => {
    if (balance && bnbPrice) {
      const usdValue = parseFloat(balance.formatted) * bnbPrice
      return formatPrice(usdValue)
    }
    return null
  }, [balance, bnbPrice, currency, formatPrice])
  
  const isNewsActive = pathname === '/news'
  const isMarketActive = pathname === '/market'
  const isStakingActive = pathname === '/staking'
  
  const open = Boolean(anchorEl)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchBnbPrice = async () => {
      try {
        const response = await getCryptoPrices(['binancecoin'], undefined, 'usd')
        if (response.success && response.cryptos && response.cryptos.length > 0) {
          const bnbCrypto = response.cryptos.find((c: any) => c.id === 'binancecoin' || c.symbol === 'BNB')
          if (bnbCrypto) {
            setBnbPrice(bnbCrypto.price)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch BNB price')
      }
    }
    
    if (isConnected) {
      fetchBnbPrice()
      const interval = setInterval(fetchBnbPrice, 60000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

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

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          mb: 3
        }}
      >
        <Toolbar>
          <Box
            component="img"
            src="/seerylogov2.png"
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
              mixBlendMode: 'screen',
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
              color="inherit"
              variant={isNewsActive ? "contained" : "text"}
              size="small"
              startIcon={<Article />}
              onClick={handleNewsClick}
              sx={{ 
                minWidth: { xs: 80, sm: 100 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                ...(isNewsActive ? {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)'
                  }
                } : {
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                })
              }}
            >
              News
            </Button>
            {mounted && isConnected && (
              <>
              <Button
                color="inherit"
                variant={isMarketActive ? "contained" : "text"}
                size="small"
                startIcon={<TrendingUp />}
                onClick={handleMarketClick}
                sx={{ 
                  minWidth: { xs: 80, sm: 100 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  ...(isMarketActive ? {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)'
                    }
                  } : {
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  })
                }}
              >
                Market
              </Button>
                <Button
                  color="inherit"
                  variant={isStakingActive ? "contained" : "text"}
                  size="small"
                  startIcon={<AccountBalance />}
                  onClick={handleStakingClick}
                  sx={{ 
                    minWidth: { xs: 80, sm: 100 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    ...(isStakingActive ? {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)'
                      }
                    } : {
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      }
                    })
                  }}
                >
                  Staking
                </Button>
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
                    color: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    fontSize: '0.7rem',
                    padding: '4px 12px',
                    minWidth: 'auto',
                    '&.Mui-selected': {
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
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
                  onClick={handleProfileClick}
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
                      bgcolor: 'rgba(255, 255, 255, 0.2)'
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
                        {formattedBalance && balance ? (
                          <>
                            <span>{parseFloat(balance.formatted).toFixed(4)} BNB</span>
                            <span>({formattedBalance})</span>
                          </>
                        ) : (
                          <span>{balance ? `${parseFloat(balance.formatted).toFixed(4)} BNB` : '0.0000 BNB'}</span>
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
                  color: '#667eea',
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
      
      {mounted && isConnected && !isTestnet && (
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

