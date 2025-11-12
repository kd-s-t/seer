'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { AppBar, Toolbar, Typography, Button, Chip, Stack, Alert, Box, ToggleButtonGroup, ToggleButton } from '@mui/material'
import { AccountBalanceWallet, SwapHoriz, Logout, TrendingUp, Article, AccountBalance } from '@mui/icons-material'
import { useNetwork } from '@/hooks/useNetwork'
import { useCurrency } from '@/contexts/CurrencyContext'

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
  const { networkName, isTestnet, isSwitching, switchToTestnet } = useNetwork()
  const { currency, setCurrency } = useCurrency()
  const [mounted, setMounted] = useState(false)
  
  const isNewsActive = pathname === '/news'
  const isMarketActive = pathname === '/market'
  const isStakingActive = pathname === '/staking'

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogoClick = () => {
    router.push('/')
  }

  const handleMarketClick = () => {
    router.push('/market')
  }

  const handleNewsClick = () => {
    router.push('/news')
  }

  const handleStakingClick = () => {
    router.push('/staking')
  }

  const displayAddress = mounted && address 
    ? `${address.substring(0, 6)}...${address.substring(38)}` 
    : 'Not connected'

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
            {mounted && isConnected && (
              <Box 
                sx={{ 
                  display: { xs: 'none', sm: 'flex' },
                  flexDirection: 'column',
                  alignItems: 'flex-end'
                }}
              >
                <Typography variant="caption" sx={{ lineHeight: 1.2, fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                  {displayAddress}
                </Typography>
                <Chip
                  label={networkName}
                  color={isTestnet ? 'success' : 'default'}
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem', mt: 0.3, bgcolor: 'rgba(255, 255, 255, 0.2)' }}
                />
              </Box>
            )}
            {mounted && isConnected ? (
              <Button
                color="inherit"
                variant="outlined"
                size="small"
                startIcon={<Logout />}
                onClick={onDisconnect}
                sx={{ 
                  minWidth: { xs: 80, sm: 100 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Disconnect
              </Button>
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

