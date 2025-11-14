export const CACHE_KEY = 'news_trending_cache'
export const CACHE_TTL = 86400000 // 24 hours in milliseconds

export const ROW_PATTERNS = [
  [{ xs: 12, md: 8 }, { xs: 12, md: 4 }],
  [{ xs: 12, md: 4 }, { xs: 12, md: 8 }],
  [{ xs: 12, md: 6 }, { xs: 12, md: 6 }],
] as const

export const CRYPTO_KEYWORDS = [
  'bitcoin',
  'btc',
  'ethereum',
  'eth',
  'crypto',
  'blockchain',
  'defi',
  'nft',
  'solana',
  'cardano',
  'polkadot'
] as const

export const MIN_PATTERN_DISTANCE = 2

