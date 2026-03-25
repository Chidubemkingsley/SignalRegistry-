'use client'
import { createConfig, http } from 'wagmi'
import { metaMask } from 'wagmi/connectors'
import { rootstockTestnet } from './contract'

export const wagmiConfig = createConfig({
  chains: [rootstockTestnet],
  connectors: [metaMask()],
  transports: {
    [rootstockTestnet.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_RSK_URL ||
      'https://public-node.testnet.rsk.co'
    ),
  },
})
