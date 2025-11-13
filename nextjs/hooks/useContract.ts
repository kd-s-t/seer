import { useState, useEffect } from 'react'

export function useContract() {
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [predictionStakingAddress, setPredictionStakingAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const address = process.env.NEXT_PUBLIC_PREDICTION_STAKING_ADDRESS || null
    if (address) {
      setPredictionStakingAddress(address)
    }
    setLoading(false)
  }, [])

  return { 
    contractAddress, 
    predictionStakingAddress,
    loading 
  }
}

