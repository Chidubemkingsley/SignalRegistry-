'use client'
import React, { useMemo } from 'react'
import { useEventLogs } from '@/hooks/useEventLogs'
import { Skeleton } from '@/components/ui'

export function StatsGrid() {
  const { events, loading } = useEventLogs()

  const stats = useMemo(() => {
    const signals      = events.filter(e => e.kind === 'SignalEmitted')
    const registered   = events.filter(e => e.kind === 'Registered')
    const deregistered = events.filter(e => e.kind === 'Deregistered')
    const support      = signals.filter(e => e.sigTypeLabel === 'SUPPORT')
    const oppose       = signals.filter(e => e.sigTypeLabel === 'OPPOSE')
    const activeUsers  = new Set(registered.map(e => e.address)).size - new Set(deregistered.map(e => e.address)).size
    const uniqueTopics = new Set(signals.map(e => e.topic)).size
    return { total: signals.length, registered: registered.length, activeUsers: Math.max(0, activeUsers), support: support.length, oppose: oppose.length, uniqueTopics }
  }, [events])

  if (loading) return (
    <div className="stats-grid">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="stat-card">
          <div className="stat-label"><span className="stat-dot" /> Loading</div>
          <Skeleton />
        </div>
      ))}
    </div>
  )

  const items = [
    { label: 'Total Signals',   value: stats.total,       sub: 'all time', dot: 'var(--purple)' },
    { label: 'Registered',      value: stats.registered,  sub: 'broadcasters', dot: 'var(--green)'  },
    { label: 'Active Users',    value: stats.activeUsers, sub: 'net active',   dot: 'var(--cyan)'   },
    { label: 'Support',         value: stats.support,     sub: `${stats.oppose} oppose`, dot: 'var(--green)'  },
    { label: 'Unique Topics',   value: stats.uniqueTopics, sub: 'hashed topics', dot: 'var(--amber)'  },
  ]

  return (
    <div className="stats-grid">
      {items.map(s => (
        <div key={s.label} className="stat-card">
          <div className="stat-label">
            <span className="stat-dot" style={{ background: s.dot }} />
            {s.label}
          </div>
          <div className="stat-value">{s.value}</div>
          <div className="stat-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
