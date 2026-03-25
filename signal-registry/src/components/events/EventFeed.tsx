'use client'
import React, { useState, useMemo } from 'react'
import { useEventLogs, type ParsedEvent, type EventKind } from '@/hooks/useEventLogs'
import { DecayBar, SignalTypeBadge, shortAddr, timeAgo } from '@/components/ui'
import { BLOCKSCOUT_URL } from '@/lib/contract'

const KIND_BADGE: Record<EventKind, { cls: string; label: string; icon: string }> = {
  SignalEmitted:      { cls: 'badge-signal',       label: 'SIGNAL',       icon: '◎' },
  Registered:        { cls: 'badge-registered',    label: 'REGISTERED',   icon: '⚡' },
  Deregistered:      { cls: 'badge-deregistered',  label: 'DEREGISTERED', icon: '⛔' },
  DecayCheckpointed: { cls: 'badge-decay',         label: 'DECAY',        icon: '📉' },
}

function EventCard({ ev }: { ev: ParsedEvent }) {
  const [open, setOpen] = useState(false)
  const badge = KIND_BADGE[ev.kind]

  return (
    <div className={`event-card${open ? ' expanded' : ''}`} onClick={() => setOpen(o => !o)}>
      <div className="event-card-header">
        <span className={`event-type-badge ${badge.cls}`}>
          {badge.icon} {badge.label}
        </span>
        {ev.sigTypeLabel && <SignalTypeBadge label={ev.sigTypeLabel} />}
        <span className="event-addr" style={{ flex: 1 }}>
          {ev.address ? shortAddr(ev.address) : ev.signalId ? `#${ev.signalId}` : '—'}
        </span>
        <span className="event-time">
          {ev.timestamp ? timeAgo(ev.timestamp) : `blk ${ev.blockNumber.toString()}`}
        </span>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="event-details">
          {ev.address && (
            <div className="event-detail-item">
              <span className="event-detail-label">Broadcaster</span>
              <span className="event-detail-val">{ev.address}</span>
            </div>
          )}
          {ev.signalId && (
            <div className="event-detail-item">
              <span className="event-detail-label">Signal ID</span>
              <span className="event-detail-val">#{ev.signalId}</span>
            </div>
          )}
          {ev.topic && (
            <div className="event-detail-item">
              <span className="event-detail-label">Topic (bytes32)</span>
              <span className="event-detail-val" style={{ fontSize: 10 }}>
                {ev.topic}
              </span>
            </div>
          )}
          {ev.stake && (
            <div className="event-detail-item">
              <span className="event-detail-label">Stake</span>
              <span className="event-detail-val">{parseFloat(ev.stake).toFixed(6)} tRBTC</span>
            </div>
          )}
          {ev.timestamp && ev.stake && ev.kind === 'SignalEmitted' && (
            <div className="event-detail-item" style={{ gridColumn: '1 / -1' }}>
              <DecayBar timestamp={ev.timestamp} />
            </div>
          )}
          {ev.decayFraction && (
            <div className="event-detail-item">
              <span className="event-detail-label">Decay Fraction</span>
              <span className="event-detail-val">{(Number(ev.decayFraction) / 1e18 * 100).toFixed(2)}%</span>
            </div>
          )}
          {ev.effectiveWeight && (
            <div className="event-detail-item">
              <span className="event-detail-label">Effective Weight</span>
              <span className="event-detail-val">{parseFloat(ev.effectiveWeight).toFixed(6)} tRBTC</span>
            </div>
          )}
          <div className="event-detail-item">
            <span className="event-detail-label">Tx Hash</span>
            <a
              href={`${BLOCKSCOUT_URL}/tx/${ev.txHash}`}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ fontSize: 10, color: 'var(--purple2)', fontFamily: 'var(--mono)' }}
            >
              {ev.txHash?.slice(0,20)}… ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

interface EventFeedProps {
  maxItems?: number
  filterAddr?: string
}

export function EventFeed({ maxItems, filterAddr }: EventFeedProps) {
  const { events, loading, error, refetch } = useEventLogs()
  const [kindFilter, setKindFilter] = useState<EventKind | 'ALL'>('ALL')
  const [sigTypeFilter, setSigTypeFilter] = useState<string | 'ALL'>('ALL')
  const [searchAddr, setSearchAddr] = useState(filterAddr ?? '')

  const filtered = useMemo(() => {
    let evs = events
    if (kindFilter !== 'ALL') evs = evs.filter(e => e.kind === kindFilter)
    if (sigTypeFilter !== 'ALL') evs = evs.filter(e => e.sigTypeLabel === sigTypeFilter)
    if (searchAddr.length > 3) evs = evs.filter(e =>
      e.address?.toLowerCase().includes(searchAddr.toLowerCase())
    )
    return maxItems ? evs.slice(0, maxItems) : evs
  }, [events, kindFilter, sigTypeFilter, searchAddr, maxItems])

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          {(['ALL', 'SignalEmitted', 'Registered', 'Deregistered', 'DecayCheckpointed'] as const).map(k => (
            <button
              key={k}
              className={`filter-chip${kindFilter === k ? ' active' : ''}`}
              onClick={() => setKindFilter(k)}
            >
              {k === 'ALL' ? 'All Events' : k === 'SignalEmitted' ? 'Signals' : k === 'DecayCheckpointed' ? 'Decay' : k}
            </button>
          ))}
        </div>
        {kindFilter === 'SignalEmitted' && (
          <div className="filter-bar" style={{ margin: 0 }}>
            {(['ALL', 'SUPPORT', 'OPPOSE', 'NEUTRAL'] as const).map(s => (
              <button
                key={s}
                className={`filter-chip${sigTypeFilter === s ? ' active' : ''}`}
                onClick={() => setSigTypeFilter(s)}
              >
                {s === 'ALL' ? 'All Types' : s}
              </button>
            ))}
          </div>
        )}
        <input
          className="field-input"
          style={{ width: 'auto', flex: 1, minWidth: 200 }}
          value={searchAddr}
          onChange={e => setSearchAddr(e.target.value)}
          placeholder="Filter by address…"
        />
        <button
          className="btn btn-cyan"
          style={{ width: 'auto', padding: '8px 14px', marginTop: 0 }}
          onClick={refetch}
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          <span className="spinner" style={{ marginRight: 8 }} />
          Indexing events from chain…
        </div>
      )}
      {error && (
        <div className="status-msg status-error">{error}</div>
      )}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          No events found. Contract may be new or filters too narrow.
        </div>
      )}

      <div className="event-list">
        {filtered.map((ev, i) => <EventCard key={`${ev.txHash}-${ev.logIndex}`} ev={ev} />)}
      </div>

      {!loading && events.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
          Showing {filtered.length} of {events.length} events · Auto-refreshes every 15s
        </div>
      )}
    </div>
  )
}
