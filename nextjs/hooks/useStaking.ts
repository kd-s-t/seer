import { useState, useEffect, useRef, useMemo } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useReadContract, useAccount } from 'wagmi'
import { parseEther, formatEther, createPublicClient, http } from 'viem'
import { PREDICTION_STAKING_ABI } from '@/lib/blockchain/predictionStaking'
import { useContract } from './useContract'

export function useStaking() {
  const { predictionStakingAddress } = useContract()
  const { address: stakerAddress } = useAccount()
  const [manualReceipt, setManualReceipt] = useState<any>(null)
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const publicClient = usePublicClient()
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
      retry: 10,
      retryDelay: 1000,
      refetchInterval: (data) => {
        if (data) return false
        return 1000
      },
    },
    confirmations: 1,
  })
  const transactionLockRef = useRef(false)
  const lastHashRef = useRef<`0x${string}` | null>(null)
  const currentHashRef = useRef<`0x${string}` | null>(null)
  const currentErrorRef = useRef<any>(null)

  // Reset transaction lock when transaction is confirmed or fails
  useEffect(() => {
    if (isConfirmed || receipt || manualReceipt) {
      // Wait a bit after confirmation to ensure everything is settled
      setTimeout(() => {
        transactionLockRef.current = false
        lastHashRef.current = null
      }, 500)
    } else if (error && !isPending && !isConfirming) {
      // Reset lock on error, but wait a bit to prevent race conditions
      setTimeout(() => {
        transactionLockRef.current = false
      }, 1000)
    }
  }, [isConfirmed, receipt, manualReceipt, error, isPending, isConfirming])

  // Track transaction hash to detect new transactions
  useEffect(() => {
    currentHashRef.current = hash || null
    if (hash && hash !== lastHashRef.current) {
      lastHashRef.current = hash
      transactionLockRef.current = true
      setManualReceipt(null)
    }
  }, [hash])

  // Manual polling for transaction receipt (fallback for MetaMask)
  useEffect(() => {
    if (!hash || !publicClient || isConfirmed || receipt || manualReceipt) {
      return
    }

    let cancelled = false
    const pollReceipt = async () => {
      try {
        const txReceipt = await publicClient.getTransactionReceipt({ hash })
        if (txReceipt && !cancelled) {
          setManualReceipt(txReceipt)
        }
      } catch (error) {
        // Transaction not yet mined, continue polling
      }
    }

    const interval = setInterval(() => {
      pollReceipt()
    }, 2000)

    pollReceipt()

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [hash, publicClient, isConfirmed, receipt, manualReceipt])

  // Track current error
  useEffect(() => {
    currentErrorRef.current = error
  }, [error])

  const stake = async (predictionId: bigint, amountInBNB: string, stakeUp: boolean) => {
    if (!predictionStakingAddress) {
      throw new Error('PredictionStaking contract address not configured')
    }

    console.log(`Staking: predictionId=${predictionId}, amount=${amountInBNB} BNB, stakeUp=${stakeUp}, stakerAddress=${stakerAddress}`)

    // Check if transaction is locked
    if (transactionLockRef.current) {
      throw new Error('Transaction already in progress. Please wait for it to complete.')
    }

    // Check wagmi pending state
    if (isPending || isConfirming) {
      throw new Error('Transaction already pending. Please wait for it to complete.')
    }

    // Reset any previous errors
    reset()

    // Set lock before sending transaction
    transactionLockRef.current = true
    const previousHash = lastHashRef.current

    try {
      const parsedAmount = parseEther(amountInBNB)
      console.log('📤 SUBMITTING TO CONTRACT:', {
        contractAddress: predictionStakingAddress,
        functionName: 'stakeOnPrediction',
        args: {
          predictionId: predictionId.toString(),
          stakeUp: stakeUp
        },
        valueBNB: amountInBNB,
        valueWei: parsedAmount.toString(),
        stakerAddress: stakerAddress
      })
      
      console.log('📋 EXACT CONTRACT CALL:', {
        address: predictionStakingAddress,
        functionName: 'stakeOnPrediction',
        args: [predictionId.toString(), stakeUp.toString()],
        valueWei: parsedAmount.toString(),
        valueBNB: amountInBNB
      })
      
      writeContract({
        address: predictionStakingAddress as `0x${string}`,
        abi: PREDICTION_STAKING_ABI,
        functionName: 'stakeOnPrediction',
        args: [predictionId, stakeUp],
        value: parsedAmount
      })
      
      // Wait for transaction hash to be set (wagmi is async)
      // Poll for up to 3 seconds to see if hash is set or error occurs
      let attempts = 0
      const maxAttempts = 30
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check current hash from ref (updated by useEffect)
        const currentHash = currentHashRef.current
        if (currentHash && currentHash !== previousHash) {
          // Transaction hash is set, lock will be maintained until confirmed
          return
        }
        
        // Check current error from ref (updated by useEffect)
        const currentError = currentErrorRef.current
        if (currentError) {
          transactionLockRef.current = false
          const errorAny = currentError as any
          const errorMsg = currentError?.message || errorAny?.info?.error?.message || ''
          if (errorMsg.includes('nonce') || errorMsg.includes('NONCE') || errorMsg.includes('Nonce')) {
            throw new Error('Transaction already pending. Please wait for the current transaction to complete before trying again.')
          }
          throw new Error(errorMsg || 'Transaction failed')
        }
        attempts++
      }
      
      // If we get here after 3 seconds, something went wrong
      // Check one more time if there's an error
      if (currentErrorRef.current) {
        transactionLockRef.current = false
        const errorAny = currentErrorRef.current as any
        const errorMsg = currentErrorRef.current?.message || errorAny?.info?.error?.message || ''
        throw new Error(errorMsg || 'Transaction failed')
      }
      
      // No hash and no error after waiting - might be queued, keep lock
      // The lock will be released when hash is set or error occurs
    } catch (err: any) {
      transactionLockRef.current = false
      const errorMsg = err?.message || ''
      if (errorMsg.includes('nonce') || errorMsg.includes('NONCE') || errorMsg.includes('Nonce')) {
        throw new Error('Transaction already pending. Please wait for the current transaction to complete before trying again.')
      }
      throw err
    }
  }

  const claimRewards = async (predictionId: bigint) => {
    if (!predictionStakingAddress) {
      throw new Error('PredictionStaking contract address not configured')
    }

    if (transactionLockRef.current || isPending || isConfirming) {
      throw new Error('Transaction already in progress. Please wait for it to complete.')
    }

    reset()
    transactionLockRef.current = true

    try {
      writeContract({
        address: predictionStakingAddress as `0x${string}`,
        abi: PREDICTION_STAKING_ABI,
        functionName: 'claimRewards',
        args: [predictionId]
      })
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (err: any) {
      transactionLockRef.current = false
      throw err
    }
  }

  useEffect(() => {
    if (hash) {
      console.log('🔵 STAKE TRANSACTION HASH:', hash)
    }
  }, [hash])

  useEffect(() => {
    if (receipt || manualReceipt) {
      const txReceipt = receipt || manualReceipt
      console.log('🟢 TRANSACTION RECEIPT:', {
        status: txReceipt?.status,
        transactionHash: txReceipt?.transactionHash,
        blockNumber: txReceipt?.blockNumber,
        gasUsed: txReceipt?.gasUsed?.toString(),
        logs: txReceipt?.logs?.length || 0
      })
      if (txReceipt?.status === 'success') {
        console.log('✅ TRANSACTION SUCCEEDED ON-CHAIN')
      } else if (txReceipt?.status === 'reverted') {
        console.log('❌ TRANSACTION REVERTED - STAKE NOT SAVED')
        console.log('🔍 Checking why transaction reverted...')
        
        if (publicClient && hash) {
          (async () => {
            try {
              const tx = await publicClient.getTransaction({ hash })
              console.log('Transaction details:', {
                to: tx.to,
                value: tx.value.toString(),
                data: tx.input
              })
              
              const revertReason = await publicClient.call({
                to: tx.to,
                data: tx.input,
                value: tx.value
              }).catch(err => err)
              
              if (revertReason?.data) {
                console.log('Revert reason data:', revertReason.data)
              }
            } catch (err) {
              console.log('Could not decode revert reason:', err)
            }
          })()
        }
      }
    }
  }, [receipt, manualReceipt])

  return {
    stake,
    claimRewards,
    hash,
    isPending,
    isConfirming,
    isConfirmed: isConfirmed || !!manualReceipt,
    receipt: receipt || manualReceipt,
    error
  }
}

