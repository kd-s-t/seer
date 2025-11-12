import { useState, useEffect } from 'react'

export function useContract() {
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [predictionStakingAddress, setPredictionStakingAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const address = process.env.NEXT_PUBLIC_PREDICTION_STAKING_ADDRESS || null
    if (address) {
      setPredictionStakingAddress(address)
      console.log('Set predictionStakingAddress from env:', address)
    } else {
      console.warn('PREDICTION_STAKING_ADDRESS not set in environment variables')
    }
    setLoading(false)
  }, [])

  return { 
    contractAddress, 
    predictionStakingAddress,
    loading 
  }
}

