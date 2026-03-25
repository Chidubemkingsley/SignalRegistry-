'use client'
import React from 'react'
import { useAccount } from 'wagmi'
import { useRegister, useDeregister, useCurrentState } from '@/hooks/useContract'
import { TxStatus, NoWallet } from '@/components/ui'
import { UserState, STATE_LABELS } from '@/lib/contract'

export function RegisterPanel() {
  const { address, isConnected } = useAccount()
  const { register, tx: regTx, reset: resetReg } = useRegister()
  const { deregister, tx: deregTx, reset: resetDereg } = useDeregister()
  const { data: stateRaw, refetch } = useCurrentState(address as `0x${string}` | undefined)

  const userState = stateRaw !== undefined ? Number(stateRaw) : undefined
  const isRegistered = userState === UserState.ACTIVE || userState === UserState.COOLING
  const isPending = regTx.status === 'pending' || deregTx.status === 'pending'

  const stateColors: Record<number, string> = {
    0: 'var(--text3)', 1: 'var(--green)', 2: 'var(--amber)',
  }

  if (!isConnected) return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon">📡</div>
        <div>
          <div className="panel-title">Registration</div>
          <div className="panel-desc">Stake 0.0001 RBTC to join the registry</div>
        </div>
      </div>
      <NoWallet />
    </div>
  )

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon">📡</div>
        <div>
          <div className="panel-title">Registration</div>
          <div className="panel-desc">Stake 0.0001 RBTC to join the registry</div>
        </div>
      </div>

      {userState !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border)', borderRadius: 'var(--r)'
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: stateColors[userState], display: 'inline-block'
          }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: stateColors[userState] }}>
            {STATE_LABELS[userState]}
          </span>
        </div>
      )}

      {!isRegistered ? (
        <>
          <p style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)', marginBottom: 14 }}>
            Stake exactly 0.0001 RBTC to register
          </p>
          <button
            className="btn btn-green"
            disabled={isPending}
            onClick={async () => {
              resetReg()
              await register() // ✅ No parameter
              refetch()
            }}
          >
            {regTx.status === 'pending' ? <><span className="spinner" /> Registering…</> : '⚡ Register (0.0001 RBTC)'}
          </button>
          <TxStatus {...regTx} />
        </>
      ) : (
        <>
          <p style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)', marginBottom: 14 }}>
            You are registered and can emit signals.
          </p>
          <button
            className="btn btn-red"
            disabled={isPending}
            onClick={async () => {
              resetDereg()
              await deregister()
              refetch()
            }}
          >
            {deregTx.status === 'pending' ? <><span className="spinner" /> Deregistering…</> : '⛔ Deregister'}
          </button>
          <TxStatus {...deregTx} />
        </>
      )}
    </div>
  )
}