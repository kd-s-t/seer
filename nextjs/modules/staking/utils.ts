import { type StakingPrediction } from './types'

export function formatPrice(priceWei: string): string {
  try {
    return parseFloat(priceWei).toFixed(2)
  } catch {
    return '0.00'
  }
}

export function formatPercent(percent: string): string {
  try {
    const num = parseFloat(percent)
    return num.toFixed(2)
  } catch {
    return '0.00'
  }
}

export function calculatePredictedPrice(
  currentPrice: string,
  percentChange: string,
  direction: string
): string {
  try {
    const currentPriceNum = parseFloat(currentPrice)
    const percentDecimal = parseFloat(percentChange) / 100
    const multiplier = direction === 'up' ? (1 + percentDecimal) : (1 - percentDecimal)
    const calculatedPredicted = currentPriceNum * multiplier
    return calculatedPredicted.toFixed(6)
  } catch {
    return currentPrice
  }
}

export function getActualDirection(
  currentPrice: string,
  percentChange: string,
  storedDirection: string
): 'up' | 'down' {
  try {
    const currentPriceNum = parseFloat(currentPrice)
    const percentDecimal = parseFloat(percentChange) / 100
    const calculatedPredicted = currentPriceNum * (storedDirection === 'up' ? (1 + percentDecimal) : (1 - percentDecimal))
    return calculatedPredicted > currentPriceNum ? 'up' : 'down'
  } catch {
    return storedDirection as 'up' | 'down'
  }
}

export function getTimeRemaining(expiresAt: string): string {
  const expiry = parseInt(expiresAt) * 1000
  const now = Date.now()
  const diff = expiry - now
  
  if (diff <= 0) return 'Expired'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

