'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Grid, Card, CardContent, Typography } from '@mui/material'
import MarketCard from './MarketCard'
import { Market } from '@/types'

interface MarketsListProps {
  markets: Market[]
  loading?: boolean
  userAddress: string | undefined
  onPlaceBet: (marketId: number, outcome: number, amount: number) => void
  isPlacingBet?: boolean
}

export default function MarketsList({
  markets,
  loading = false,
  userAddress,
  onPlaceBet,
  isPlacingBet = false,
}: MarketsListProps) {
  return (
    <>
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
                    {loading ? 'Loading markets from blockchain...' : 'No markets found. Create one to get started!'}
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
                    userAddress={userAddress || null}
                    onPlaceBet={onPlaceBet}
                    isPlacingBet={isPlacingBet}
                  />
                </motion.div>
              </Grid>
            ))
          )}
        </AnimatePresence>
      </Grid>
    </>
  )
}

