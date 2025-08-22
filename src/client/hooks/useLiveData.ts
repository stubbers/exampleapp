import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { ApiResponse } from '@/shared/types'

interface UseLiveDataOptions {
  interval?: number
  skip?: boolean
}

export function useLiveData<T>(
  url: string,
  options: UseLiveDataOptions = {}
) {
  const { interval = 5000, skip = false } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState<string | null>(null)
  const { token, logout } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    if (skip) return

    try {
      setError(null)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url, { headers })

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
  }, [url, token, skip, logout])

  useEffect(() => {
    if (skip) return

    fetchData()

    intervalRef.current = setInterval(fetchData, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [url, token, interval, skip, logout, fetchData])

  const refetch = () => {
    fetchData()
  }

  return { data, loading, error, refetch }
}