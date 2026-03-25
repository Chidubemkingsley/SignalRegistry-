import { defineChain } from 'viem'

// ── Rootstock Testnet ──────────────────────────────────────────────
export const rootstockTestnet = defineChain({
  id: 31,
  name: 'Rootstock Testnet',
  nativeCurrency: { decimals: 18, name: 'RBTC', symbol: 'RBTC' },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ALCHEMY_RSK_URL!
      ],
    },
  },
  blockExplorers: {
    default: { name: 'Rootstock Explorer', url: 'https://explorer.testnet.rsk.co' },
  },
  testnet: true,
})

// ── Contract ──────────────────────────────────────────────────────
export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ||
  '0x214e2316EAEeE24c1dc5d8433329fFC7544DA331'




export const SIGNAL_REGISTRY_ABI = [
  // ── Write ──
  {
    type: 'function', name: 'register',
    inputs: [], outputs: [], stateMutability: 'payable',
  },
  {
    type: 'function', name: 'deregister',
    inputs: [], outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'signal',
    inputs: [
      { name: 'topic', type: 'bytes32' },
      { name: 'sigType', type: 'uint8' },
    ],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'checkpointDecay',
    inputs: [{ name: 'signalId', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  // ── Read ──
  {
    type: 'function', name: 'effectiveWeight',
    inputs: [{ name: 'signalId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'decayFraction',
    inputs: [{ name: 'signalId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'isSilent',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'currentState',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'topicHash',
    inputs: [{ name: '', type: 'string' }],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  // ── Events ──
  {
    type: 'event', name: 'Registered',
    inputs: [
      { name: 'broadcaster', type: 'address', indexed: true },
      { name: 'stake', type: 'uint256', indexed: false },
    ],
  },
  {
    "inputs": [],
    "name": "STAKE_AMOUNT",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    type: 'event', name: 'Deregistered',
    inputs: [
      { name: 'broadcaster', type: 'address', indexed: true },
      { name: 'stake', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'SignalEmitted',
    inputs: [
      { name: 'signalId', type: 'uint256', indexed: true },
      { name: 'broadcaster', type: 'address', indexed: true },
      { name: 'topic', type: 'bytes32', indexed: true },
      { name: 'sigType', type: 'uint8', indexed: false },
      { name: 'stake', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'DecayCheckpointed',
    inputs: [
      { name: 'signalId', type: 'uint256', indexed: true },
      { name: 'decayFraction', type: 'uint256', indexed: false },
      { name: 'effectiveWeight', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const

// ── Enums ──────────────────────────────────────────────────────────
export enum SignalType { SUPPORT = 0, OPPOSE = 1, NEUTRAL = 2 }
export enum UserState { UNREGISTERED = 0, ACTIVE = 1, COOLING = 2 }

export const SIGNAL_TYPE_LABELS: Record<number, string> = {
  0: 'SUPPORT', 1: 'OPPOSE', 2: 'NEUTRAL',
}
export const STATE_LABELS: Record<number, string> = {
  0: 'UNREGISTERED', 1: 'ACTIVE', 2: 'COOLING',
}

// 24h decay window in seconds
export const DECAY_WINDOW = 86400
// 5 min cooldown
export const COOLDOWN_SECONDS = 300

export const BLOCKSCOUT_URL = 'https://explorer.testnet.rsk.co'
