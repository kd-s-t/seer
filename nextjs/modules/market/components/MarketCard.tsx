'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Stack,
  Chip,
} from '@mui/material'
import { SportsEsports, EmojiEvents } from '@mui/icons-material'

interface MarketCardProps {
  market: {
    market_id: number
    question: string
    outcomes: string[]
    resolved: boolean
    winning_outcome?: number
    outcomePools?: { [key: number]: { total: string } }
  }
  userAddress: string | null
  onPlaceBet: (marketId: number, outcome: number, amount: number) => void
  isPlacingBet?: boolean
}

export default function MarketCard({ market, userAddress, onPlaceBet, isPlacingBet = false }: MarketCardProps) {
  const [selectedOutcome, setSelectedOutcome] = useState(0)
  const [betAmount, setBetAmount] = useState('0.01')

  const handleBet = () => {
    onPlaceBet(market.market_id, selectedOutcome, parseFloat(betAmount))
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Chip
                label={market.resolved ? 'Resolved' : 'Active'}
                color={market.resolved ? 'default' : 'success'}
                size="small"
                sx={{ mb: 1 }}
              />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {market.question}
              </Typography>
            </Box>

            <Box>
              {market.outcomes.map((outcome, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: idx < market.outcomes.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {outcome}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {market.outcomePools && market.outcomePools[idx]
                      ? `${parseFloat(market.outcomePools[idx].total).toFixed(4)}`
                      : '0'}
                  </Typography>
                </Box>
              ))}
            </Box>

            {!market.resolved ? (
              <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Place Bet:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Outcome</InputLabel>
                    <Select
                      value={selectedOutcome}
                      label="Outcome"
                      onChange={(e) => setSelectedOutcome(Number(e.target.value))}
                    >
                      {market.outcomes.map((outcome, idx) => (
                        <MenuItem key={idx} value={idx}>
                          {outcome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="0.01"
                    inputProps={{ step: 0.001, min: 0.001 }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SportsEsports />}
                    onClick={handleBet}
                    disabled={isPlacingBet}
                  >
                    {isPlacingBet ? 'Placing...' : 'Bet'}
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmojiEvents color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Winner: <strong>{market.outcomes[market.winning_outcome || 0]}</strong>
                  </Typography>
                </Stack>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  )
}
