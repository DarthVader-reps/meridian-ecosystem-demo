import { useState } from 'react'
import { useAdmin, type AdminGiveaway } from '../../store/admin'
import { useUI } from '../../store/ui'
import { uid } from '../../lib/market'
import { Card, SectionHeader, Badge, Button, Input, Select, Field, Modal, EmptyState } from '../../components/ui'
import DataSourceBadge from '../../components/DataSourceBadge'

const EMPTY: AdminGiveaway = { id: '', title: '', prize: '', entries: 0, status: 'active', endsIn: '7 days' }

export default function Giveaways() {
  const { giveaways, upsertGiveaway, deleteGiveaway, pickWinner } = useAdmin()
  const { pushToast } = useUI()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminGiveaway>(EMPTY)
  const [isNew, setIsNew] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const openNew = () => {
    setEditing({ ...EMPTY, id: uid('g') })
    setIsNew(true)
    setModalOpen(true)
  }
  const openEdit = (g: AdminGiveaway) => {
    setEditing({ ...g })
    setIsNew(false)
    setModalOpen(true)
  }

  const save = () => {
    if (!editing.title.trim() || !editing.prize.trim()) {
      pushToast('Invalid giveaway', 'Title and prize are required.')
      return
    }
    upsertGiveaway(editing)
    pushToast(isNew ? 'Giveaway created' : 'Giveaway updated', editing.title)
    setModalOpen(false)
  }

  const remove = (id: string) => {
    deleteGiveaway(id)
    pushToast('Giveaway removed', id)
    setConfirmDelete(null)
  }

  const draw = (g: AdminGiveaway) => {
    pickWinner(g.id)
    pushToast('Winner picked', `Winner drawn for "${g.title}"`)
  }

  const active = giveaways.filter((g) => g.status === 'active')
  const past = giveaways.filter((g) => g.status === 'past')

  const renderCard = (g: AdminGiveaway) => (
    <Card key={g.id}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink dark:text-paper">{g.title}</h3>
          <p className="mt-1 text-sm text-muted">{g.prize}</p>
        </div>
        <Badge tone={g.status === 'active' ? 'green' : 'neutral'}>{g.status}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs text-muted">Entries</dt><dd className="font-mono font-semibold">{g.entries.toLocaleString()}</dd></div>
        <div>
          <dt className="text-xs text-muted">{g.status === 'active' ? 'Ends in' : 'Winner'}</dt>
          <dd className="font-medium">{g.status === 'active' ? (g.endsIn ?? '—') : (g.winner ?? '—')}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {g.status === 'active' && <Button size="sm" onClick={() => draw(g)}>Pick winner</Button>}
        <Button size="sm" variant="secondary" onClick={() => openEdit(g)}>Edit</Button>
        <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(g.id)} className="!text-red-600">Delete</Button>
      </div>
    </Card>
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeader title="Giveaways" body="Create draws, edit prizes, and pick winners from entries." />
        <div className="flex items-center gap-3">
          <DataSourceBadge live={false} />
          <Button onClick={openNew}>New giveaway</Button>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-base font-semibold text-ink dark:text-paper">Active ({active.length})</h2>
        {active.length === 0 ? (
          <Card><EmptyState title="No active giveaways" body="Create one to get started." action={<Button onClick={openNew}>New giveaway</Button>} /></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{active.map(renderCard)}</div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-ink dark:text-paper">Past ({past.length})</h2>
        {past.length === 0 ? (
          <Card><EmptyState title="No past giveaways" body="Completed draws will appear here." /></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{past.map(renderCard)}</div>
        )}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={isNew ? 'New giveaway' : `Edit ${editing.title}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="gw-title">
            <Input id="gw-title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Spring portfolio boost" />
          </Field>
          <Field label="Prize" htmlFor="gw-prize">
            <Input id="gw-prize" value={editing.prize} onChange={(e) => setEditing({ ...editing, prize: e.target.value })} placeholder="$5,000 credit" />
          </Field>
          <Field label="Ends in" htmlFor="gw-ends">
            <Input id="gw-ends" value={editing.endsIn ?? ''} onChange={(e) => setEditing({ ...editing, endsIn: e.target.value })} placeholder="7 days" />
          </Field>
          <Field label="Status" htmlFor="gw-status">
            <Select id="gw-status" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as 'active' | 'past' })}>
              <option value="active">Active</option>
              <option value="past">Past</option>
            </Select>
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={save}>{isNew ? 'Create giveaway' : 'Save changes'}</Button>
        </div>
      </Modal>

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete giveaway?">
        <p className="text-sm text-muted">Remove this giveaway? This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button onClick={() => confirmDelete && remove(confirmDelete)} className="!bg-red-600">Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
