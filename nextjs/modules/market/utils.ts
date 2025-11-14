import { type CryptoPrice } from '@/lib/coingecko'
import { type SortOption, type SortDirection } from './types'

export function formatPercent(percent: number): string {
  const sign = percent >= 0 ? '+' : ''
  return `${sign}${percent.toFixed(2)}%`
}

export function formatLastFetchTime(date: Date | null): string {
  if (!date) return 'Never'
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  
  if (seconds < 10) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  return date.toLocaleTimeString()
}

export function sortCryptos(
  cryptos: CryptoPrice[],
  sortBy: SortOption,
  sortDirection: SortDirection
): CryptoPrice[] {
  if (!sortBy) return cryptos

  const sorted = [...cryptos]
  sorted.sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'price':
        comparison = b.price - a.price
        break
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol)
        break
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'ai':
        const aSuggestion = a.suggestionPercent ?? 0
        const bSuggestion = b.suggestionPercent ?? 0
        comparison = Math.abs(bSuggestion) - Math.abs(aSuggestion)
        break
      default:
        return 0
    }
    return sortDirection === 'asc' ? -comparison : comparison
  })

  return sorted
}

export function getCacheKey(tags?: string[]): string {
  return tags && tags.length > 0 
    ? `crypto_prices_cache_${tags.sort().join(',')}` 
    : 'crypto_prices_cache'
}

