'use client'
import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { useEmitSignal } from '@/hooks/useContract'
import { TxStatus, NoWallet } from '@/components/ui'
import { SignalType } from '@/lib/contract'

const SIGNAL_TYPES = [
  { value: SignalType.SUPPORT, label: 'SUPPORT', icon: '↑', cls: 'chip-support' },
  { value: SignalType.OPPOSE,  label: 'OPPOSE',  icon: '↓', cls: 'chip-oppose'  },
  { value: SignalType.NEUTRAL, label: 'NEUTRAL', icon: '~', cls: 'chip-neutral' },
]

const SUGGESTED_TOPICS = ['governance', 'protocol-upgrade', 'treasury', 'security', 'feature-request']

export function EmitSignalPanel() {
  const { address, isConnected } = useAccount()
  const [topic, setTopic] = useState('')
  const [sigType, setSigType] = useState<SignalType>(SignalType.SUPPORT)
  const { emitSignal, tx, reset } = useEmitSignal()

  if (!isConnected) return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon">📣</div>
        <div>
          <div className="panel-title">Emit Signal</div>
          <div className="panel-desc">Broadcast a weighted opinion on any topic</div>
        </div>
      </div>
      <NoWallet message="emit signals" />
    </div>
  )

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon">📣</div>
        <div>
          <div className="panel-title">Emit Signal</div>
          <div className="panel-desc">Broadcast a weighted opinion on any topic</div>
        </div>
      </div>

      <div className="field">
        <label className="field-label">Topic</label>
        <input
          className="field-input"
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. governance, treasury, protocol-upgrade"
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          {SUGGESTED_TOPICS.map(t => (
            <button
              key={t}
              style={{
                padding: '3px 8px', background: 'rgba(124,58,237,0.07)',
                border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6,
                fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', cursor: 'pointer',
              }}
              onClick={() => setTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Signal Type</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {SIGNAL_TYPES.map(st => (
            <button
              key={st.value}
              className={`signal-chip ${st.cls}${sigType === st.value ? ' selected' : ''}`}
              onClick={() => setSigType(st.value)}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {st.icon} {st.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        padding: '10px 12px', background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)', borderRadius: 'var(--r)',
        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginBottom: 14
      }}>
        Topic hash: <span style={{ color: 'var(--purple2)' }}>
          {topic ? `keccak256("${topic}")` : '—'}
        </span>
      </div>

      <button
        className="btn btn-purple"
        disabled={!topic.trim() || tx.status === 'pending'}
        onClick={async () => {
          reset()
          await emitSignal(topic.trim(), sigType)
        }}
      >
        {tx.status === 'pending' ? <><span className="spinner" /> Broadcasting…</> : '◎ Emit Signal'}
      </button>
      <TxStatus {...tx} />
    </div>
  )
}
