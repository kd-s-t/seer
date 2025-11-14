import { NewsItem } from './types'
import { ROW_PATTERNS, MIN_PATTERN_DISTANCE, CRYPTO_KEYWORDS } from './const'

export function getGridSizes(news: NewsItem[]): Array<{ xs: number; md: number }> {
  const sizes: Array<{ xs: number; md: number }> = []
  let itemIndex = 0
  const recentPatterns: number[] = []
  
  while (itemIndex < news.length) {
    let patternIndex
    let attempts = 0
    
    do {
      const seed = itemIndex * 7 + (news[itemIndex]?.title?.charCodeAt(0) || 0) + attempts
      patternIndex = seed % ROW_PATTERNS.length
      attempts++
    } while (recentPatterns.includes(patternIndex) && attempts < 20)
    
    const pattern = ROW_PATTERNS[patternIndex]
    recentPatterns.push(patternIndex)
    if (recentPatterns.length > MIN_PATTERN_DISTANCE) {
      recentPatterns.shift()
    }
    
    pattern.forEach((size) => {
      if (itemIndex < news.length) {
        sizes.push(size)
        itemIndex++
      }
    })
  }
  
  return sizes
}

export function getCryptoImageUrl(item: NewsItem, index: number): string {
  if (item.image) {
    return item.image
  }
  const lowerTitle = item.title.toLowerCase()
  const matchedKeyword = CRYPTO_KEYWORDS.find((k: string) => lowerTitle.includes(k)) || 'cryptocurrency'
  const imageId = (index * 100) % 1000
  return `https://source.unsplash.com/800x600/?${matchedKeyword},blockchain&sig=${imageId}`
}

