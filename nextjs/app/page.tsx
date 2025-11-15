'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Container, Typography } from '@mui/material'
import { useContract, useMetaMask, useWallet, useNetwork } from '@/hooks'
import { SnackbarState } from '@/types'
import Header from '@/components/Header'
import MetaMaskWarning from '@/components/MetaMaskWarning'
import NotificationSnackbar from '@/components/NotificationSnackbar'
import Homepage from '@/components/Homepage'

export default function Home() {
  const router = useRouter()
  const wasConnectedRef = useRef(false)
  
  // Custom hooks
  const { address, isConnected, isConnecting, connectError, handleConnect, handleDisconnect, ensureTestnet } = useWallet()
  const { predictionStakingAddress, loading: contractLoading } = useContract()
  const { showWarning, setShowWarning } = useMetaMask()
  const { isTestnet, switchToTestnet } = useNetwork()

  // Local state
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    console.log('Page load: Home')
  }, [])

  // Show message helper
  const showMessage = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  // Handle wallet connection
  const onConnect = () => {
    if (typeof window !== 'undefined' && !window.ethereum) {
      showMessage('MetaMask not found. Please install MetaMask extension.', 'error')
      return
    }
    handleConnect()
  }

  // Redirect to market when wallet connects
  useEffect(() => {
    if (isConnected && !wasConnectedRef.current) {
      wasConnectedRef.current = true
      router.push('/market')
    } else if (!isConnected) {
      wasConnectedRef.current = false
    }
  }, [isConnected, router])

  // Allow localhost or testnet - don't auto-switch

  // Handle connection errors
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

        {!contractLoading && !predictionStakingAddress && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.light', color: 'warning.contrastText', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Contract Address Not Configured
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Prediction staking contract address is not configured.
            </Typography>
            <Typography variant="body2" component="pre" sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: 1, fontSize: '0.85rem', overflow: 'auto' }}>
{`1. Set NEXT_PUBLIC_CONTRACT_ADDRESS in nextjs/.env.local:
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x... (your deployed contract address)

2. Restart the Next.js dev server:
   npm run dev

3. Refresh this page`}
            </Typography>
          </Box>
        )}

        <Homepage />

        <NotificationSnackbar
          snackbar={snackbar}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Container>
    </Box>
  )
}
