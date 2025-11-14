export interface UserStats {
  wins: bigint
  losses: bigint
  totalStaked: bigint
  totalWon: bigint
  totalLost: bigint
  winRate: bigint
}

export interface UserStake {
  stakeId: string
  stakerId: string
  cryptoId: string
  direction: 'up' | 'down'
  amountWei?: string
  amount?: string
  predictedPrice: string
  percentChange: number
  createdAt: string
  isResolved: boolean
  isExpired: boolean
  rewarded?: boolean
  predictionCorrect?: boolean | null
  actualPrice?: string
}

