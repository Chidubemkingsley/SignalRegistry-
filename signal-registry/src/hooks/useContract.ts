'use client'
import { useState, useCallback } from 'react'
import {
  useAccount, useWalletClient, usePublicClient,
  useReadContract, useChainId,
} from 'wagmi'
import { parseEther, keccak256, toHex, encodePacked, formatEther } from 'viem'
import {
  CONTRACT_ADDRESS, SIGNAL_REGISTRY_ABI,
  SignalType, UserState, rootstockTestnet,
} from '@/lib/contract'
import { useToast } from '@/lib/toast'

type TxStatus = 'idle' | 'pending' | 'success' | 'error'
interface TxState { status: TxStatus; hash?: string; error?: string }

function useTx() {
  const [tx, setTx] = useState<TxState>({ status: 'idle' })
  const reset = () => setTx({ status: 'idle' })
  return { tx, setTx, reset }
}

// ── Register ───────────────────────────────────────────────────────
export function useRegister() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { tx, setTx, reset } = useTx()
  const { addToast } = useToast()

  // ✅ Read the fixed stake amount from the contract
  const { data: stakeAmountRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIGNAL_REGISTRY_ABI,
    functionName: 'STAKE_AMOUNT',
  })

  const register = useCallback(async () => {
    if (!walletClient || !address || !publicClient) return
    
    // ✅ Get the correct stake amount from contract
    let stakeAmount = parseEther('0.0001') // fallback
    if (stakeAmountRaw) {
      stakeAmount = stakeAmountRaw
    }
    
    try {
      setTx({ status: 'pending' })
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: SIGNAL_REGISTRY_ABI,
        functionName: 'register',
        args: [], // ✅ No arguments
        value: stakeAmount, // ✅ Fixed amount from contract
        chain: rootstockTestnet,
        account: address,
      })
      addToast('Registration tx submitted!', 'info', hash)
      await publicClient.waitForTransactionReceipt({ hash })
      setTx({ status: 'success', hash })
      addToast('Registered successfully!', 'success', hash)
    } catch (e: any) {
      const msg = e.shortMessage ?? e.message ?? 'Transaction failed'
      setTx({ status: 'error', error: msg })
      addToast(msg, 'error')
    }
  }, [walletClient, address, publicClient, addToast, stakeAmountRaw])

  return { register, tx, reset, stakeAmount: stakeAmountRaw ? formatEther(stakeAmountRaw) : '0.0001' }
}

// ── Deregister ─────────────────────────────────────────────────────
export function useDeregister() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { tx, setTx, reset } = useTx()
  const { addToast } = useToast()

  const deregister = useCallback(async () => {
    if (!walletClient || !address || !publicClient) return
    try {
      setTx({ status: 'pending' })
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: SIGNAL_REGISTRY_ABI,
        functionName: 'deregister',
        args: [], // ✅ No arguments
        chain: rootstockTestnet,
        account: address,
      })
      addToast('Deregistration submitted', 'info', hash)
      await publicClient.waitForTransactionReceipt({ hash })
      setTx({ status: 'success', hash })
      addToast('Deregistered. Stake returned.', 'success', hash)
    } catch (e: any) {
      const msg = e.shortMessage ?? e.message ?? 'Transaction failed'
      setTx({ status: 'error', error: msg })
      addToast(msg, 'error')
    }
  }, [walletClient, address, publicClient, addToast])

  return { deregister, tx, reset }
}

// ── Emit Signal ───────────────────────────────────────────────────
export function useEmitSignal() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { tx, setTx, reset } = useTx()
  const { addToast } = useToast()

  const emitSignal = useCallback(async (topic: string, sigType: SignalType) => {
    if (!walletClient || !address || !publicClient) return
    // Hash topic string → bytes32 using keccak256
    const topicHash = keccak256(toHex(topic)) as `0x${string}`
    try {
      setTx({ status: 'pending' })
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: SIGNAL_REGISTRY_ABI,
        functionName: 'signal',
        args: [topicHash, sigType],
        chain: rootstockTestnet,
        account: address,
      })
      addToast('Signal tx submitted!', 'info', hash)
      await publicClient.waitForTransactionReceipt({ hash })
      setTx({ status: 'success', hash })
      addToast(`${['SUPPORT','OPPOSE','NEUTRAL'][sigType]} signal emitted on "${topic}"`, 'success', hash)
    } catch (e: any) {
      const msg = e.shortMessage ?? e.message ?? 'Transaction failed'
      setTx({ status: 'error', error: msg })
      addToast(msg, 'error')
    }
  }, [walletClient, address, publicClient, addToast])

  return { emitSignal, tx, reset }
}

// ── Checkpoint Decay ───────────────────────────────────────────────
export function useCheckpointDecay() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { tx, setTx, reset } = useTx()
  const { addToast } = useToast()

  const checkpoint = useCallback(async (signalId: bigint) => {
    if (!walletClient || !address || !publicClient) return
    try {
      setTx({ status: 'pending' })
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: SIGNAL_REGISTRY_ABI,
        functionName: 'checkpointDecay',
        args: [signalId],
        chain: rootstockTestnet,
        account: address,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setTx({ status: 'success', hash })
      addToast('Decay checkpointed', 'success', hash)
    } catch (e: any) {
      const msg = e.shortMessage ?? e.message ?? 'Transaction failed'
      setTx({ status: 'error', error: msg })
      addToast(msg, 'error')
    }
  }, [walletClient, address, publicClient, addToast])

  return { checkpoint, tx, reset }
}

// ── Read: STAKE_AMOUNT ─────────────────────────────────────────────
export function useStakeAmount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIGNAL_REGISTRY_ABI,
    functionName: 'STAKE_AMOUNT',
  })
}

// ── Read: currentState ─────────────────────────────────────────────
export function useCurrentState(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIGNAL_REGISTRY_ABI,
    functionName: 'currentState',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

// ── Read: isSilent ─────────────────────────────────────────────────
export function useIsSilent(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIGNAL_REGISTRY_ABI,
    functionName: 'isSilent',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

// ── Read: effectiveWeight ──────────────────────────────────────────
export function useEffectiveWeight(signalId?: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIGNAL_REGISTRY_ABI,
    functionName: 'effectiveWeight',
    args: signalId !== undefined ? [signalId] : undefined,
    query: { enabled: signalId !== undefined },
  })
}

// ── Read: decayFraction ────────────────────────────────────────────
export function useDecayFraction(signalId?: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIGNAL_REGISTRY_ABI,
    functionName: 'decayFraction',
    args: signalId !== undefined ? [signalId] : undefined,
    query: { enabled: signalId !== undefined },
  })
}