import { useState, useEffect } from 'react'
import { useApi, useApiMutation } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import type { GlobalSettings, SharingLevel } from '@/shared/types'

export default function SettingsPage() {
  const { logout } = useAuth()
  const { data: settings, loading, error, refetch } = useApi<GlobalSettings>('/api/settings')
  const { mutate, loading: mutateLoading } = useApiMutation<GlobalSettings>()
  
  const [allowedIpRanges, setAllowedIpRanges] = useState<string[]>([])
  const [forceIdpLogin, setForceIdpLogin] = useState(false)
  const [sharingLevel, setSharingLevel] = useState<SharingLevel>('allowPasswords')
  const [newIpRange, setNewIpRange] = useState('')
  const [apiToken, setApiToken] = useState<string | null>(null)
  const [tokenExpiry, setTokenExpiry] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    if (settings) {
      setAllowedIpRanges(settings.allowedIpRanges)
      setForceIdpLogin(settings.forceIdpLogin)
      setSharingLevel(settings.sharingLevel)
    }
  }, [settings])

  const handleSave = async () => {
    try {
      await mutate('/api/settings', {
        method: 'PUT',
        body: {
          allowedIpRanges,
          forceIdpLogin,
          sharingLevel
        }
      })
      refetch()
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const addIpRange = () => {
    if (newIpRange && !allowedIpRanges.includes(newIpRange)) {
      setAllowedIpRanges([...allowedIpRanges, newIpRange])
      setNewIpRange('')
    }
  }

  const removeIpRange = (index: number) => {
    setAllowedIpRanges(allowedIpRanges.filter((_, i) => i !== index))
  }

  const generateApiToken = async () => {
    try {
      const response = await fetch('/api/auth/api-token', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        logout()
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setApiToken(data.data.token)
          setTokenExpiry(data.data.expiresAt)
          setShowToken(true)
        }
      }
    } catch (error) {
      console.error('Failed to generate API token:', error)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Global Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure global security and sharing policies
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">IP Access Control</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed IP Ranges (CIDR notation)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g., 192.168.1.0/24"
                  className="input flex-1"
                  value={newIpRange}
                  onChange={(e) => setNewIpRange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIpRange()}
                />
                <button
                  onClick={addIpRange}
                  className="btn btn-secondary"
                >
                  Add
                </button>
              </div>
            </div>
            
            {allowedIpRanges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Current IP Ranges:</h3>
                <div className="space-y-2">
                  {allowedIpRanges.map((range, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="font-mono text-sm">{range}</span>
                      <button
                        onClick={() => removeIpRange(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {allowedIpRanges.length === 0 && (
              <div className="text-sm text-gray-500 italic">
                No IP restrictions configured. All IPs are allowed.
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Authentication Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  checked={forceIdpLogin}
                  onChange={(e) => setForceIdpLogin(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Force Identity Provider (IdP) Login
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, users must authenticate through an identity provider instead of local credentials.
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">File Sharing Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Policy for Shared Files
              </label>
              <select
                className="input"
                value={sharingLevel}
                onChange={(e) => setSharingLevel(e.target.value as SharingLevel)}
              >
                <option value="doNotAllowPasswords">Do Not Allow Passwords</option>
                <option value="allowPasswords">Allow Optional Passwords</option>
                <option value="forcePasswords">Force Password Protection</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                {sharingLevel === 'doNotAllowPasswords' && 'Files cannot be password protected'}
                {sharingLevel === 'allowPasswords' && 'Users can optionally add password protection'}
                {sharingLevel === 'forcePasswords' && 'All shared files must be password protected'}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">API Access</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Generate a bearer token for API access. Use this token in the Authorization header: <code className="bg-gray-100 px-1 rounded">Bearer YOUR_TOKEN</code>
              </p>
              
              {!showToken ? (
                <button
                  onClick={generateApiToken}
                  className="btn btn-secondary"
                >
                  Generate API Token
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bearer Token
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        readOnly
                        className="input flex-1 font-mono text-xs"
                        value={apiToken || ''}
                      />
                      <button
                        onClick={() => copyToClipboard(apiToken || '')}
                        className="btn btn-secondary"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  {tokenExpiry && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(tokenExpiry).toLocaleString()}
                    </p>
                  )}
                  
                  <button
                    onClick={generateApiToken}
                    className="btn btn-secondary text-xs"
                  >
                    Regenerate Token
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-700">Last Updated</h3>
              <p className="text-gray-600">
                {settings ? new Date(settings.updatedAt).toLocaleString() : 'Unknown'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Configuration ID</h3>
              <p className="text-gray-600 font-mono">
                {settings?.id || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={mutateLoading}
            className="btn btn-primary"
          >
            {mutateLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}