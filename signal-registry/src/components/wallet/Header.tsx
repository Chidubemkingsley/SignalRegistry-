'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { metaMask } from 'wagmi/connectors'
import { useNetworkGuard } from '@/hooks/useNetworkGuard'
import { shortAddr } from '@/components/ui'

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/signals', label: 'Signals' },
  { href: '/events', label: 'Events' },
  { href: '/state', label: 'State' },
]

export function Header() {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { isCorrectNetwork, switchToRSK, switching } = useNetworkGuard()

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/" className="logo">
          <div className="logo-icon">Σ</div>
          <div>
            <div className="logo-name">SignalRegistry</div>
            <div className="logo-sub">ROOTSTOCK TESTNET</div>
          </div>
        </Link>
        <nav className="nav-links">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-link${pathname === n.href ? ' active' : ''}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="header-right">
        {isConnected && !isCorrectNetwork && (
          <button
            className="connect-btn"
            style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}
            onClick={switchToRSK}
            disabled={switching}
          >
            {switching ? <span className="spinner" /> : '⚠'} Wrong Network
          </button>
        )}
        {isConnected && isCorrectNetwork && (
          <div className="net-badge">
            <span className="net-dot" />
            RSK Testnet
          </div>
        )}

        {!isConnected ? (
          <button
            className="connect-btn"
            onClick={() => connect({ connector: metaMask() })}
          >
            Connect MetaMask
          </button>
        ) : (
          <div className="wallet-row">
            <div className="wallet-addr">{shortAddr(address!)}</div>
            <button className="disconnect-btn" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
