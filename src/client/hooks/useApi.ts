import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { ApiResponse, PaginatedResponse } from '@/shared/types'

interface UseApiOptions {
  skip?: boolean
}

export function useApi<T>(
  url: string,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!options.skip)
  const [error, setError] = useState<string | null>(null)
  const { token, logout } = useAuth()

  const fetchData = useCallback(async () => {
    if (options.skip) return

    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url, { headers })

      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        logout()
        return
      }

      const result: ApiResponse<T> = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Request failed')
      }

      setData(result.data!)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [url, token, options.skip, logout])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function useApiMutation<TData = unknown, TVariables = unknown>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token, logout } = useAuth()

  const mutate = async (
    url: string,
    options: {
      method: 'POST' | 'PUT' | 'DELETE'
      body?: TVariables
    }
  ): Promise<TData> => {
    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })

      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        logout()
        throw new Error('Authentication failed')
      }

      const result: ApiResponse<TData> = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Request failed')
      }

      return result.data!
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}

export function usePaginatedApi<T>(
  baseUrl: string,
  initialPage = 1,
  limit = 20
) {
  const [page, setPage] = useState(initialPage)
  const [allData, setAllData] = useState<T[]>([])
  const url = `${baseUrl}?page=${page}&limit=${limit}`
  
  const { data, loading, error, refetch } = useApi<PaginatedResponse<T>>(url)

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllData(data.data)
      } else {
        setAllData(prev => [...prev, ...data.data])
      }
    }
  }, [data, page])

  const loadMore = () => {
    if (data && page < data.pagination.totalPages) {
      setPage(prev => prev + 1)
    }
  }

  const refresh = () => {
    setPage(1)
    setAllData([])
    refetch()
  }

  return {
    data: allData,
    pagination: data?.pagination,
    loading,
    error,
    loadMore,
    refresh,
    hasMore: data ? page < data.pagination.totalPages : false
  }
}