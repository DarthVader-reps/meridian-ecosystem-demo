import { useState } from 'react'
import { useAdmin, type AdminAsset } from '../../store/admin'
import { useUI } from '../../store/ui'
import { Card, SectionHeader, Badge, Button, Input, Select, Field, Modal, EmptyState } from '../../components/ui'

const EMPTY: AdminAsset = { symbol: '', name: '', price: 0, changePct: 0, type: 'stock', sector: '', currency: 'USD' }

export default function Assets() {
  const { assets, upsertAsset, deleteAsset } = useAdmin()
  const { pushToast } = useUI()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminAsset>(EMPTY)
  const [isNew, setIsNew] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const openNew = () => {
    setEditing(EMPTY)
    setIsNew(true)
    setModalOpen(true)
  }
  const openEdit = (a: AdminAsset) => {
    setEditing({ ...a })
    setIsNew(false)
    setModalOpen(true)
  }

  const save = () => {
    if (!editing.symbol.trim() || !editing.name.trim() || editing.price <= 0) {
      pushToast('Invalid asset', 'Symbol, name, and a positive price are required.')
      return
    }
    upsertAsset({ ...editing, symbol: editing.symbol.toUpperCase().trim() })
    pushToast(isNew ? 'Asset added' : 'Asset updated', editing.symbol.toUpperCase())
    setModalOpen(false)
  }

  const remove = (symbol: string) => {
    deleteAsset(symbol)
    pushToast('Asset removed', symbol)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeader title="Assets" body={`${assets.length} tradeable assets. Add, edit, or remove listings.`} />
        <Button onClick={openNew}>Add asset</Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        {assets.length === 0 ? (
          <div className="p-8"><EmptyState title="No assets" body="Add your first tradeable asset." action={<Button onClick={openNew}>Add asset</Button>} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted dark:border-[#2a2a2d]">
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Change</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.symbol} className="border-b border-line last:border-0 dark:border-[#2a2a2d]">
                    <td className="px-4 py-3 font-mono font-semibold text-ink dark:text-paper">{a.symbol}</td>
                    <td className="px-4 py-3 text-ink dark:text-paper">{a.name}</td>
                    <td className="px-4 py-3"><Badge tone="neutral">{a.type}</Badge></td>
                    <td className="px-4 py-3 font-mono">${a.price.toLocaleString()}</td>
                    <td className={`px-4 py-3 font-mono ${a.changePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {a.changePct >= 0 ? '+' : ''}{a.changePct}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(a)}>Edit</Button>
                        <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(a.symbol)} className="!text-red-600">Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={isNew ? 'Add asset' : `Edit ${editing.symbol}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Symbol" htmlFor="asset-symbol">
            <Input id="asset-symbol" value={editing.symbol} onChange={(e) => setEditing({ ...editing, symbol: e.target.value })} disabled={!isNew} placeholder="AAPL" />
          </Field>
          <Field label="Name" htmlFor="asset-name">
            <Input id="asset-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Apple Inc." />
          </Field>
          <Field label="Type" htmlFor="asset-type">
            <Select id="asset-type" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
              <option value="etf">ETF</option>
              <option value="index">Index</option>
            </Select>
          </Field>
          <Field label="Sector" htmlFor="asset-sector">
            <Input id="asset-sector" value={editing.sector ?? ''} onChange={(e) => setEditing({ ...editing, sector: e.target.value })} placeholder="Technology" />
          </Field>
          <Field label="Price (USD)" htmlFor="asset-price">
            <Input id="asset-price" type="number" min="0" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
          </Field>
          <Field label="Change %" htmlFor="asset-change">
            <Input id="asset-change" type="number" step="0.1" value={editing.changePct} onChange={(e) => setEditing({ ...editing, changePct: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={save}>{isNew ? 'Add asset' : 'Save changes'}</Button>
        </div>
      </Modal>

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete asset?">
        <p className="text-sm text-muted">
          Remove <span className="font-mono font-semibold text-ink dark:text-paper">{confirmDelete}</span> from listings? This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button onClick={() => confirmDelete && remove(confirmDelete)} className="!bg-red-600">Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
