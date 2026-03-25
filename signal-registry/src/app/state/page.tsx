'use client'
import React, { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { Header } from '@/components/wallet/Header'
import { StateMachineViz } from '@/components/contract/StateMachine'
import { useCurrentState, useIsSilent } from '@/hooks/useContract'
import { useEventLogs } from '@/hooks/useEventLogs'
import { useCooldown } from '@/hooks/useCooldown'
import { STATE_LABELS, UserState, COOLDOWN_SECONDS, DECAY_WINDOW } from '@/lib/contract'
import { Skeleton } from '@/components/ui'

function UserStateCard() {
  const { address, isConnected } = useAccount()
  const { data: stateRaw, isLoading } = useCurrentState(address as `0x${string}` | undefined)
  const { data: silent } = useIsSilent(address as `0x${string}` | undefined)
  const { events } = useEventLogs()

  const lastSignal = useMemo(() =>
    events.find(e => e.kind === 'SignalEmitted' && e.address?.toLowerCase() === address?.toLowerCase()),
    [events, address]
  )

  const { formatted: cdFormatted, isActive: inCooldown, remaining } = useCooldown(lastSignal?.timestamp)
  const cdPct = inCooldown ? ((COOLDOWN_SECONDS - remaining) / COOLDOWN_SECONDS) * 100 : 100

  const userState = stateRaw !== undefined ? Number(stateRaw) : undefined
  const stateColor = userState === UserState.ACTIVE ? 'var(--green)'
    : userState === UserState.COOLING ? 'var(--amber)'
    : 'var(--text3)'

  if (!isConnected) return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon">👤</div>
        <div>
          <div className="panel-title">Your State</div>
          <div className="panel-desc">Connect wallet to view</div>
        </div>
      </div>
      <div className="no-wallet"><strong>Connect your wallet</strong> to view your state</div>
    </div>
  )

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon">👤</div>
        <div>
          <div className="panel-title">Your State</div>
          <div className="panel-desc">{address?.slice(0,10)}…</div>
        </div>
      </div>

      {isLoading ? <Skeleton /> : (
        <>
          <div style={{
            textAlign: 'center', padding: '20px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${stateColor}33`,
            borderRadius: 'var(--r)', marginBottom: 16
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>
              {userState === UserState.ACTIVE ? '◉' : userState === UserState.COOLING ? '◌' : '○'}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: stateColor }}>
              {userState !== undefined ? STATE_LABELS[userState] : '—'}
            </div>
            {silent !== undefined && (
              <div style={{ marginTop: 8, fontSize: 11, fontFamily: 'var(--mono)', color: silent ? 'var(--red)' : 'var(--green)' }}>
                {silent ? '🔇 Silenced' : '📢 Broadcasting'}
              </div>
            )}
          </div>

          {inCooldown && (
            <div className="cooldown-box">
              <span className="cd-clock">⏳</span>
              <div style={{ flex: 1 }}>
                <div className="cd-label">Cooldown</div>
                <div className="cd-countdown">{cdFormatted}</div>
                <div className="decay-bar-wrap" style={{ marginTop: 6 }}>
                  <div className="decay-bar-fill" style={{ width: `${cdPct}%`, background: 'var(--amber)' }} />
                </div>
              </div>
            </div>
          )}

          {lastSignal && (
            <div className="info-row">
              <span className="info-key">Last Signal</span>
              <span className="info-val">
                {lastSignal.timestamp ? new Date(lastSignal.timestamp * 1000).toLocaleTimeString() : '—'}
              </span>
            </div>
          )}
          <div className="info-row">
            <span className="info-key">Cooldown Window</span>
            <span className="info-val">5 minutes</span>
          </div>
          <div className="info-row">
            <span className="info-key">Decay Window</span>
            <span className="info-val">24 hours</span>
          </div>
        </>
      )}
    </div>
  )
}

function SignalAnalytics() {
  const { address, isConnected } = useAccount()
  const { events } = useEventLogs()

  const mySignals = useMemo(() =>
    events.filter(e => e.kind === 'SignalEmitted' && e.address?.toLowerCase() === address?.toLowerCase()),
    [events, address]
  )

  const support = mySignals.filter(e => e.sigTypeLabel === 'SUPPORT').length
  const oppose  = mySignals.filter(e => e.sigTypeLabel === 'OPPOSE').length
  const neutral = mySignals.filter(e => e.sigTypeLabel === 'NEUTRAL').length
  const total   = mySignals.length

  const barStyle = (count: number, color: string) => ({
    height: 6,
    background: color,
    borderRadius: 3,
    width: total > 0 ? `${(count / total) * 100}%` : '0%',
    transition: 'width 0.5s ease',
  })

  if (!isConnected) return null

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon">📊</div>
        <div>
          <div className="panel-title">Signal Analytics</div>
          <div className="panel-desc">Your signal breakdown</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { label: 'SUPPORT', count: support, color: 'var(--green)' },
          { label: 'OPPOSE',  count: oppose,  color: 'var(--red)'   },
          { label: 'NEUTRAL', count: neutral, color: 'var(--cyan)'  },
        ].map(({ label, count, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontFamily: 'var(--mono)', fontSize: 11 }}>
              <span style={{ color }}>{label}</span>
              <span style={{ color: 'var(--text3)' }}>{count} / {total}</span>
            </div>
            <div className="decay-bar-wrap">
              <div className="decay-bar-fill" style={barStyle(count, color)} />
            </div>
          </div>
        ))}

        {total === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12, padding: 16 }}>
            No signals emitted yet
          </div>
        )}
      </div>
    </div>
  )
}

export default function StatePage() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="hero" style={{ marginBottom: 32 }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(22px,4vw,38px)' }}>
            <span className="hero-accent">State</span> Machine
          </h1>
          <p className="hero-sub">
            UNREGISTERED → ACTIVE → COOLING → ACTIVE
          </p>
        </div>

        {/* Full diagram */}
        <div className="panel panel-wide" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <div className="panel-icon">🔄</div>
            <div>
              <div className="panel-title">State Diagram</div>
              <div className="panel-desc">Contract state machine with live user position</div>
            </div>
          </div>
          <StateMachineViz />
        </div>

        <div className="panels">
          <UserStateCard />
          <SignalAnalytics />
        </div>
      </main>
    </div>
  )
}
