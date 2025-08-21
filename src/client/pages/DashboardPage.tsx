import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import type { User, FileSharingLink, AuditLog, PaginatedResponse } from '@/shared/types'

export default function DashboardPage() {
  const [isInjectingAttack, setIsInjectingAttack] = useState(false)
  const [attackMessage, setAttackMessage] = useState<string | null>(null)
  
  const { logout } = useAuth()
  const { data: usersData } = useApi<PaginatedResponse<User>>('/api/users?limit=5')
  const { data: filesData } = useApi<PaginatedResponse<FileSharingLink>>('/api/files?limit=5')
  const { data: auditData } = useApi<PaginatedResponse<AuditLog>>('/api/audit-logs?limit=10')

  const handleInjectAttack = async () => {
    setIsInjectingAttack(true)
    setAttackMessage(null)
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/audit-logs/inject-attack', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        logout()
        return
      }
      
      const result = await response.json()
      
      if (result.success) {
        setAttackMessage(result.data.message)
      } else {
        setAttackMessage('Failed to inject attack')
      }
    } catch {
      setAttackMessage('Error injecting attack')
    } finally {
      setIsInjectingAttack(false)
    }
  }

  const stats = [
    {
      name: 'Total Users',
      value: usersData?.pagination.total || 0,
      description: 'Registered users in the system'
    },
    {
      name: 'File Shares',
      value: filesData?.pagination.total || 0,
      description: 'Active file sharing links'
    },
    {
      name: 'Recent Events',
      value: auditData?.data.length || 0,
      description: 'Audit events in the last hour'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your simulated file sharing application
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stat.value.toLocaleString()}
                  </dd>
                  <dd className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Users</h2>
          {usersData ? (
            <div className="space-y-3">
              {usersData.data.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Event Generation Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Events Per Second</h3>
                <p className="text-lg font-semibold text-blue-600">2</p>
                <p className="text-xs text-gray-500">Random audit events generated continuously</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Log Retention</h3>
                <p className="text-lg font-semibold text-green-600">30 days</p>
                <p className="text-xs text-gray-500">Old logs automatically cleaned up</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Event Distribution</h3>
                <div className="text-sm text-gray-600">
                  <p>• Downloads: 50%</p>
                  <p>• Logins: 30%</p>
                  <p>• Failed Downloads: 10%</p>
                  <p>• Failed Logins: 10%</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Attack Simulation</h3>
                <button
                  onClick={handleInjectAttack}
                  disabled={isInjectingAttack}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isInjectingAttack ? 'Injecting...' : 'Inject Attack'}
                </button>
                {attackMessage && (
                  <p className="text-xs text-gray-600 mt-1">{attackMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Purpose</h3>
            <p className="text-sm text-gray-600">
              This is a simulated file sharing application designed for security testing and 
              analysis. It generates synthetic data and audit logs to mimic a real SaaS platform.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• User management with role-based access</li>
              <li>• File sharing link simulation</li>
              <li>• Real-time audit log generation</li>
              <li>• Global security settings</li>
              <li>• REST API with 
                <a 
                  href="/api-docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                >
                  OpenAPI documentation
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}