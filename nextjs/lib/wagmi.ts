import { createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

const chains = [bscTestnet, bsc] as const

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    metaMask(),
  ],
  transports: {
    [bscTestnet.id]: http(),
    [bsc.id]: http(),
  },
})

