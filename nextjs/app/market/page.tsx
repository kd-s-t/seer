'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Container, Typography } from '@mui/material'
import { useMetaMask, useWallet, useNetwork } from '@/hooks'
import { SnackbarState } from '@/types'
import Header from '@/components/Header'
import MetaMaskWarning from '@/components/MetaMaskWarning'
import NotificationSnackbar from '@/components/NotificationSnackbar'
import CryptoTable from '@/components/CryptoTable'

export default function MarketPage() {
  const router = useRouter()
  const { address, isConnected, isConnecting, connectError, handleConnect, handleDisconnect } = useWallet()
  const { showWarning, setShowWarning } = useMetaMask()
  const { isTestnet, switchToTestnet } = useNetwork()
  const [mounted, setMounted] = useState(false)

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const showMessage = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const onConnect = () => {
    if (typeof window !== 'undefined' && !window.ethereum) {
      showMessage('MetaMask not found. Please install MetaMask extension.', 'error')
      return
    }
    handleConnect()
  }

  useEffect(() => {
    if (isConnected && !isTestnet) {
      switchToTestnet()
    }
  }, [isConnected, isTestnet, switchToTestnet])

  useEffect(() => {
    if (mounted && !isConnected && !isConnecting) {
      router.push('/')
    }
  }, [mounted, isConnected, isConnecting, router])

  useEffect(() => {
    if (connectError) {
      const errorMessage = connectError.message || 'Failed to connect wallet'
      if (errorMessage.includes('rejected') || errorMessage.includes('User rejected')) {
        showMessage('Connection rejected by user', 'error')
      } else if (errorMessage.includes('not found') || errorMessage.includes('MetaMask')) {
        showMessage('MetaMask not found. Please install MetaMask extension.', 'error')
      } else {
        showMessage(`Connection error: ${errorMessage}`, 'error')
      }
    }
  }, [connectError])

  if (!mounted) {
    return (
      <Box sx={{ minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            Loading...
          </Box>
        </Container>
      </Box>
    )
  }

  if (!isConnected) {
    return null
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <MetaMaskWarning
          show={showWarning && !isConnected}
          onClose={() => setShowWarning(false)}
        />
        
        <Header
          address={address}
          isConnected={isConnected}
          isConnecting={isConnecting}
          onConnect={onConnect}
          onDisconnect={handleDisconnect}
        />

        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mt: 4, mb: 2 }}>
          Market
        </Typography>

        <CryptoTable />

        <NotificationSnackbar
          snackbar={snackbar}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Container>
    </Box>
  )
}

