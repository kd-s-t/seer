'use client'

import { Box, Container } from '@mui/material'
import Header from '@/components/Header'
import Homepage from '@/components/Homepage'
import { useWallet, useMetaMask } from '@/hooks'
import MetaMaskWarning from '@/components/MetaMaskWarning'
import NotificationSnackbar from '@/components/NotificationSnackbar'
import { useState, useEffect } from 'react'
import { SnackbarState } from '@/types'

export default function NewsPage() {
  const { address, isConnected, isConnecting, connectError, handleConnect, handleDisconnect } = useWallet()
  const { showWarning, setShowWarning } = useMetaMask()

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  })

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

        <Homepage />

        <NotificationSnackbar
          snackbar={snackbar}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Container>
    </Box>
  )
}

