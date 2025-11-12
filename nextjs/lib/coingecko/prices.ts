import type { CryptoPricesResponse } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016'

export async function getCryptoPrices(symbols?: string[], tags?: string[], currency?: string, forceRefresh?: boolean): Promise<CryptoPricesResponse> {
  try {
    const params = new URLSearchParams()
    if (symbols && symbols.length > 0) {
      params.append('symbols', symbols.join(','))
    }
    if (tags && tags.length > 0) {
      params.append('tags', tags.join(','))
    }
    if (currency) {
      params.append('currency', currency)
    }
    if (forceRefresh) {
      params.append('_t', Date.now().toString())
      params.append('_refresh', '1')
    }
    const queryString = params.toString()
    const url = `${API_URL}/api/market-prediction${queryString ? `?${queryString}` : ''}`
    
    if (forceRefresh) {
      console.log('Frontend: Force refresh - calling API:', url)
    }
    
    const response = await fetch(url, {
      cache: 'no-store',
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        cryptos: [],
        timestamp: new Date().toISOString(),
        error: errorData.error || `Backend error: ${response.status} ${response.statusText}`
      }
    }
    
    const data = await response.json()
    return data
  } catch (error: any) {
    return {
      success: false,
      cryptos: [],
      timestamp: new Date().toISOString(),
      error: error.message || 'Failed to fetch crypto prices'
    }
  }
}

export async function searchCrypto(query: string) {
  try {
    const response = await fetch(`${API_URL}/api/crypto/search?query=${encodeURIComponent(query)}`)
    const data = await response.json()
    return data
  } catch (error: any) {
    return {
      success: false,
      results: [],
      error: error.message || 'Failed to search crypto'
    }
  }
}

export interface CryptoLibraryItem {
  id: string
  name: string
  symbol: string
  marketCap: number
}

export async function getCryptoLibrary(): Promise<{ success: boolean; library: CryptoLibraryItem[]; count: number }> {
  try {
    const response = await fetch(`${API_URL}/api/crypto/library`)
    const data = await response.json()
    return data
  } catch (error: any) {
    return {
      success: false,
      library: [],
      count: 0
    }
  }
}

