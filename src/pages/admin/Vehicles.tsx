import { useState } from 'react'
import { useAdmin, type AdminVehicle } from '../../store/admin'
import { useUI } from '../../store/ui'
import { uid } from '../../lib/market'
import { Card, SectionHeader, Badge, Button, Input, Select, Field, Modal, EmptyState } from '../../components/ui'

const EMPTY: AdminVehicle = {
  id: '',
  name: '',
  type: 'Sedan',
  price: 30000,
  rangeKm: 400,
  seats: 5,
  drivetrain: 'RWD',
  availability: 'In stock',
}

export default function Vehicles() {
  const { vehicles, upsertVehicle, deleteVehicle } = useAdmin()
  const { pushToast } = useUI()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminVehicle>(EMPTY)
  const [isNew, setIsNew] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const openNew = () => {
    setEditing({ ...EMPTY, id: uid('veh') })
    setIsNew(true)
    setModalOpen(true)
  }
  const openEdit = (v: AdminVehicle) => {
    setEditing({ ...v })
    setIsNew(false)
    setModalOpen(true)
  }

  const save = () => {
    if (!editing.name.trim() || editing.price <= 0) {
      pushToast('Invalid vehicle', 'Name and a positive price are required.')
      return
    }
    upsertVehicle(editing)
    pushToast(isNew ? 'Vehicle added' : 'Vehicle updated', editing.name)
    setModalOpen(false)
  }

  const remove = (id: string) => {
    deleteVehicle(id)
    pushToast('Vehicle removed', id)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeader title="Vehicles" body={`${vehicles.length} fictional vehicles in inventory.`} />
        <Button onClick={openNew}>Add vehicle</Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        {vehicles.length === 0 ? (
          <div className="p-8"><EmptyState title="No vehicles" body="Add your first vehicle." action={<Button onClick={openNew}>Add vehicle</Button>} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted dark:border-[#2a2a2d]">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Range</th>
                  <th className="px-4 py-3 font-medium">Availability</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-line last:border-0 dark:border-[#2a2a2d]">
                    <td className="px-4 py-3 font-medium text-ink dark:text-paper">{v.name}</td>
                    <td className="px-4 py-3 text-muted">{v.type} · {v.drivetrain}</td>
                    <td className="px-4 py-3 font-mono">${v.price.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono">{v.rangeKm} km</td>
                    <td className="px-4 py-3">
                      <Badge tone={v.availability === 'In stock' ? 'green' : v.availability === 'Low stock' ? 'amber' : 'neutral'}>
                        {v.availability}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(v)}>Edit</Button>
                        <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(v.id)} className="!text-red-600">Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={isNew ? 'Add vehicle' : `Edit ${editing.name}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="veh-name">
            <Input id="veh-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Aero One" />
          </Field>
          <Field label="Type" htmlFor="veh-type">
            <Select id="veh-type" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
              <option>Sedan</option><option>SUV</option><option>Wagon</option><option>Hatchback</option><option>Coupe</option>
            </Select>
          </Field>
          <Field label="Price (USD)" htmlFor="veh-price">
            <Input id="veh-price" type="number" min="0" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
          </Field>
          <Field label="Range (km)" htmlFor="veh-range">
            <Input id="veh-range" type="number" min="0" value={editing.rangeKm} onChange={(e) => setEditing({ ...editing, rangeKm: Number(e.target.value) })} />
          </Field>
          <Field label="Seats" htmlFor="veh-seats">
            <Input id="veh-seats" type="number" min="1" max="9" value={editing.seats} onChange={(e) => setEditing({ ...editing, seats: Number(e.target.value) })} />
          </Field>
          <Field label="Drivetrain" htmlFor="veh-drive">
            <Select id="veh-drive" value={editing.drivetrain} onChange={(e) => setEditing({ ...editing, drivetrain: e.target.value })}>
              <option>FWD</option><option>RWD</option><option>AWD</option>
            </Select>
          </Field>
          <Field label="Availability" htmlFor="veh-avail">
            <Select id="veh-avail" value={editing.availability} onChange={(e) => setEditing({ ...editing, availability: e.target.value })}>
              <option>In stock</option><option>Low stock</option><option>Pre-order</option><option>Sold out</option>
            </Select>
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={save}>{isNew ? 'Add vehicle' : 'Save changes'}</Button>
        </div>
      </Modal>

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete vehicle?">
        <p className="text-sm text-muted">Remove this vehicle from inventory? This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button onClick={() => confirmDelete && remove(confirmDelete)} className="!bg-red-600">Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
