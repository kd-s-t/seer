import { request } from './api'

export async function getAnalytics() {
  return request<{
    success: boolean
    analytics: {
      ongoingStakes: number
      resolvedStakes: number
      uniqueStakers: number
      correctPredictions: number
      totalStakes: number
      totalAmountStaked: string
    }
    timestamp: string
  }>('/api/staking/analytics')
}

