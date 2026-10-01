import { useState } from 'react'
import { useAdmin } from '../../store/admin'
import { useUI } from '../../store/ui'
import { Card, SectionHeader, Button, Input, Field, Toggle } from '../../components/ui'

export default function Settings() {
  const { settings, updateSettings, resetDemo, log } = useAdmin()
  const { pushToast } = useUI()
  const [form, setForm] = useState({ ...settings })
  const [confirmReset, setConfirmReset] = useState(false)

  const save = () => {
    updateSettings(form)
    pushToast('Settings saved', 'Platform settings updated.')
  }

  const doReset = () => {
    resetDemo()
    setForm({ ...settings })
    pushToast('Demo reset', 'All admin data restored to seed values.')
    setConfirmReset(false)
    log('Demo data reset', 'Admin restored seed data')
  }

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-8">
      <SectionHeader title="Settings" body="Platform-wide demo configuration. Changes apply to simulated behavior only." />

      <Card>
        <h3 className="text-base font-semibold text-ink dark:text-paper">General</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Platform name" htmlFor="set-name">
            <Input id="set-name" value={form.platformName} onChange={(e) => set('platformName', e.target.value)} />
          </Field>
          <Field label="Demo trading balance (USD)" htmlFor="set-balance">
            <Input id="set-balance" type="number" min="0" value={form.demoBalance} onChange={(e) => set('demoBalance', Number(e.target.value))} />
          </Field>
        </div>
        <div className="mt-4 space-y-3">
          <Toggle label="Maintenance mode (shows banner, blocks demo actions)" checked={form.maintenanceMode} onChange={() => set('maintenanceMode', !form.maintenanceMode)} />
          <Toggle label="Allow new signups" checked={form.allowSignups} onChange={() => set('allowSignups', !form.allowSignups)} />
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-ink dark:text-paper">Fees & limits</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Trading fee %" htmlFor="set-fee">
            <Input id="set-fee" type="number" min="0" step="0.01" value={form.tradingFeePct} onChange={(e) => set('tradingFeePct', Number(e.target.value))} />
          </Field>
          <Field label="Withdrawal fee (USD)" htmlFor="set-wfee">
            <Input id="set-wfee" type="number" min="0" step="0.01" value={form.withdrawalFeeUSD} onChange={(e) => set('withdrawalFeeUSD', Number(e.target.value))} />
          </Field>
          <Field label="Min deposit (USD)" htmlFor="set-mindep">
            <Input id="set-mindep" type="number" min="0" value={form.minDepositUSD} onChange={(e) => set('minDepositUSD', Number(e.target.value))} />
          </Field>
        </div>
        <div className="mt-6">
          <Button onClick={save}>Save settings</Button>
        </div>
      </Card>

      <Card className="!border-red-200 dark:!border-red-900/40">
        <h3 className="text-base font-semibold text-red-700 dark:text-red-400">Danger zone</h3>
        <p className="mt-2 text-sm text-muted">
          Reset all admin demo data (users, assets, plans, vehicles, giveaways) back to the original seed values.
          Your personal wallet and portfolio are not affected.
        </p>
        {!confirmReset ? (
          <Button onClick={() => setConfirmReset(true)} className="!bg-red-600 mt-4">Reset demo data</Button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-ink dark:text-paper">Are you sure? This cannot be undone.</p>
            <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button size="sm" onClick={doReset} className="!bg-red-600">Yes, reset everything</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
