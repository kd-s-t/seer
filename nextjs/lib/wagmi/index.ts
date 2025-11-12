import { createConfig, http } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'
import { defineChain } from 'viem'

const localhost = defineChain({
  id: 31337,
  name: 'Hardhat Localhost',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
  },
})

const chains = [localhost, bscTestnet] as const

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    metaMask(),
  ],
  transports: {
    [localhost.id]: http(),
    [bscTestnet.id]: http(),
  },
})

export * from './types'
