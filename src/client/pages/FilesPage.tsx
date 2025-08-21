import { useState } from 'react'
import { usePaginatedApi, useApiMutation, useApi } from '../hooks/useApi'
import type { FileSharingLink, User, FileType, PaginatedResponse } from '@/shared/types'

export default function FilesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { data: files, loading, error, refresh, loadMore, hasMore } = usePaginatedApi<FileSharingLink>('/api/files')
  const { data: usersData } = useApi<PaginatedResponse<User>>('/api/users?limit=100')
  const { mutate, loading: mutateLoading } = useApiMutation<FileSharingLink>()

  const handleToggleFile = async (file: FileSharingLink, field: 'hasPassword' | 'active') => {
    try {
      await mutate(`/api/files/${file.id}`, {
        method: 'PUT',
        body: { [field]: !file[field] }
      })
      refresh()
    } catch (error) {
      console.error('Error updating file:', error)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    
    try {
      await mutate(`/api/files/${fileId}`, { method: 'DELETE' })
      refresh()
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const CreateFileForm = () => {
    const [ownerId, setOwnerId] = useState('')
    const [fileName, setFileName] = useState('')
    const [fileType, setFileType] = useState<FileType>('pdf')
    const [hasPassword, setHasPassword] = useState(false)
    const [expiryDate, setExpiryDate] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        await mutate('/api/files', {
          method: 'POST',
          body: { ownerId, fileName, fileType, hasPassword, expiryDate: expiryDate || null }
        })
        setShowCreateForm(false)
        setOwnerId('')
        setFileName('')
        setFileType('pdf')
        setHasPassword(false)
        setExpiryDate('')
        refresh()
      } catch (error) {
        console.error('Error creating file:', error)
      }
    }

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create File Sharing Link</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner</label>
              <select
                required
                className="input mt-1"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
              >
                <option value="">Select owner...</option>
                {usersData?.data.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">File Name</label>
              <input
                type="text"
                required
                className="input mt-1"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name or leave blank for GUID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">File Type</label>
              <select
                className="input mt-1"
                value={fileType}
                onChange={(e) => setFileType(e.target.value as FileType)}
              >
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel</option>
                <option value="docx">Word</option>
                <option value="pptx">PowerPoint</option>
                <option value="txt">Text</option>
                <option value="csv">CSV</option>
                <option value="zip">ZIP</option>
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
                <option value="mp4">MP4</option>
              </select>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  checked={hasPassword}
                  onChange={(e) => setHasPassword(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">Password protected</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Expiry Date (optional)</label>
              <input
                type="datetime-local"
                className="input mt-1"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
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
                {mutateLoading ? 'Creating...' : 'Create File'}
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
          <h1 className="text-2xl font-bold text-gray-900">File Sharing Links</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage simulated file sharing links
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          Create File Link
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card">
        {loading && files.length === 0 ? (
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
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Password</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id}>
                    <td className="font-medium">{file.fileName}</td>
                    <td>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                        {file.fileType.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-gray-500">
                      {file.owner ? `${file.owner.firstName} ${file.owner.lastName}` : 'Unknown'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleFile(file, 'hasPassword')}
                        disabled={mutateLoading}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          file.hasPassword 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {file.hasPassword ? 'Protected' : 'Open'}
                      </button>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {file.expiryDate ? new Date(file.expiryDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleFile(file, 'active')}
                        disabled={mutateLoading}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          file.active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {file.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
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

      {showCreateForm && <CreateFileForm />}
    </div>
  )
}