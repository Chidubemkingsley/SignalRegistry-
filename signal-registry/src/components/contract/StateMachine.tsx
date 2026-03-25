'use client'
import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useCurrentState } from '@/hooks/useContract'
import { useCooldown } from '@/hooks/useCooldown'
import { useEventLogs } from '@/hooks/useEventLogs'
import { UserState, STATE_LABELS, COOLDOWN_SECONDS } from '@/lib/contract'
import { NoWallet } from '@/components/ui'

const STATE_META = {
  [UserState.UNREGISTERED]: {
    label: 'UNREGISTERED',
    icon: '○',
    cls: 'state-unreg',
    desc: 'Not registered. Stake tRBTC to join.',
    color: 'var(--text3)',
  },
  [UserState.ACTIVE]: {
    label: 'ACTIVE',
    icon: '◉',
    cls: 'state-active',
    desc: 'Ready to emit signals.',
    color: 'var(--green)',
  },
  [UserState.COOLING]: {
    label: 'COOLING',
    icon: '◌',
    cls: 'state-cool',
    desc: 'Cooldown in progress. Wait before emitting again.',
    color: 'var(--amber)',
  },
}

const TRANSITIONS = [
  { from: UserState.UNREGISTERED, to: UserState.ACTIVE,        trigger: 'register()',    color: 'var(--green)' },
  { from: UserState.ACTIVE,       to: UserState.COOLING,       trigger: 'signal()',      color: 'var(--amber)' },
  { from: UserState.COOLING,      to: UserState.ACTIVE,        trigger: '5min cooldown', color: 'var(--cyan)'  },
  { from: UserState.ACTIVE,       to: UserState.UNREGISTERED,  trigger: 'deregister()',  color: 'var(--red)'   },
  { from: UserState.COOLING,      to: UserState.UNREGISTERED,  trigger: 'deregister()',  color: 'var(--red)'   },
]

export function StateMachineViz() {
  const { address, isConnected } = useAccount()
  const { data: stateRaw, isLoading } = useCurrentState(address as `0x${string}` | undefined)
  const userState = stateRaw !== undefined ? Number(stateRaw) : undefined

  // Get last signal timestamp from events for cooldown
  const { events } = useEventLogs()
  const lastSignal = events.find(e => e.kind === 'SignalEmitted' && e.address?.toLowerCase() === address?.toLowerCase())
  const { formatted: cdFormatted, isActive: inCooldown, remaining } = useCooldown(lastSignal?.timestamp)

  // Cooldown progress
  const cdPct = inCooldown ? ((COOLDOWN_SECONDS - remaining) / COOLDOWN_SECONDS) * 100 : 100

  return (
    <div>
      {/* State nodes */}
      <div className="state-nodes">
        {([UserState.UNREGISTERED, UserState.ACTIVE, UserState.COOLING] as const).map((s, i) => {
          const meta = STATE_META[s]
          const isCurrent = userState === s
          return (
            <React.Fragment key={s}>
              {i > 0 && <div className="state-arrow">→</div>}
              <div
                className={`state-node ${meta.cls}${isCurrent ? ' active-state' : ''}`}
                style={{ opacity: isCurrent ? 1 : 0.45 }}
              >
                <span className="state-emoji">{meta.icon}</span>
                <span style={{ fontSize: 10, letterSpacing: 0.5 }}>{meta.label}</span>
                {isCurrent && (
                  <span style={{
                    position: 'absolute', top: -8,
                    background: meta.color, color: '#000',
                    fontSize: 8, fontFamily: 'var(--mono)', fontWeight: 700,
                    padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5
                  }}>
                    YOU
                  </span>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {/* Current state description */}
      {isConnected && userState !== undefined && (
        <div style={{
          textAlign: 'center', marginBottom: 24,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: STATE_META[userState as UserState]?.color }}>
            {STATE_META[userState as UserState]?.desc}
          </div>
        </div>
      )}

      {/* Cooldown timer */}
      {isConnected && userState === UserState.COOLING && (
        <div className="cooldown-box" style={{ marginBottom: 24 }}>
          <span className="cd-clock">⏳</span>
          <div>
            <div className="cd-label">Cooldown Remaining</div>
            <div className="cd-countdown">{cdFormatted}</div>
            <div className="cd-human">Signal allowed after cooldown expires</div>
          </div>
          <div style={{ flex: 1, marginLeft: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 6 }}>Progress</div>
            <div className="decay-bar-wrap" style={{ height: 8 }}>
              <div className="decay-bar-fill" style={{ width: `${cdPct}%`, background: 'var(--amber)' }} />
            </div>
          </div>
        </div>
      )}

      {/* Transitions table */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          State Transitions
        </div>
        {TRANSITIONS.map((t, i) => (
          <div key={i} className="info-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: STATE_META[t.from].color }}>
                {STATE_META[t.from].label}
              </span>
              <span style={{ color: 'var(--text3)', fontSize: 12 }}>→</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: STATE_META[t.to].color }}>
                {STATE_META[t.to].label}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.color }}>
              {t.trigger}
            </span>
          </div>
        ))}
      </div>

      {!isConnected && (
        <div style={{ marginTop: 20 }}>
          <NoWallet message="view your current state" />
        </div>
      )}
    </div>
  )
}
