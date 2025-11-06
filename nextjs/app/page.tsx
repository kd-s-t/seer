'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Grid,
  Snackbar,
  Alert,
  Stack,
} from '@mui/material'
import { AccountBalanceWallet, AutoAwesome } from '@mui/icons-material'
import MarketCard from '@/components/MarketCard'
import { CONTRACT_ABI } from '@/lib/contract'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const [markets, setMarkets] = useState<any[]>([])
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [marketForm, setMarketForm] = useState({
    question: '',
    outcomes: '',
    duration: 72
  })

  // Get contract address
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/api/config`)
        const config = await response.json()
        if (config.contractAddress) {
          setContractAddress(config.contractAddress)
        }
      } catch (error) {
        console.error('Error fetching config:', error)
      }
    }
    fetchConfig()
  }, [])

  // Show message
  const showMessage = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  // Load markets
  const loadMarkets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/markets`)
      const data = await response.json()
      
      if (data.success) {
        setMarkets(data.markets)
      }
    } catch (error: any) {
      showMessage('Error loading markets: ' + error.message, 'error')
    }
  }

  // Connect wallet handler
  const handleConnect = () => {
    const metaMaskConnector = connectors.find(c => c.id === 'metaMask')
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector })
    } else {
      showMessage('MetaMask not found. Please install MetaMask.', 'error')
    }
  }

  // Show messages for transaction states
  useEffect(() => {
    if (isWriting) {
      showMessage('Confirm transaction in MetaMask...', 'success')
    }
  }, [isWriting])

  useEffect(() => {
    if (hash) {
      showMessage(`Transaction sent! Hash: ${hash}`, 'success')
    }
  }, [hash])

  useEffect(() => {
    if (isConfirming) {
      showMessage('Waiting for confirmation...', 'success')
    }
  }, [isConfirming])

  useEffect(() => {
    if (isConfirmed) {
      showMessage('Transaction confirmed successfully!', 'success')
      loadMarkets()
      setMarketForm({ question: '', outcomes: '', duration: 72 })
    }
  }, [isConfirmed])

  // Create market
  const createMarket = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      showMessage('Please connect your wallet first', 'error')
      return
    }

    if (!contractAddress) {
      showMessage('Contract not deployed. Please deploy contract first.', 'error')
      return
    }

    const outcomes = marketForm.outcomes.split(',').map(s => s.trim())
    if (outcomes.length < 2) {
      showMessage('At least 2 outcomes are required', 'error')
      return
    }

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'createMarket',
        args: [marketForm.question, outcomes, BigInt(marketForm.duration)],
      })
    } catch (error: any) {
      if (error.message?.includes('User rejected')) {
        showMessage('Transaction rejected by user', 'error')
      } else {
        showMessage('Error: ' + (error.message || 'Unknown error'), 'error')
      }
    }
  }

  // Place bet
  const placeBet = async (marketId: number, outcome: number, amount: number) => {
    if (!isConnected) {
      showMessage('Please connect your wallet first', 'error')
      return
    }

    if (!amount || amount < 0.001) {
      showMessage('Minimum bet is 0.001', 'error')
      return
    }

    if (!contractAddress) {
      showMessage('Contract not deployed. Please deploy contract first.', 'error')
      return
    }

    try {
      const amountWei = parseEther(amount.toString())
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'placeBet',
        args: [BigInt(marketId), BigInt(outcome)],
        value: amountWei,
      })
    } catch (error: any) {
      if (error.message?.includes('User rejected')) {
        showMessage('Transaction rejected by user', 'error')
      } else {
        showMessage('Error: ' + (error.message || 'Unknown error'), 'error')
      }
    }
  }

  // AI Generate market
  const generateAIMarket = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/generate-markets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'cryptocurrency', count: 3 })
      })

      const data = await response.json()
      if (data.success && data.markets.length > 0) {
        const market = data.markets[0]
        setMarketForm({
          question: market.question,
          outcomes: market.outcomes.join(', '),
          duration: market.durationHours || 72
        })
        showMessage('AI generated market suggestion!', 'success')
      }
    } catch (error: any) {
      showMessage('Error generating market: ' + error.message, 'error')
    }
  }

  // Load markets on mount and when connected
  useEffect(() => {
    loadMarkets()
  }, [])

  useEffect(() => {
    if (isConnected) {
      loadMarkets()
    }
  }, [isConnected])

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h3" component="h1" gutterBottom>
                🔮 Seer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI-Assisted Market Creation & Resolution
              </Typography>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Wallet:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {address ? `${address.substring(0, 6)}...${address.substring(38)}` : 'Not connected'}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AccountBalanceWallet />}
                  onClick={handleConnect}
                  disabled={isConnected || isConnecting}
                >
                  {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Wallet'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Create New Market
              </Typography>
              <Box component="form" onSubmit={createMarket} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Question"
                  value={marketForm.question}
                  onChange={(e) => setMarketForm({...marketForm, question: e.target.value})}
                  placeholder="Will Bitcoin reach $100k by end of 2024?"
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Outcomes (comma-separated)"
                  value={marketForm.outcomes}
                  onChange={(e) => setMarketForm({...marketForm, outcomes: e.target.value})}
                  placeholder="Yes, No"
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (hours)"
                  value={marketForm.duration}
                  onChange={(e) => setMarketForm({...marketForm, duration: parseInt(e.target.value)})}
                  inputProps={{ min: 1, max: 168 }}
                  required
                  sx={{ mb: 2 }}
                />
                <Stack direction="row" spacing={2}>
                  <Button 
                    type="submit" 
                    variant="contained"
                    disabled={isWriting || isConfirming}
                  >
                    {isWriting || isConfirming ? 'Processing...' : 'Create Market'}
                  </Button>
                  <Button
                    type="button"
                    variant="contained"
                    color="secondary"
                    startIcon={<AutoAwesome />}
                    onClick={generateAIMarket}
                  >
                    Generate with AI
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        <Typography variant="h4" align="center" sx={{ mb: 3, color: 'white' }}>
          Active Markets
        </Typography>

        <Grid container spacing={3}>
          <AnimatePresence>
            {markets.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography align="center" color="text.secondary">
                      Loading markets...
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              markets.map((market, index) => (
                <Grid item xs={12} sm={6} md={4} key={market.market_id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <MarketCard
                      market={market}
                      userAddress={address || null}
                      onPlaceBet={placeBet}
                    />
                  </motion.div>
                </Grid>
              ))
            )}
          </AnimatePresence>
        </Grid>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}
