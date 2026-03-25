'use client'
import React, { useMemo, useState } from 'react'
import { Header } from '@/components/wallet/Header'
import { EventFeed } from '@/components/events/EventFeed'
import { useEventLogs } from '@/hooks/useEventLogs'

function EventStats() {
  const { events, loading } = useEventLogs()
  const stats = useMemo(() => ({
    total:     events.length,
    signals:   events.filter(e => e.kind === 'SignalEmitted').length,
    reg:       events.filter(e => e.kind === 'Registered').length,
    dereg:     events.filter(e => e.kind === 'Deregistered').length,
    decay:     events.filter(e => e.kind === 'DecayCheckpointed').length,
  }), [events])

  const items = [
    { label: 'Total Events',    value: stats.total,   color: 'var(--purple2)' },
    { label: 'Signals',         value: stats.signals, color: 'var(--purple2)' },
    { label: 'Registrations',   value: stats.reg,     color: 'var(--green)'   },
    { label: 'Deregistrations', value: stats.dereg,   color: 'var(--red)'     },
    { label: 'Decay Checks',    value: stats.decay,   color: 'var(--amber)'   },
  ]

  return (
    <div className="stats-grid" style={{ marginBottom: 24 }}>
      {items.map(s => (
        <div key={s.label} className="stat-card">
          <div className="stat-label">
            <span className="stat-dot" style={{ background: s.color }} />
            {s.label}
          </div>
          {loading
            ? <div className="skeleton" />
            : <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          }
        </div>
      ))}
    </div>
  )
}

function ExportButtons() {
  const { events } = useEventLogs()

  const exportCSV = () => {
    const header = 'kind,blockNumber,txHash,address,signalId,topic,sigType,stake,timestamp\n'
    const rows = events.map(e =>
      [e.kind, e.blockNumber.toString(), e.txHash, e.address ?? '', e.signalId ?? '', e.topic ?? '', e.sigTypeLabel ?? '', e.stake ?? '', e.timestamp ?? ''].join(',')
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'signals.csv'; a.click()
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'signals.json'; a.click()
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      <button className="btn btn-cyan" style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }} onClick={exportCSV}>
        📥 Export CSV
      </button>
      <button className="btn btn-purple" style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }} onClick={exportJSON}>
        📥 Export JSON
      </button>
    </div>
  )
}

export default function EventsPage() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="hero" style={{ marginBottom: 32 }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(22px,4vw,38px)' }}>
            <span className="hero-accent">Event</span> Explorer
          </h1>
          <p className="hero-sub">
            Real-time indexing of all contract events.
            Filters, sorting, and export included.
          </p>
        </div>

        <EventStats />
        <ExportButtons />

        <div className="panel panel-wide">
          <div className="panel-head">
            <div className="panel-icon">📡</div>
            <div>
              <div className="panel-title">Live Event Stream</div>
              <div className="panel-desc">
                Sourced from viem getLogs · last 10,000 blocks · refreshes every 15s
              </div>
            </div>
          </div>
          <EventFeed />
        </div>
      </main>
    </div>
  )
}
