export interface StakingPrediction {
  predictionId: number
  cryptoId: string
  currentPrice: string
  predictedPrice: string
  direction: 'up' | 'down'
  percentChange: string
  totalStakedUp: string
  totalStakedDown: string
  userStakeUp?: string
  userStakeDown?: string
  expiresAt: string
  verified?: boolean
  libraryId?: string | number | null
}