export function useStakeablePredictions() {
  const { predictionStakingAddress, loading: contractLoading } = useContract()
  const { address: userAddress } = useAccount()
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wagmiPublicClient = usePublicClient()
  
  const publicClient = useMemo(() => {
    return createPublicClient({
      transport: http('http://localhost:8545'),
    })
  }, [])

  useEffect(() => {
    console.log('useStakeablePredictions - addresses:', {
      predictionStakingAddress,
      contractLoading,
      hasPublicClient: !!publicClient
    })
  }, [predictionStakingAddress, contractLoading, publicClient])


  useEffect(() => {
    if (!predictionStakingAddress || !publicClient) {
      setLoading(false)
      if (!predictionStakingAddress) {
        setError('Contract address not configured')
      }
      return
    }

    if (loading) {
      return
    }

    const fetchPredictions = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!userAddress) {
          setPredictions([])
          setLoading(false)
          return
        }

        const predictionIds = await publicClient.readContract({
          address: predictionStakingAddress as `0x${string}`,
          abi: PREDICTION_STAKING_ABI,
          functionName: 'getUserStakedPredictions',
          args: [userAddress as `0x${string}`]
        })
        
        if (!predictionIds || predictionIds.length === 0) {
          setPredictions([])
          setLoading(false)
          return
        }

        const stakeable = predictionIds.map((id: bigint) => ({
          predictionId: Number(id)
        }))

        setPredictions(stakeable)
        if (stakeable.length === 0) {
          setError('No stakeable predictions found.')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load predictions')
        setPredictions([])
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [predictionStakingAddress, publicClient, userAddress])

  const refetch = () => {
    if (predictionStakingAddress && publicClient && userAddress) {
      setLoading(true)
      const fetchPredictions = async () => {
        try {
          setError(null)
          const predictionIds = await publicClient.readContract({
            address: predictionStakingAddress as `0x${string}`,
            abi: PREDICTION_STAKING_ABI,
            functionName: 'getUserStakedPredictions',
            args: [userAddress as `0x${string}`]
          })
          const stakeable = predictionIds.map((id: bigint) => ({
            predictionId: Number(id)
          }))
          setPredictions(stakeable)
          setLoading(false)
        } catch (err: any) {
          setError(err.message || 'Failed to refetch predictions')
          setLoading(false)
        }
      }
      fetchPredictions()
    }
  }

  return { predictions, loading, error, refetch }
}

export function useUserStakes(address: string | undefined) {
  const { address: accountAddress } = useAccount()
  const { predictionStakingAddress } = useContract()
  const [stakes, setStakes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const publicClient = usePublicClient()

  const userAddress = address || accountAddress

  const { data: predictionIds } = useReadContract({
    address: predictionStakingAddress as `0x${string}` | undefined,
    abi: PREDICTION_STAKING_ABI,
    functionName: 'getUserStakedPredictions',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!predictionStakingAddress && !!userAddress,
    }
  })

  useEffect(() => {
    if (!predictionIds || !predictionStakingAddress || !publicClient || !userAddress) {
      if (!userAddress) {
      setStakes([])
      setLoading(false)
      }
      return
    }

    const fetchStakes = async () => {
      try {
        setLoading(true)
        const stakesData = predictionIds.map((id: bigint) => ({
          predictionId: id.toString(),
          stakeAmount: '0',
          stakeUp: '0',
          stakeDown: '0',
          totalStaked: '0',
          isExpired: false,
          prediction: {}
        }))

        setStakes(stakesData)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load stakes')
        setStakes([])
      } finally {
        setLoading(false)
      }
    }

    fetchStakes()
  }, [predictionIds, predictionStakingAddress, publicClient, userAddress])

  return { stakes, loading, error }
}

