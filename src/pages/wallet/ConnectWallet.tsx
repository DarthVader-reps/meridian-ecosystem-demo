import { useState } from 'react'
import { Page } from '../../components/layout'
import { Button, Card, Modal } from '../../components/ui'
import { useUI } from '../../store/ui'

const OPTIONS = [
  { id: 'demo', name: 'Meridian wallet', desc: 'The built-in simulated wallet.' },
  { id: 'extension', name: 'Browser extension (simulated)', desc: 'Simulated browser extension dialog.' },
  { id: 'hardware', name: 'Hardware (simulated)', desc: 'Simulated hardware wallet dialog.' },
]

export default function ConnectWallet() {
  const { pushToast } = useUI()
  const [open, setOpen] = useState(false)
  const [connected, setConnected] = useState(false)

  function connect(optionName: string) {
    setOpen(false)
    setConnected(true)
    pushToast('Wallet connected (simulated)', `${optionName} connected. No real blockchain calls.`)
  }

  function disconnect() {
    setConnected(false)
    pushToast('Wallet disconnected (simulated)', 'The simulated connection was removed.')
  }

  return (
    <Page title="Connect wallet" intro="Link a simulated wallet to Meridian. All money is simulated." disclaimer>
      <Card className="max-w-xl">
        {connected ? (
          <div className="space-y-4">
            <p className="text-lg font-semibold text-ink dark:text-paper">Wallet connected</p>
            <div className="rounded-xl bg-mist dark:bg-ink px-4 py-3">
              <p className="text-xs text-muted">Connected address</p>
              <p className="mt-1 font-mono text-sm font-medium text-ink dark:text-paper">0xdemo…84f2</p>
            </div>
            <p className="text-sm text-muted">Simulated dialog. No real blockchain calls.</p>
            <Button variant="secondary" onClick={disconnect}>Disconnect</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-semibold text-ink dark:text-paper">Link a wallet</p>
            <p className="text-sm text-muted">
              Connecting a wallet in this demo opens a simulated dialog only. No real blockchain calls are made,
              and no real assets move.
            </p>
            <Button onClick={() => setOpen(true)}>Connect wallet</Button>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Choose a wallet">
        <p className="text-sm text-muted">Simulated dialog. No real blockchain calls.</p>
        <div className="mt-4 space-y-2">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => connect(o.name)}
              className="w-full rounded-xl border border-line dark:border-[#2a2a2d] px-4 py-3 text-left hover:bg-mist dark:hover:bg-ink cursor-pointer"
            >
              <span className="block text-sm font-semibold text-ink dark:text-paper">{o.name}</span>
              <span className="block text-xs text-muted">{o.desc}</span>
            </button>
          ))}
        </div>
      </Modal>
    </Page>
  )
}
