import React from 'react'

const isPreview = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENV === 'preview'

export default function Settings() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      {isPreview ? (
        <div className="rounded-md border p-3">
          <p className="text-sm opacity-80">
            Binance API keys are managed server-side in preview. No keys are shown or stored in the browser.
          </p>
        </div>
      ) : (
        <div className="rounded-md border p-3">
          <p className="text-sm opacity-80">
            Production environment detected. Keys remain server-side and are never rendered in the client.
          </p>
        </div>
      )}
    </div>
  )
}