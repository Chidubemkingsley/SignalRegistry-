import React from 'react'
import { Header } from '@/components/wallet/Header'
import { StatsGrid } from '@/components/contract/StatsGrid'
import { RegisterPanel } from '@/components/contract/RegisterPanel'
import { EmitSignalPanel } from '@/components/contract/EmitSignalPanel'
import { WeightLookupPanel, SilenceCheckPanel } from '@/components/contract/WeightPanel'
import { EventFeed } from '@/components/events/EventFeed'
import { CONTRACT_ADDRESS } from '@/lib/contract'

export default function DashboardPage() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        {/* Hero */}
        <div className="hero">
          <h1 className="hero-title">
            <span className="hero-accent">Signal</span>Registry
          </h1>
          <p className="hero-sub">
            Event-first, time-decay signal primitive on Rootstock.
            Stake RBTC, emit weighted opinions, watch them decay.
          </p>
        </div>

        {/* Live stats */}
        <StatsGrid />

        {/* Action panels */}
        <div className="panels" style={{ marginBottom: 18 }}>
          <RegisterPanel />
          <EmitSignalPanel />
        </div>

        <div className="panels" style={{ marginBottom: 18 }}>
          <WeightLookupPanel />
          <SilenceCheckPanel />
        </div>

        {/* Contract info */}
        <div className="panel panel-wide" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <div className="panel-icon">📋</div>
            <div>
              <div className="panel-title">Contract Info</div>
              <div className="panel-desc">Deployed on Rootstock Testnet (chainId: 31)</div>
            </div>
          </div>
          <div className="info-row">
            <span className="info-key">Contract Address</span>
            <span className="info-val">{CONTRACT_ADDRESS}</span>
          </div>
          <div className="info-row">
            <span className="info-key">Network</span>
            <span className="info-val">Rootstock Testnet · chainId 31</span>
          </div>
          <div className="info-row">
            <span className="info-key">Architecture</span>
            <span className="info-val">Event-first + State machine + Time-decay</span>
          </div>
          <div className="info-row">
            <span className="info-key">Decay Window</span>
            <span className="info-val">24 hours (86400s)</span>
          </div>
          <div className="info-row">
            <span className="info-key">Cooldown Period</span>
            <span className="info-val">5 minutes (300s)</span>
          </div>
          <div className="info-row">
            <span className="info-key">Explorer</span>
            <a
              href={`https://explorer.testnet.rsk.co/address/${CONTRACT_ADDRESS}`}
              target="_blank" rel="noopener noreferrer"
              className="info-val" style={{ textDecoration: 'none' }}
            >
              Blockscout ↗
            </a>
          </div>
        </div>

        {/* Recent events */}
        <div className="panel panel-wide">
          <div className="panel-head">
            <div className="panel-icon">📡</div>
            <div>
              <div className="panel-title">Recent Events</div>
              <div className="panel-desc">Live event feed · auto-refreshes every 15s</div>
            </div>
          </div>
          <EventFeed maxItems={10} />
        </div>
      </main>
    </div>
  )
}
