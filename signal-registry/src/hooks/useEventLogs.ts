'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPublicClient, http, parseAbiItem, formatEther, type Log } from 'viem'
import { rootstockTestnet, CONTRACT_ADDRESS, SIGNAL_TYPE_LABELS } from '@/lib/contract'

export type EventKind = 'SignalEmitted' | 'Registered' | 'Deregistered' | 'DecayCheckpointed'

export interface ParsedEvent {
  kind: EventKind
  blockNumber: bigint
  txHash: string
  logIndex: number
  // common
  timestamp?: number
  address?: string
  // SignalEmitted
  signalId?: string
  topic?: string
  sigType?: number
  sigTypeLabel?: string
  stake?: string
  // Registered / Deregistered
  // DecayCheckpointed
  decayFraction?: string
  effectiveWeight?: string
}

const publicClient = createPublicClient({
  chain: rootstockTestnet,
  transport: http(
    process.env.NEXT_PUBLIC_ALCHEMY_RSK_URL ||
    'https://public-node.testnet.rsk.co'
  ),
})

const SIGNAL_EMITTED_ABI = parseAbiItem(
  'event SignalEmitted(uint256 indexed signalId, address indexed broadcaster, bytes32 indexed topic, uint8 sigType, uint256 stake, uint256 timestamp)'
)
const REGISTERED_ABI = parseAbiItem(
  'event Registered(address indexed broadcaster, uint256 stake)'
)
const DEREGISTERED_ABI = parseAbiItem(
  'event Deregistered(address indexed broadcaster, uint256 stake)'
)
const DECAY_ABI = parseAbiItem(
  'event DecayCheckpointed(uint256 indexed signalId, uint256 decayFraction, uint256 effectiveWeight, uint256 timestamp)'
)

// Maximum block range allowed by Alchemy free tier
const MAX_BLOCK_RANGE = 10n

