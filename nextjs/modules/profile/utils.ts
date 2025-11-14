import { formatEther } from 'viem'
import { type UserStats, type UserStake } from './types'

export function formatPrice(priceWei: string): string {
  try {
    return parseFloat(formatEther(BigInt(priceWei))).toFixed(2)
  } catch {
    return '0.00'
  }
}

export function formatAmount(amountWei?: string, amount?: string): string {
  try {
    if (amountWei) {
      return parseFloat(formatEther(BigInt(amountWei))).toFixed(4)
    }
    if (amount) {
      return parseFloat(amount).toFixed(4)
    }
    return '0.0000'
  } catch {
    return '0.0000'
  }
}

export function formatPercent(percent: number): string {
  try {
    return percent > 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`
  } catch {
    return '0.00%'
  }
}

export function calculateNetProfit(stats: UserStats): number {
  try {
    return Number(formatEther(stats.totalWon)) - Number(formatEther(stats.totalLost))
  } catch {
    return 0
  }
}

export function getWinRatePercent(stats: UserStats): string {
  try {
    return (Number(stats.winRate) / 100).toFixed(2)
  } catch {
    return '0.00'
  }
}

export function getStakeStatus(stake: UserStake): {
  status: 'Active' | 'Expired' | 'Won' | 'Lost'
  color: 'info' | 'warning' | 'success' | 'error'
} {
  if (stake.isResolved) {
    return stake.rewarded 
      ? { status: 'Won', color: 'success' }
      : { status: 'Lost', color: 'error' }
  }
  if (stake.isExpired) {
    return { status: 'Expired', color: 'warning' }
  }
  return { status: 'Active', color: 'info' }
}

