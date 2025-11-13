export const PREDICTION_STAKING_ABI = [
  {
    name: 'stakeOnPrediction',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'predictionId', type: 'uint256' },
      { name: 'stakeUp', type: 'bool' }
    ],
    outputs: []
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'predictionId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'recordPrediction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'cryptoId', type: 'string' },
      { name: 'currentPrice', type: 'uint256' },
      { name: 'predictedPrice', type: 'uint256' },
      { name: 'direction', type: 'string' },
      { name: 'percentChange', type: 'uint256' }
    ],
    outputs: [{ name: 'predictionId', type: 'uint256' }]
  },
  {
    name: 'verifyPrediction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'predictionId', type: 'uint256' },
      { name: 'actualPrice', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'getUserStakedPredictions',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'getStakesByUser',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{
      name: '',
      type: 'tuple[]',
      components: [
        { name: 'predictionId', type: 'uint256' },
        { name: 'cryptoId', type: 'string' },
        { name: 'currentPrice', type: 'uint256' },
        { name: 'predictedPrice', type: 'uint256' },
        { name: 'actualPrice', type: 'uint256' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'verified', type: 'bool' },
        { name: 'accuracy', type: 'uint256' },
        { name: 'direction', type: 'string' },
        { name: 'percentChange', type: 'uint256' },
        { name: 'expiresAt', type: 'uint256' },
        { name: 'totalStakedUp', type: 'uint256' },
        { name: 'totalStakedDown', type: 'uint256' },
        { name: 'userStakeUp', type: 'uint256' },
        { name: 'userStakeDown', type: 'uint256' }
      ]
    }]
  },
  {
    name: 'getPrediction',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'predictionId', type: 'uint256' }],
    outputs: [
      { name: 'predictor', type: 'address' },
      { name: 'cryptoId', type: 'string' },
      { name: 'currentPrice', type: 'uint256' },
      { name: 'predictedPrice', type: 'uint256' },
      { name: 'actualPrice', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'verified', type: 'bool' },
      { name: 'accuracy', type: 'uint256' },
      { name: 'direction', type: 'string' },
      { name: 'percentChange', type: 'uint256' }
    ]
  },
  {
    name: 'getPredictionExpiry',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'predictionId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'StakePlaced',
    type: 'event',
    inputs: [
      { name: 'predictionId', type: 'uint256', indexed: true },
      { name: 'staker', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256' },
      { name: 'stakeUp', type: 'bool' },
      { name: 'timestamp', type: 'uint256' }
    ]
  },
  {
    name: 'PredictionRecorded',
    type: 'event',
    inputs: [
      { name: 'predictionId', type: 'uint256', indexed: true },
      { name: 'predictor', type: 'address', indexed: true },
      { name: 'cryptoId', type: 'string' },
      { name: 'currentPrice', type: 'uint256' },
      { name: 'predictedPrice', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' }
    ]
  },
  {
    name: 'PredictionVerified',
    type: 'event',
    inputs: [
      { name: 'predictionId', type: 'uint256', indexed: true },
      { name: 'actualPrice', type: 'uint256' },
      { name: 'accuracy', type: 'uint256' }
    ]
  }
] as const
