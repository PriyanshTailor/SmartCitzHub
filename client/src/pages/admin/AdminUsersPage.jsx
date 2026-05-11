import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiFetch('/api/admin/users')

        const filtered = filter === 'all'
          ? data
          : (data || []).filter((u) => u.user_type === filter)

        setUsers(filtered || [])
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [filter])

  const userTypeColors = {
    citizen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    official: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  }

  const typeEmojis = {
    citizen: '👤',
    official: '🏛️',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and roles across the platform.
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'citizen', 'official'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === type
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            {type === 'all' ? 'All Users' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">
          Loading users...
        </Card>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No users found.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">User</th>
                  <th className="text-left px-6 py-3 font-semibold">Email</th>
                  <th className="text-left px-6 py-3 font-semibold">Role</th>
                  <th className="text-left px-6 py-3 font-semibold">Joined</th>
                  <th className="text-left px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {user.full_name?.charAt(0) || 'U'}
                        </div>
                        <span className="font-medium">{user.full_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={userTypeColors[user.user_type] || userTypeColors.citizen}>
                        {typeEmojis[user.user_type]} {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <Button variant="ghost" size="sm" disabled>
                        View
                      </Button>
                      <Button variant="ghost" size="sm" disabled>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-muted-foreground text-sm mb-1">Total Users</p>
          <p className="text-3xl font-bold">{users.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm mb-1">Citizens</p>
          <p className="text-3xl font-bold text-blue-600">
            {users.filter((u) => u.user_type === 'citizen').length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm mb-1">Officials</p>
          <p className="text-3xl font-bold text-purple-600">
            {users.filter((u) => u.user_type === 'official').length}
          </p>
        </Card>
      </div>
    </div>
  )
}
