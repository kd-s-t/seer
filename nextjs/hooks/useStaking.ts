import { useState, useEffect, useRef, useMemo } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useReadContract, useAccount } from 'wagmi'
import { parseEther, formatEther, decodeEventLog } from 'viem'
import { PREDICTION_STAKING_ABI } from '@/lib/blockchain/predictionStaking'
import { useContract } from './useContract'
import { getStakeablePredictions } from '@/lib/seery'

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

  const stakeOnCrypto = async (
    cryptoId: string,
    currentPrice: string,
    predictedPrice: string,
    direction: string,
    percentChange: number,
    amountInBNB: string,
    stakeUp: boolean,
    libraryId?: string | number | null,
    existingStakeId?: string | number | null
  ) => {
    if (!predictionStakingAddress) {
      throw new Error('PredictionStaking contract address not configured')
    }


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

    // Check user balance before staking
    if (!stakerAddress || !publicClient) {
      throw new Error('Wallet not connected')
    }

    const parsedAmount = parseEther(amountInBNB)
    console.log('Staking amount:', { 
      amountInBNB, 
      parsedAmount: parsedAmount.toString(), 
      parsedAmountHex: parsedAmount.toString(16),
      parsedAmountType: typeof parsedAmount,
      expectedFor3BNB: '3000000000000000000',
      isCorrect: parsedAmount.toString() === '3000000000000000000' ? 'YES' : 'NO - BUG!'
    })
    
    // Try to check balance, but don't block if it times out
    try {
      const userBalance = await Promise.race([
        publicClient.getBalance({
          address: stakerAddress as `0x${string}`
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Balance check timeout')), 5000)
        )
      ]) as bigint
      
      // Check if user has sufficient balance (with small buffer for gas)
      const gasBuffer = parseEther('0.001') // Small buffer for gas fees
      if (userBalance < parsedAmount + gasBuffer) {
        const balanceFormatted = formatEther(userBalance)
        throw new Error(`Insufficient funds. You have ${parseFloat(balanceFormatted).toFixed(4)} BNB, but need ${parseFloat(amountInBNB).toFixed(4)} BNB plus gas fees.`)
      }
    } catch (balanceError: any) {
      // If balance check fails (timeout, network error, etc.), log warning but continue
      // The transaction will fail on-chain if there's insufficient balance anyway
      console.warn('Balance check failed (will proceed anyway):', balanceError.message)
    }

    // Set lock before sending transaction (only after balance check passes)
    transactionLockRef.current = true
    const previousHash = lastHashRef.current

    try {
      const currentPriceWei = parseEther(currentPrice)
      const predictedPriceWei = parseEther(predictedPrice)
      const percentChangeScaled = BigInt(Math.floor(Math.abs(percentChange) * 100))
      
      const libraryIdBigInt = libraryId ? BigInt(libraryId) : BigInt(0)
      
      console.log('About to send transaction:', {
        value: parsedAmount.toString(),
        valueType: typeof parsedAmount,
        valueHex: parsedAmount.toString(16),
        amountInBNB,
        existingStakeId,
        'CHECK': parsedAmount.toString() === '3000000000000000000' ? '✅ Correct (3 BNB)' : `❌ WRONG! Expected 3000000000000000000, got ${parsedAmount.toString()}`
      })
      
      // parseEther already returns a BigInt, so we can use it directly
      const transactionValue = parsedAmount
      
      console.log('Final transaction value check:', {
        original: String(parsedAmount),
        final: String(transactionValue),
        areEqual: String(parsedAmount) === String(transactionValue),
        type: typeof transactionValue
      })
      
      // If existingStakeId is provided, join the existing stake instead of creating a new one
      if (existingStakeId) {
        const stakeIdBigInt = BigInt(existingStakeId)
        console.log('Joining existing stake:', stakeIdBigInt.toString())
        
        writeContract({
          address: predictionStakingAddress as `0x${string}`,
          abi: PREDICTION_STAKING_ABI,
          functionName: 'stakeOnIt',
          args: [
            stakeIdBigInt,
            stakeUp
          ],
          value: transactionValue
        })
      } else {
        console.log('Creating new stake')
        
        writeContract({
          address: predictionStakingAddress as `0x${string}`,
          abi: PREDICTION_STAKING_ABI,
          functionName: 'createStake',
          args: [
            cryptoId,
            currentPriceWei,
            predictedPriceWei,
            direction,
            percentChangeScaled,
            stakeUp,
            libraryIdBigInt // libraryId: 0 means not linked to a library entry, otherwise links to library
          ],
          value: transactionValue
        })
      }
      
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

  // Removed: stake() and claimRewards() functions - not in simplified contract
  // Use createStake() instead via stakeOnCrypto()
  
  const resolveStake = async (stakeId: number, actualPrice: string) => {
    if (!predictionStakingAddress) {
      throw new Error('PredictionStaking contract address not configured')
    }

    const actualPriceWei = parseEther(actualPrice)
    
      writeContract({
        address: predictionStakingAddress as `0x${string}`,
        abi: PREDICTION_STAKING_ABI,
      functionName: 'resolveStake',
      args: [BigInt(stakeId), actualPriceWei]
      })
  }

  useEffect(() => {
    if (hash) {
    }
  }, [hash])

  useEffect(() => {
    if (receipt || manualReceipt) {
      const txReceipt = receipt || manualReceipt
      if (txReceipt?.status === 'success' || txReceipt?.status === 1 || (txReceipt && !txReceipt.status)) {
        console.log('Response: Stake transaction succeeded')
        
        // Check the transaction value that was actually sent
        if (publicClient && hash) {
          Promise.all([
            publicClient.getTransaction({ hash }),
            publicClient.getTransactionReceipt({ hash }).catch(() => null)
          ]).then(([tx, receipt]) => {
            console.log('Transaction details:', {
              value: tx.value?.toString(),
              valueHex: tx.value?.toString(16),
              valueInBNB: tx.value ? formatEther(tx.value).toString() : 'N/A',
              'CHECK': tx.value ? `✅ Transaction sent with ${formatEther(tx.value)} BNB` : '❌ No value in transaction'
            })
            
            // Decode StakerJoined event to see what value the contract received
            if (receipt && receipt.logs) {
              try {
                receipt.logs.forEach((log) => {
                  try {
                    const decoded = decodeEventLog({
                      abi: PREDICTION_STAKING_ABI,
                      data: log.data,
                      topics: log.topics as any
                    })
                    if (decoded.eventName === 'StakerJoined') {
                      const amount = decoded.args.amount as bigint
                      console.log('StakerJoined event:', {
                        stakerId: decoded.args.stakerId?.toString(),
                        stakeId: decoded.args.stakeId?.toString(),
                        wallet: decoded.args.wallet,
                        amount: amount?.toString(),
                        amountInBNB: amount ? formatEther(amount).toString() : 'N/A',
                        'EVENT_CHECK': amount ? `Contract received: ${formatEther(amount)} BNB` : '❌ No amount in event'
                      })
                    }
                  } catch (e) {
                    // Not a StakerJoined event, ignore
                  }
                })
              } catch (err) {
                console.warn('Could not decode events:', err)
              }
            }
          }).catch(err => console.warn('Could not fetch transaction details:', err))
        }
      }
    }
  }, [receipt, manualReceipt, hash, publicClient])

  return {
    stakeOnCrypto,
    hash,
    isPending,
    isConfirming,
    isConfirmed: isConfirmed || !!manualReceipt,
    receipt: receipt || manualReceipt,
    error
  }
}

export function useStakeablePredictions() {
  const { predictionStakingAddress } = useContract()
  const { address: userAddress } = useAccount()
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const publicClient = usePublicClient()
  const { writeContract } = useWriteContract()
  const hasFetchedRef = useRef(false)

  const fetchPredictions = async (cancelledRef?: { current: boolean }) => {
      if (!predictionStakingAddress || !publicClient) {
        return
      }

      try {
        if (!cancelledRef?.current) {
          setLoading(true)
          setError(null)
        }

        // Get all stakes from backend API
        let stakesResponse
        const apiData = await getStakeablePredictions()
        console.log('Response: getStakes API', apiData)
        
        if (!apiData.success || !apiData.predictions) {
          stakesResponse = { stakes: [], totalStakes: BigInt(0), totalAmountStaked: BigInt(0) }
        } else {
          // Convert API response to contract format
          stakesResponse = {
            stakes: apiData.predictions.map((stake: any) => ({
              createdBy: stake.createdBy,
              createdAt: BigInt(stake.createdAt),
              expiresAt: BigInt(stake.expiresAt),
              libraryId: BigInt(stake.libraryId || 0),
              rewarded: stake.rewarded,
              predictionCorrect: stake.predictionCorrect || false,
              stakeUp: stake.stakeUp,
              cryptoId: stake.cryptoId,
              currentPrice: BigInt(stake.currentPrice),
              predictedPrice: BigInt(stake.predictedPrice),
              actualPrice: BigInt(stake.actualPrice || 0),
              direction: stake.direction,
              percentChange: BigInt(stake.percentChange)
            })),
            totalStakes: BigInt(apiData.totalStakes || 0),
            totalAmountStaked: BigInt(apiData.totalAmountStaked || 0)
          }
        }
        
        if (cancelledRef?.current) return
        
        const allStakes = stakesResponse?.stakes || []
        const totalStakes = stakesResponse?.totalStakes || BigInt(0)
        const totalAmountStaked = stakesResponse?.totalAmountStaked || BigInt(0)
        
        if (!allStakes || allStakes.length === 0) {
          if (!cancelledRef?.current) {
            setPredictions([])
            setLoading(false)
          }
          return
        }



        // Process each stake separately instead of grouping by cryptoId
        const predictionsData: any[] = []
        
        for (let i = 0; i < allStakes.length; i++) {
          if (cancelledRef?.current) return
          
          const stake = allStakes[i]
          const stakeId = i + 1 // Stake IDs start at 1
          const cryptoId = stake.cryptoId
          
          let totalStakedUp = '0'
          let totalStakedDown = '0'
          let userStakeUp = '0'
          let userStakeDown = '0'
          
          // Get stakers for this stake to calculate totals and user stakes
          try {
            // Try to get detailed staker list first (for user stakes)
            const stakers = await publicClient.readContract({
              address: predictionStakingAddress as `0x${string}`,
              abi: PREDICTION_STAKING_ABI,
              functionName: 'getStakersByStake',
              args: [BigInt(stakeId)]
            })
            
            if (cancelledRef?.current) return
            
            if (stakers && Array.isArray(stakers) && stakers.length > 0) {
              stakers.forEach((staker: any) => {
                // Validate staker data
                if (!staker || !staker.amountInBNB) {
                  console.warn(`Invalid staker data for stake ${stakeId}:`, staker)
                  return
                }
                
                // Calculate totals
                if (staker.stakeUp) {
                  totalStakedUp = (BigInt(totalStakedUp) + BigInt(staker.amountInBNB)).toString()
                } else {
                  totalStakedDown = (BigInt(totalStakedDown) + BigInt(staker.amountInBNB)).toString()
                }
                
                // Track user stakes if user is connected
                if (userAddress && staker.wallet.toLowerCase() === userAddress.toLowerCase()) {
                  if (staker.stakeUp) {
                    userStakeUp = (BigInt(userStakeUp) + BigInt(staker.amountInBNB)).toString()
                  } else {
                    userStakeDown = (BigInt(userStakeDown) + BigInt(staker.amountInBNB)).toString()
                  }
                }
              })
            } else {
              // No stakers found - this is normal for new stakes
              console.log(`No stakers found for stake ${stakeId} (cryptoId: ${cryptoId})`)
            }
          } catch (err: any) {
            console.error(`Failed to get stakers for stake ${stakeId} (cryptoId: ${cryptoId}):`, err.message || err)
            // Continue with zero values - stake might be new or contract call failed
          }
          
          // Create a separate prediction entry for each stake
          predictionsData.push({
            predictionId: `${cryptoId}-${stakeId}`, // Use cryptoId-stakeId as unique identifier
            stakeId: stakeId.toString(),
            cryptoId: cryptoId,
            currentPrice: formatEther(BigInt(stake.currentPrice || '0')),
            predictedPrice: formatEther(BigInt(stake.predictedPrice || '0')),
            actualPrice: stake.actualPrice ? formatEther(BigInt(stake.actualPrice)) : '0',
            rewarded: stake.rewarded || false,
            predictionCorrect: stake.predictionCorrect || false,
            timestamp: stake.createdAt.toString(),
            verified: false,
            accuracy: '0',
            direction: stake.direction,
            percentChange: (Number(stake.percentChange) / 100).toString(),
            expiresAt: stake.expiresAt.toString(),
            totalStakedUp: formatEther(BigInt(totalStakedUp || '0')),
            totalStakedDown: formatEther(BigInt(totalStakedDown || '0')),
            userStakeUp: formatEther(BigInt(userStakeUp || '0')),
            userStakeDown: formatEther(BigInt(userStakeDown || '0'))
          })
        }
        
        if (cancelledRef?.current) return
        
        // Sort by creation date descending (newest first)
        predictionsData.sort((a, b) => {
          const aTimestamp = parseInt(a.timestamp || '0')
          const bTimestamp = parseInt(b.timestamp || '0')
          return bTimestamp - aTimestamp
        })

        if (!cancelledRef?.current) {
          setPredictions(predictionsData)
          if (predictionsData.length === 0) {
            setError('No active predictions available.')
          }
        }
      } catch (err: any) {
        if (!cancelledRef?.current) {
          setError(err.message || 'Failed to load predictions')
          setPredictions([])
        }
      } finally {
        if (!cancelledRef?.current) {
          setLoading(false)
        }
      }
    }

  // Initial fetch - only once when dependencies are ready
  useEffect(() => {
    const cancelledRef = { current: false }

    if (!predictionStakingAddress || !publicClient) {
      setLoading(false)
      if (!predictionStakingAddress) {
        setError('Contract address not configured')
      }
      return
    }

    // Only fetch once on initial load
    if (hasFetchedRef.current) {
      return
    }

    hasFetchedRef.current = true
    fetchPredictions(cancelledRef)
    
    return () => {
      cancelledRef.current = true
    }
  }, [predictionStakingAddress, publicClient]) // Removed userAddress from dependencies - only fetch once on load

  const refetch = async () => {
    if (!predictionStakingAddress || !publicClient) {
      return Promise.resolve()
    }
    
    // Manual refetch - no cancellation needed, just call fetchPredictions
    await fetchPredictions()
  }

  return { predictions, loading, error, refetch }
}

export function useUserStakes(address: string | undefined) {
  return { stakes: [], loading: false, error: null }
}


