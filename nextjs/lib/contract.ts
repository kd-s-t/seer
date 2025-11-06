// Contract ABI for wagmi/viem
export const CONTRACT_ABI = [
  {
    name: 'createMarket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'outcomes', type: 'string[]' },
      { name: 'durationHours', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'placeBet',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'outcome', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'getMarket',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'question', type: 'string' },
      { name: 'endTime', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'winningOutcome', type: 'uint256' },
      { name: 'totalPool', type: 'uint256' }
    ]
  },
  {
    name: 'getMarketOutcomes',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string[]' }]
  },
  {
    name: 'getOutcomePool',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'outcome', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'MarketCreated',
    type: 'event',
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'question', type: 'string' }
    ]
  }
] as const

