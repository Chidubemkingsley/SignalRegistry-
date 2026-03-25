'use client'
import { useChainId, useSwitchChain } from 'wagmi'
import { rootstockTestnet } from '@/lib/contract'

export function useNetworkGuard() {
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  const isCorrectNetwork = chainId === rootstockTestnet.id

  const switchToRSK = () => switchChain({ chainId: rootstockTestnet.id })

  return { isCorrectNetwork, switchToRSK, switching: isPending }
}
