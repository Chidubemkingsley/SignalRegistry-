'use client'
import React, { useState, useEffect } from 'react'
import { BLOCKSCOUT_URL } from '@/lib/contract'
import { computeDecayPercent } from '@/hooks/useEventLogs'

// ── TxStatus ────────────────────────────────────────────────────────
interface TxStatusProps {
  status: 'idle' | 'pending' | 'success' | 'error'
  hash?: string
  error?: string
}
export function TxStatus({ status, hash, error }: TxStatusProps) {
  if (status === 'idle') return null
  return (
    <div className={`status-msg status-${status === 'pending' ? 'pending' : status === 'success' ? 'success' : 'error'}`}>
      {status === 'pending' && <><span className="spinner" /> Waiting for confirmation…</>}
      {status === 'success' && (
        <span>
          ✓ Success!
          {hash && (
            <a
              href={`${BLOCKSCOUT_URL}/tx/${hash}`}
              target="_blank" rel="noopener noreferrer"
              style={{ marginLeft: 8, opacity: 0.7, fontSize: 11 }}
            >
              View tx →
            </a>
          )}
        </span>
      )}
      {status === 'error' && <><span>✕</span> {error}</>}
    </div>
  )
}

// ── NoWallet ────────────────────────────────────────────────────────
export function NoWallet({ message }: { message?: string }) {
  return (
    <div className="no-wallet">
      <strong>Connect your wallet</strong> to {message ?? 'interact with the contract'}
    </div>
  )
}

// ── DecayBar ────────────────────────────────────────────────────────
export function DecayBar({ timestamp, color = '#a78bfa' }: { timestamp: number; color?: string }) {
  const [pct, setPct] = useState(() => computeDecayPercent(timestamp))

  useEffect(() => {
    const id = setInterval(() => setPct(computeDecayPercent(timestamp)), 5000)
    return () => clearInterval(id)
  }, [timestamp])

  const remaining = 100 - pct
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', marginBottom: 4 }}>
        <span>Signal weight</span>
        <span>{remaining.toFixed(1)}% remaining</span>
      </div>
      <div className="decay-bar-wrap">
        <div
          className="decay-bar-fill"
          style={{ width: `${remaining}%`, background: remaining > 50 ? '#4ade80' : remaining > 20 ? '#fbbf24' : '#f87171' }}
        />
      </div>
    </div>
  )
}

// ── SignalTypeBadge ─────────────────────────────────────────────────
const TYPE_CLASS: Record<string, string> = {
  SUPPORT: 'chip-support', OPPOSE: 'chip-oppose', NEUTRAL: 'chip-neutral',
}
const TYPE_ICON: Record<string, string> = {
  SUPPORT: '↑', OPPOSE: '↓', NEUTRAL: '~',
}
export function SignalTypeBadge({ label }: { label: string }) {
  const cls = TYPE_CLASS[label] ?? 'chip-neutral'
  const icon = TYPE_ICON[label] ?? '?'
  return (
    <span className={`signal-chip ${cls}`}>
      {icon} {label}
    </span>
  )
}

// ── Skeleton ────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

// ── Address truncate ────────────────────────────────────────────────
export function shortAddr(addr: string) {
  return addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : ''
}

// ── Time ago ────────────────────────────────────────────────────────
export function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}
