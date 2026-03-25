'use client'
import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; txHash?: string }
interface ToastCtx { addToast: (message: string, type?: Toast['type'], txHash?: string) => void }

const ToastContext = createContext<ToastCtx>({ addToast: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', txHash?: string) => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type, txHash }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' ? '✓ ' : t.type === 'error' ? '✕ ' : '◎ '}
            {t.message}
            {t.txHash && (
              <a
                href={`https://explorer.testnet.rsk.co/tx/${t.txHash}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', marginTop: 4, color: 'inherit', opacity: 0.7, fontSize: 10 }}
              >
                View on Explorer →
              </a>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
