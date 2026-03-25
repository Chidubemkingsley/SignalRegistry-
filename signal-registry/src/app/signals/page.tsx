'use client'
import React, { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { Header } from '@/components/wallet/Header'
import { EmitSignalPanel } from '@/components/contract/EmitSignalPanel'
import { WeightLookupPanel } from '@/components/contract/WeightPanel'
import { useEventLogs, computeDecayedWeight, computeDecayPercent } from '@/hooks/useEventLogs'
import { useCheckpointDecay } from '@/hooks/useContract'
import { SignalTypeBadge, DecayBar, shortAddr, timeAgo, NoWallet } from '@/components/ui'
import { BLOCKSCOUT_URL } from '@/lib/contract'

function UserSignalCard({ ev, onCheckpoint }: {
  ev: ReturnType<typeof useEventLogs>['events'][0]
  onCheckpoint: (id: bigint) => void
}) {
  const [open, setOpen] = useState(false)
  const decayPct = ev.timestamp ? computeDecayPercent(ev.timestamp) : 0
  const remaining = 100 - decayPct
  const stakeNum = ev.stake ? parseFloat(ev.stake) : 0
  const currentWeight = ev.timestamp ? computeDecayedWeight(stakeNum, ev.timestamp) : stakeNum
  const age = ev.timestamp ? timeAgo(ev.timestamp) : '—'

  return (
    <div
      className={`event-card${open ? ' expanded' : ''}`}
      style={{ borderLeft: `3px solid ${remaining > 50 ? 'var(--green)' : remaining > 20 ? 'var(--amber)' : 'var(--red)'}` }}
    >
      <div className="event-card-header" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>
          #{ev.signalId}
        </span>
        {ev.sigTypeLabel && <SignalTypeBadge label={ev.sigTypeLabel} />}
        <div style={{ flex: 1, marginLeft: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 2 }}>
            Weight remaining
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="decay-bar-wrap" style={{ flex: 1, margin: 0 }}>
              <div
                className="decay-bar-fill"
                style={{
                  width: `${remaining}%`,
                  background: remaining > 50 ? '#4ade80' : remaining > 20 ? '#fbbf24' : '#f87171'
                }}
              />
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', flexShrink: 0 }}>
              {remaining.toFixed(1)}%
            </span>
          </div>
        </div>
        <span className="event-time">{age}</span>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="event-details">
          <div className="event-detail-item">
            <span className="event-detail-label">Signal ID</span>
            <span className="event-detail-val">#{ev.signalId}</span>
          </div>
          <div className="event-detail-item">
            <span className="event-detail-label">Topic (bytes32)</span>
            <span className="event-detail-val" style={{ fontSize: 9 }}>{ev.topic}</span>
          </div>
          <div className="event-detail-item">
            <span className="event-detail-label">Original Stake</span>
            <span className="event-detail-val">{stakeNum.toFixed(6)} tRBTC</span>
          </div>
          <div className="event-detail-item">
            <span className="event-detail-label">Current Weight (est.)</span>
            <span className="event-detail-val" style={{ color: 'var(--purple2)' }}>
              {currentWeight.toFixed(6)} tRBTC
            </span>
          </div>
          <div className="event-detail-item">
            <span className="event-detail-label">Decay Progress</span>
            <span className="event-detail-val">{decayPct.toFixed(2)}% decayed</span>
          </div>
          <div className="event-detail-item">
            <span className="event-detail-label">Emitted</span>
            <span className="event-detail-val">{ev.timestamp ? new Date(ev.timestamp * 1000).toLocaleString() : '—'}</span>
          </div>
          <div className="event-detail-item" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                className="btn btn-amber"
                style={{ marginTop: 0, flex: 1 }}
                onClick={() => ev.signalId && onCheckpoint(BigInt(ev.signalId))}
              >
                📉 Checkpoint Decay
              </button>
              <a
                href={`${BLOCKSCOUT_URL}/tx/${ev.txHash}`}
                target="_blank" rel="noopener noreferrer"
                className="btn btn-cyan"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', fontSize: 12 }}
              >
                ↗ View Tx
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SignalsPage() {
  const { address, isConnected } = useAccount()
  const { events, loading } = useEventLogs()
  const { checkpoint } = useCheckpointDecay()

  const mySignals = useMemo(() =>
    events.filter(e =>
      e.kind === 'SignalEmitted' &&
      e.address?.toLowerCase() === address?.toLowerCase()
    ),
    [events, address]
  )

  const globalSignals = events.filter(e => e.kind === 'SignalEmitted')

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="hero" style={{ marginBottom: 32 }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(22px,4vw,38px)' }}>
            <span className="hero-accent">Signal</span> Explorer
          </h1>
          <p className="hero-sub">Emit signals, track decay in real-time</p>
        </div>

        <div className="panels" style={{ marginBottom: 18 }}>
          <EmitSignalPanel />
          <WeightLookupPanel />
        </div>

        {/* My signals */}
        <div className="panel panel-wide" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <div className="panel-icon">🎯</div>
            <div>
              <div className="panel-title">My Signals</div>
              <div className="panel-desc">
                {isConnected
                  ? `${mySignals.length} signals from your address`
                  : 'Connect wallet to view your signals'}
              </div>
            </div>
          </div>

          {!isConnected && <NoWallet message="view your signals" />}
          {isConnected && loading && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
              <span className="spinner" style={{ marginRight: 8 }} /> Indexing events…
            </div>
          )}
          {isConnected && !loading && mySignals.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
              No signals from your address yet. Emit one above!
            </div>
          )}
          {isConnected && mySignals.length > 0 && (
            <div className="event-list">
              {mySignals.map(ev => (
                <UserSignalCard key={`${ev.txHash}-${ev.logIndex}`} ev={ev} onCheckpoint={checkpoint} />
              ))}
            </div>
          )}
        </div>

        {/* All signals */}
        <div className="panel panel-wide">
          <div className="panel-head">
            <div className="panel-icon">🌐</div>
            <div>
              <div className="panel-title">All Signals</div>
              <div className="panel-desc">{globalSignals.length} signals total</div>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
              <span className="spinner" style={{ marginRight: 8 }} /> Loading…
            </div>
          )}
          {!loading && globalSignals.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
              No signals found in recent blocks.
            </div>
          )}
          {!loading && globalSignals.length > 0 && (
            <div className="event-list">
              {globalSignals.map(ev => (
                <UserSignalCard key={`${ev.txHash}-${ev.logIndex}`} ev={ev} onCheckpoint={checkpoint} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
