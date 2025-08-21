import { useState } from 'react'
import { usePaginatedApi } from '../hooks/useApi'
import type { AuditLog, EventType } from '@/shared/types'

export default function AuditLogsPage() {
  const [eventFilter, setEventFilter] = useState<EventType | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (eventFilter) params.append('eventType', eventFilter)
    if (startDate) params.append('startDate', new Date(startDate).toISOString())
    if (endDate) params.append('endDate', new Date(endDate).toISOString())
    return `/api/audit-logs?${params.toString()}`
  }

  const { data: logs, loading, error, refresh, loadMore, hasMore } = usePaginatedApi<AuditLog>(buildUrl())

  const getEventTypeColor = (eventType: EventType) => {
    switch (eventType) {
      case 'login':
        return 'bg-green-100 text-green-800'
      case 'download':
        return 'bg-blue-100 text-blue-800'
      case 'failedLogin':
        return 'bg-red-100 text-red-800'
      case 'failedDownload':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatEventType = (eventType: EventType) => {
    return eventType.replace(/([A-Z])/g, ' $1').toLowerCase()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor system activity and security events
        </p>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              className="input"
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value as EventType | '')
                refresh()
              }}
            >
              <option value="">All Events</option>
              <option value="login">Login</option>
              <option value="download">Download</option>
              <option value="failedLogin">Failed Login</option>
              <option value="failedDownload">Failed Download</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="datetime-local"
              className="input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                refresh()
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="datetime-local"
              className="input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                refresh()
              }}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setEventFilter('')
                setStartDate('')
                setEndDate('')
                refresh()
              }}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card">
        {loading && logs.length === 0 ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg font-medium">No audit logs found</p>
              <p className="text-sm mt-1">Try adjusting your filters or wait for new events to be generated</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>User</th>
                  <th>File</th>
                  <th>IP Address</th>
                  <th>User Agent</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getEventTypeColor(log.eventType)
                      }`}>
                        {formatEventType(log.eventType)}
                      </span>
                    </td>
                    <td className="text-sm">
                      {log.user ? (
                        <div>
                          <div className="font-medium">{log.user.firstName} {log.user.lastName}</div>
                          <div className="text-gray-500">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Anonymous</span>
                      )}
                    </td>
                    <td className="text-sm">
                      {log.file ? (
                        <div>
                          <div className="font-medium">{log.file.fileName}</div>
                          <div className="text-gray-500">{log.file.fileType.toUpperCase()}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="text-sm font-mono">{log.ipAddress}</td>
                    <td className="text-sm max-w-xs truncate" title={log.userAgent}>
                      {log.userAgent}
                    </td>
                    <td className="text-sm text-gray-600">{log.details || 'N/A'}</td>
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
    </div>
  )
}