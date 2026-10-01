import { useState } from 'react'
import { useAdmin, type AdminPlan } from '../../store/admin'
import { useUI } from '../../store/ui'
import { uid } from '../../lib/market'
import { Card, SectionHeader, Badge, Button, Input, Select, Field, Modal, EmptyState } from '../../components/ui'
import DataSourceBadge from '../../components/DataSourceBadge'

const EMPTY: AdminPlan = {
  id: '',
  name: '',
  minAmount: 100,
  riskLevel: 'Low',
  term: 'Flexible',
  tagline: '',
  returnRange: [2, 5],
}

export default function Plans() {
  const { plans, upsertPlan, deletePlan } = useAdmin()
  const { pushToast } = useUI()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPlan>(EMPTY)
  const [isNew, setIsNew] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const openNew = () => {
    setEditing({ ...EMPTY, id: uid('plan') })
    setIsNew(true)
    setModalOpen(true)
  }
  const openEdit = (p: AdminPlan) => {
    setEditing({ ...p, returnRange: [p.returnRange[0], p.returnRange[1]] })
    setIsNew(false)
    setModalOpen(true)
  }

  const save = () => {
    if (!editing.name.trim() || editing.minAmount <= 0) {
      pushToast('Invalid plan', 'Name and a positive minimum amount are required.')
      return
    }
    upsertPlan(editing)
    pushToast(isNew ? 'Plan added' : 'Plan updated', editing.name)
    setModalOpen(false)
  }

  const remove = (id: string) => {
    deletePlan(id)
    pushToast('Plan removed', id)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeader title="Investment plans" body={`${plans.length} plans. Returns shown are simulated ranges, never guarantees.`} />
        <div className="flex items-center gap-3">
          <DataSourceBadge live={false} />
          <Button onClick={openNew}>Add plan</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.length === 0 && (
          <Card><EmptyState title="No plans" body="Add your first investment plan." action={<Button onClick={openNew}>Add plan</Button>} /></Card>
        )}
        {plans.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink dark:text-paper">{p.name}</h3>
                <p className="mt-1 text-sm text-muted">{p.tagline}</p>
              </div>
              <Badge tone={p.riskLevel === 'Low' ? 'green' : p.riskLevel === 'Medium' ? 'amber' : 'red'}>{p.riskLevel}</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><dt className="text-xs text-muted">Min</dt><dd className="font-mono font-semibold">${p.minAmount.toLocaleString()}</dd></div>
              <div><dt className="text-xs text-muted">Term</dt><dd className="font-medium">{p.term}</dd></div>
              <div><dt className="text-xs text-muted">Return range</dt><dd className="font-mono">{p.returnRange[0]}–{p.returnRange[1]}%</dd></div>
            </dl>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>Edit</Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(p.id)} className="!text-red-600">Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={isNew ? 'Add plan' : `Edit ${editing.name}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="plan-name">
            <Input id="plan-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Starter" />
          </Field>
          <Field label="Tagline" htmlFor="plan-tagline">
            <Input id="plan-tagline" value={editing.tagline} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} placeholder="A calm first step…" />
          </Field>
          <Field label="Min amount (USD)" htmlFor="plan-min">
            <Input id="plan-min" type="number" min="0" value={editing.minAmount} onChange={(e) => setEditing({ ...editing, minAmount: Number(e.target.value) })} />
          </Field>
          <Field label="Risk level" htmlFor="plan-risk">
            <Select id="plan-risk" value={editing.riskLevel} onChange={(e) => setEditing({ ...editing, riskLevel: e.target.value })}>
              <option>Low</option><option>Medium</option><option>High</option>
            </Select>
          </Field>
          <Field label="Term" htmlFor="plan-term">
            <Input id="plan-term" value={editing.term} onChange={(e) => setEditing({ ...editing, term: e.target.value })} placeholder="Flexible" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Return min %" htmlFor="plan-rmin">
              <Input id="plan-rmin" type="number" value={editing.returnRange[0]} onChange={(e) => setEditing({ ...editing, returnRange: [Number(e.target.value), editing.returnRange[1]] })} />
            </Field>
            <Field label="Return max %" htmlFor="plan-rmax">
              <Input id="plan-rmax" type="number" value={editing.returnRange[1]} onChange={(e) => setEditing({ ...editing, returnRange: [editing.returnRange[0], Number(e.target.value)] })} />
            </Field>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">Return ranges are simulated projections for the demo, never guaranteed.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={save}>{isNew ? 'Add plan' : 'Save changes'}</Button>
        </div>
      </Modal>

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete plan?">
        <p className="text-sm text-muted">Remove this plan? This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button onClick={() => confirmDelete && remove(confirmDelete)} className="!bg-red-600">Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
