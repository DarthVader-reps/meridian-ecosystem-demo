import { useState } from 'react'
import { useAdmin, type AdminUser } from '../../store/admin'
import { useUI } from '../../store/ui'
import { Card, SectionHeader, Badge, Input, Select, Button, EmptyState } from '../../components/ui'

export default function Users() {
  const { users, updateUserStatus, updateUserTier } = useAdmin()
  const { pushToast } = useUI()
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState('all')

  const filtered = users.filter((u) => {
    const q = query.toLowerCase()
    const matchesQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchesTier = tierFilter === 'all' || u.tier === tierFilter
    return matchesQ && matchesTier
  })

  const toggleStatus = (u: AdminUser) => {
    const next = u.status === 'active' ? 'suspended' : 'active'
    updateUserStatus(u.id, next)
    pushToast(next === 'suspended' ? 'User suspended' : 'User reactivated', u.name)
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Users" body={`${users.length} demo accounts. Suspend or change tiers — changes apply to simulated data only.`} />

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
          aria-label="Search users"
        />
        <Select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} aria-label="Filter by tier">
          <option value="all">All tiers</option>
          <option value="Standard">Standard</option>
          <option value="Plus">Plus</option>
          <option value="Elite">Elite</option>
        </Select>
      </div>

      <Card className="!p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="No users found" body="Try a different search or tier filter." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted dark:border-[#2a2a2d]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0 dark:border-[#2a2a2d]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink dark:text-paper">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.tier}
                        onChange={(e) => {
                          updateUserTier(u.id, e.target.value as AdminUser['tier'])
                          pushToast('Tier updated', `${u.name} → ${e.target.value}`)
                        }}
                        aria-label={`Tier for ${u.name}`}
                        className="!w-auto !py-1 text-xs"
                      >
                        <option value="Standard">Standard</option>
                        <option value="Plus">Plus</option>
                        <option value="Elite">Elite</option>
                      </Select>
                    </td>
                    <td className="px-4 py-3 font-mono text-ink dark:text-paper">
                      ${u.balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.status === 'active' ? 'green' : 'red'}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{u.joined}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={u.status === 'active' ? 'secondary' : 'primary'}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
