'use client'
import React, { useState } from 'react'
import { formatEther } from 'viem'
import { useEffectiveWeight, useDecayFraction } from '@/hooks/useContract'
import { DecayBar } from '@/components/ui'

export function WeightLookupPanel() {
  const [input, setInput] = useState('')
  const [signalId, setSignalId] = useState<bigint | undefined>()

  const { data: weight, isLoading: wLoading } = useEffectiveWeight(signalId)
  const { data: decay, isLoading: dLoading } = useDecayFraction(signalId)

  const lookup = () => {
    const n = parseInt(input)
    if (!isNaN(n) && n >= 0) setSignalId(BigInt(n))
  }

  const decayPct = decay !== undefined ? Number(decay) / 1e18 * 100 : undefined
  const weightEth = weight !== undefined ? formatEther(weight as bigint) : undefined

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon">⚖️</div>
        <div>
          <div className="panel-title">Signal Weight</div>
          <div className="panel-desc">Check effective weight of any signal ID</div>
        </div>
      </div>

      <div className="field">
        <label className="field-label">Signal ID</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="field-input"
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. 42"
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-cyan"
            style={{ width: 'auto', padding: '10px 14px', marginTop: 0 }}
            onClick={lookup}
            disabled={!input}
          >
            Query
          </button>
        </div>
      </div>

      {(wLoading || dLoading) && (
        <div style={{ textAlign: 'center', padding: 20, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>
          <span className="spinner" style={{ marginRight: 8 }} /> Querying chain…
        </div>
      )}

      {weightEth !== undefined && !wLoading && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>EFFECTIVE WEIGHT</div>
          <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--purple2)' }}>
            {parseFloat(weightEth).toFixed(6)}
            <span style={{ fontSize: 14, color: 'var(--text3)', marginLeft: 4 }}>tRBTC</span>
          </div>
          {decayPct !== undefined && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 6 }}>
                DECAY: {decayPct.toFixed(2)}% elapsed
              </div>
              <div className="decay-bar-wrap">
                <div
                  className="decay-bar-fill"
                  style={{
                    width: `${100 - decayPct}%`,
                    background: (100 - decayPct) > 50 ? '#4ade80' : (100 - decayPct) > 20 ? '#fbbf24' : '#f87171'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Silence check panel ────────────────────────────────────────────
import { useIsSilent } from '@/hooks/useContract'
import { shortAddr } from '@/components/ui'

export function SilenceCheckPanel() {
  const [addr, setAddr] = useState('')
  const [queryAddr, setQueryAddr] = useState<`0x${string}` | undefined>()
  const { data: silent, isLoading } = useIsSilent(queryAddr)

  const check = () => {
    if (addr.startsWith('0x') && addr.length === 42) setQueryAddr(addr as `0x${string}`)
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon">🔇</div>
        <div>
          <div className="panel-title">Silence Check</div>
          <div className="panel-desc">Check if a broadcaster is silenced</div>
        </div>
      </div>

      <div className="field">
        <label className="field-label">Address</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="field-input"
            value={addr}
            onChange={e => setAddr(e.target.value)}
            placeholder="0x…"
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-amber"
            style={{ width: 'auto', padding: '10px 14px', marginTop: 0 }}
            onClick={check}
            disabled={!addr}
          >
            Check
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 16, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>
          <span className="spinner" />
        </div>
      )}

      {silent !== undefined && !isLoading && (
        <div style={{
          textAlign: 'center', marginTop: 12, padding: '14px',
          background: silent ? 'rgba(248,113,113,0.07)' : 'rgba(74,222,128,0.07)',
          border: `1px solid ${silent ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.25)'}`,
          borderRadius: 'var(--r)'
        }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>{silent ? '🔇' : '📢'}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: silent ? 'var(--red)' : 'var(--green)' }}>
            {silent ? 'SILENCED' : 'ACTIVE'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 4 }}>
            {shortAddr(addr)}
          </div>
        </div>
      )}
    </div>
  )
}
