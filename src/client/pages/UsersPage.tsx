import { useState } from 'react'
import { usePaginatedApi, useApiMutation } from '../hooks/useApi'
import type { User, UserRole } from '@/shared/types'

export default function UsersPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { data: users, loading, error, refresh, loadMore, hasMore } = usePaginatedApi<User>('/api/users')
  const { mutate, loading: mutateLoading } = useApiMutation<User>()

  const handleToggleUser = async (user: User, field: keyof Pick<User, 'mfaEnabled' | 'allowLocalLogin' | 'allowIdpLogin' | 'active'>) => {
    try {
      await mutate(`/api/users/${user.id}`, {
        method: 'PUT',
        body: { [field]: !user[field] }
      })
      refresh()
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      await mutate(`/api/users/${userId}`, { method: 'DELETE' })
      refresh()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const CreateUserForm = () => {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [role, setRole] = useState<UserRole>('user')

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        await mutate('/api/users', {
          method: 'POST',
          body: { firstName, lastName, role }
        })
        setShowCreateForm(false)
        setFirstName('')
        setLastName('')
        setRole('user')
        refresh()
      } catch (error) {
        console.error('Error creating user:', error)
      }
    }

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                required
                className="input mt-1"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                required
                className="input mt-1"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                className="input mt-1"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="user">User</option>
                <option value="guest">Guest</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutateLoading}
                className="btn btn-primary"
              >
                {mutateLoading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          Create User
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card">
        {loading && users.length === 0 ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>MFA</th>
                  <th>Local Login</th>
                  <th>IdP Login</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="text-gray-500">{user.email}</td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' || user.role === 'superadmin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleUser(user, 'mfaEnabled')}
                        disabled={mutateLoading}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          user.mfaEnabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                          user.mfaEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleUser(user, 'allowLocalLogin')}
                        disabled={mutateLoading}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          user.allowLocalLogin ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                          user.allowLocalLogin ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleUser(user, 'allowIdpLogin')}
                        disabled={mutateLoading}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          user.allowIdpLogin ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                          user.allowIdpLogin ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleUser(user, 'active')}
                        disabled={mutateLoading}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={mutateLoading}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {showCreateForm && <CreateUserForm />}
    </div>
  )
}