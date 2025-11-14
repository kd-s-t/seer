import { formatEther } from 'viem'
import { type AnalyticsData } from './types'

export function formatTotalStaked(totalAmountStaked: string): string {
  try {
    return parseFloat(formatEther(BigInt(totalAmountStaked || '0'))).toFixed(4)
  } catch {
    return '0.0000'
  }
}

export function calculateAccuracyRate(analytics: AnalyticsData): string {
  if (analytics.resolvedStakes === 0) {
    return '0.00'
  }
  return ((analytics.correctPredictions / analytics.resolvedStakes) * 100).toFixed(2)
}

