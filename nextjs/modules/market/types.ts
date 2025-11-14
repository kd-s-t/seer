export type SortOption = 'price' | 'symbol' | 'name' | 'ai' | ''
export type SortDirection = 'asc' | 'desc'

export interface SelectedReasoning {
  crypto: string
  reasoning: string
  newsSources?: Array<{
    title: string
    source: string
    url: string
  }>
}

export interface PendingStake {
  amount: string
  direction: 'up' | 'down'
}

