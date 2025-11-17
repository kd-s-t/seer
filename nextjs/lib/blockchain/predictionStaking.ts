export const PREDICTION_STAKING_ABI = [
  {
    name: 'createStake',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'cryptoId', type: 'string' },
      { name: 'currentPrice', type: 'uint256' },
      { name: 'predictedPrice', type: 'uint256' },
      { name: 'direction', type: 'string' },
      { name: 'percentChange', type: 'uint256' },
      { name: 'stakeUp', type: 'bool' },
      { name: 'libraryId', type: 'uint256' }
    ],
    outputs: [{ name: 'stakeId', type: 'uint256' }]
  },
  {
    name: 'getStakes',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        {
          name: 'stakes',
          type: 'tuple[]',
          components: [
            { name: 'createdBy', type: 'address' },
            { name: 'createdAt', type: 'uint256' },
            { name: 'expiresAt', type: 'uint256' },
            { name: 'libraryId', type: 'uint256' },
            { name: 'rewarded', type: 'bool' },
            { name: 'predictionCorrect', type: 'bool' },
            { name: 'stakeUp', type: 'bool' },
        { name: 'cryptoId', type: 'string' },
        { name: 'currentPrice', type: 'uint256' },
        { name: 'predictedPrice', type: 'uint256' },
        { name: 'actualPrice', type: 'uint256' },
        { name: 'direction', type: 'string' },
            { name: 'percentChange', type: 'uint256' }
          ]
        },
        { name: 'totalStakes', type: 'uint256' },
        { name: 'totalAmountStaked', type: 'uint256' }
      ]
    }]
  },
  {
    name: 'getStake',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    outputs: [
      { name: 'createdBy', type: 'address' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'libraryId', type: 'uint256' },
      { name: 'rewarded', type: 'bool' },
      { name: 'predictionCorrect', type: 'bool' },
      { name: 'stakeUp', type: 'bool' },
      { name: 'cryptoId', type: 'string' },
      { name: 'currentPrice', type: 'uint256' },
      { name: 'predictedPrice', type: 'uint256' },
      { name: 'actualPrice', type: 'uint256' },
      { name: 'direction', type: 'string' },
      { name: 'percentChange', type: 'uint256' }
    ]
  },
  {
    name: 'getStakesByCreator',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{
      name: '',
      type: 'tuple[]',
      components: [
        { name: 'createdBy', type: 'address' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'expiresAt', type: 'uint256' },
        { name: 'libraryId', type: 'uint256' },
        { name: 'rewarded', type: 'bool' },
        { name: 'stakeUp', type: 'bool' },
        { name: 'cryptoId', type: 'string' },
        { name: 'currentPrice', type: 'uint256' },
        { name: 'predictedPrice', type: 'uint256' },
        { name: 'direction', type: 'string' },
        { name: 'percentChange', type: 'uint256' }
      ]
    }]
  },
  {
    name: 'stakeOnIt',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'stakeId', type: 'uint256' },
      { name: 'stakeUp', type: 'bool' }
    ],
    outputs: [{ name: 'stakerId', type: 'uint256' }]
  },
  {
    name: 'getStakersByStake',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    outputs: [{
      name: '',
      type: 'tuple[]',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'wallet', type: 'address' },
        { name: 'stakeId', type: 'uint256' },
        { name: 'amountInBNB', type: 'uint256' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'stakeUp', type: 'bool' },
        { name: 'rewarded', type: 'bool' }
      ]
    }]
  },
  {
    name: 'getTotalStakedOnStake',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    outputs: [
      { name: 'totalUp', type: 'uint256' },
      { name: 'totalDown', type: 'uint256' }
    ]
  },
  {
    name: 'stakeCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'resolveStake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'stakeId', type: 'uint256' },
      { name: 'actualPrice', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'getUserStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'wins', type: 'uint256' },
      { name: 'losses', type: 'uint256' },
      { name: 'totalStaked', type: 'uint256' },
      { name: 'totalWon', type: 'uint256' },
      { name: 'totalLost', type: 'uint256' },
      { name: 'winRate', type: 'uint256' }
    ]
  },
  {
    name: 'StakePlaced',
    type: 'event',
    inputs: [
      { name: 'stakeId', type: 'uint256', indexed: true },
      { name: 'createdBy', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256' },
      { name: 'stakeUp', type: 'bool' },
      { name: 'timestamp', type: 'uint256' }
    ]
  },
  {
    name: 'StakerJoined',
    type: 'event',
    inputs: [
      { name: 'stakerId', type: 'uint256', indexed: true },
      { name: 'stakeId', type: 'uint256', indexed: true },
      { name: 'wallet', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256' },
      { name: 'stakeUp', type: 'bool' },
      { name: 'timestamp', type: 'uint256' }
    ]
  }
] as const