export function useEventLogs() {
  const [events, setEvents] = useState<ParsedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastProcessedBlockRef = useRef<bigint>(0n)
  const isMountedRef = useRef(true) // ✅ Add mount tracking

  const fetchLogs = useCallback(async () => {
    // ✅ Don't proceed if component is unmounted
    if (!isMountedRef.current) return
    
    try {
      const currentBlock = await publicClient.getBlockNumber()
      
      // Start from last processed block + 1, or current block - max range if first time
      let fromBlock: bigint
      if (lastProcessedBlockRef.current === 0n) {
        // Initial fetch: get last MAX_BLOCK_RANGE blocks
        fromBlock = currentBlock > MAX_BLOCK_RANGE ? currentBlock - MAX_BLOCK_RANGE : 0n
      } else {
        // Subsequent fetches: only get new blocks since last fetch
        fromBlock = lastProcessedBlockRef.current + 1n
      }
      
      // Don't fetch if we're already at the latest block
      if (fromBlock > currentBlock) {
        if (isMountedRef.current) {
          setLoading(false)
        }
        return
      }
      
      // Ensure we don't exceed max block range for Alchemy
      const toBlock = currentBlock
      let adjustedFromBlock = fromBlock
      
      // If the range is too large, only fetch the most recent MAX_BLOCK_RANGE blocks
      if (toBlock - adjustedFromBlock + 1n> MAX_BLOCK_RANGE) {
        adjustedFromBlock = toBlock - MAX_BLOCK_RANGE + 1n
      }
      
      console.log(`Fetching logs from block ${adjustedFromBlock} to ${toBlock} (range: ${toBlock - adjustedFromBlock})`)
      
      const [signalLogs, regLogs, deregLogs, decayLogs] = await Promise.all([
        publicClient.getLogs({ 
          address: CONTRACT_ADDRESS, 
          event: SIGNAL_EMITTED_ABI, 
          fromBlock: adjustedFromBlock,
          toBlock: toBlock
        }),
        publicClient.getLogs({ 
          address: CONTRACT_ADDRESS, 
          event: REGISTERED_ABI, 
          fromBlock: adjustedFromBlock,
          toBlock: toBlock
        }),
        publicClient.getLogs({ 
          address: CONTRACT_ADDRESS, 
          event: DEREGISTERED_ABI, 
          fromBlock: adjustedFromBlock,
          toBlock: toBlock
        }),
        publicClient.getLogs({ 
          address: CONTRACT_ADDRESS, 
          event: DECAY_ABI, 
          fromBlock: adjustedFromBlock,
          toBlock: toBlock
        }),
      ])

      // ✅ Only process if still mounted
      if (!isMountedRef.current) return

      const parsed: ParsedEvent[] = [
        ...signalLogs.map((log: any) => ({
          kind: 'SignalEmitted' as EventKind,
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? '',
          logIndex: log.logIndex ?? 0,
          address: log.args.broadcaster as string,
          signalId: log.args.signalId?.toString(),
          topic: log.args.topic as string,
          sigType: Number(log.args.sigType),
          sigTypeLabel: SIGNAL_TYPE_LABELS[Number(log.args.sigType)] ?? 'UNKNOWN',
          stake: formatEther(log.args.stake ?? 0n),
          timestamp: Number(log.args.timestamp ?? 0),
        })),
        ...regLogs.map((log: any) => ({
          kind: 'Registered' as EventKind,
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? '',
          logIndex: log.logIndex ?? 0,
          address: log.args.broadcaster as string,
          stake: formatEther(log.args.stake ?? 0n),
        })),
        ...deregLogs.map((log: any) => ({
          kind: 'Deregistered' as EventKind,
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? '',
          logIndex: log.logIndex ?? 0,
          address: log.args.broadcaster as string,
          stake: formatEther(log.args.stake ?? 0n),
        })),
        ...decayLogs.map((log: any) => ({
          kind: 'DecayCheckpointed' as EventKind,
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? '',
          logIndex: log.logIndex ?? 0,
          signalId: log.args.signalId?.toString(),
          decayFraction: log.args.decayFraction?.toString(),
          effectiveWeight: formatEther(log.args.effectiveWeight ?? 0n),
          timestamp: Number(log.args.timestamp ?? 0),
        })),
      ].sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) return Number(b.blockNumber - a.blockNumber)
        return b.logIndex - a.logIndex
      })

      // Update events: combine existing events with new ones
      setEvents(prev => {
        const existingHashes = new Set(prev.map(e => `${e.txHash}-${e.logIndex}`))
        const newEvents = parsed.filter(e => !existingHashes.has(`${e.txHash}-${e.logIndex}`))
        return [...newEvents, ...prev].sort((a, b) => {
          if (a.blockNumber !== b.blockNumber) return Number(b.blockNumber - a.blockNumber)
          return b.logIndex - a.logIndex
        })
      })
      
      // Update last processed block
      lastProcessedBlockRef.current = toBlock
      
      if (isMountedRef.current) {
        setError(null)
      }
    } catch (e: any) {
      console.error('Error fetching logs:', e)
      if (isMountedRef.current) {
        setError(e.message ?? 'Failed to fetch events')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    fetchLogs()
    
    pollingRef.current = setInterval(fetchLogs, 15000)
    
    return () => { 
      isMountedRef.current = false
      if (pollingRef.current) clearInterval(pollingRef.current) 
    }
  }, [fetchLogs])

  return { events, loading, error, refetch: fetchLogs }
}

// Computed client-side decay: fraction = elapsed / 86400, weight = stake * (1 - fraction)
export function computeDecayedWeight(stake: number, timestamp: number): number {
  const elapsed = Date.now() / 1000 - timestamp
  const fraction = Math.min(elapsed / 86400, 1)
  return stake * (1 - fraction)
}

export function computeDecayPercent(timestamp: number): number {
  const elapsed = Date.now() / 1000 - timestamp
  return Math.min((elapsed / 86400) * 100, 100)
}

export { publicClient }