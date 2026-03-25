# SignalRegistry Frontend

Event-first, time-decay signal primitive on Rootstock Testnet.

## Stack

- **Next.js 14** (App Router)
- **wagmi v2 + viem** — contract reads/writes, MetaMask connection
- **@tanstack/react-query** — caching & refetching
- **TailwindCSS** — utility classes
- **Custom CSS** — design system from `globals.css`

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in your keys in .env.local
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_ALCHEMY_RSK_URL` | Alchemy RSK RPC endpoint |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | SignalRegistry contract address |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect v2 project ID |
| `NEXT_PUBLIC_PARA_API_KEY` | Para wallet API key |

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — stats, register/deregister, emit signal, recent events |
| `/signals` | Signal explorer — my signals + all signals with decay bars |
| `/events` | Full event feed — filters, export CSV/JSON |
| `/state` | State machine diagram + cooldown timer + analytics |

## Architecture

The frontend is **not a CRUD app**. It's an **event-indexing + real-time analytics system**:

- **Event Indexing**: `viem.getLogs()` over last 10,000 blocks, polls every 15s
- **State Machine**: `currentState(address)` read + visual diagram
- **Decay**: Client-side computed (`elapsed / 86400 × stake`) + on-chain `effectiveWeight(id)`
- **Cooldown**: Client-side countdown from last `SignalEmitted` event timestamp

## Contract

- **Address**: `0x214e2316EAEeE24c1dc5d8433329fFC7544DA331`
- **Network**: Rootstock Testnet (chainId: 31)
- **Explorer**: https://explorer.testnet.rsk.co

## Deploy

```bash
# Vercel
vercel --prod
```
