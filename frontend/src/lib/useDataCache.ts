import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Global in-memory data cache with stale-while-revalidate pattern.
 * Data persists across page navigations (component unmount/remount).
 * Shows cached data INSTANTLY, then refreshes in background.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  promise?: Promise<T>
}

// Global cache map — survives component lifecycle
const cache = new Map<string, CacheEntry<any>>()

// Default stale time: 2 minutes — data older than this triggers background refresh
const DEFAULT_STALE_TIME = 2 * 60 * 1000

// Max cache age: 10 minutes — data older than this is evicted
const MAX_CACHE_AGE = 10 * 60 * 1000

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  // Evict if too old
  if (Date.now() - entry.timestamp > MAX_CACHE_AGE) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

function isStale(key: string, staleTime = DEFAULT_STALE_TIME): boolean {
  const entry = cache.get(key)
  if (!entry) return true
  return Date.now() - entry.timestamp > staleTime
}

export function invalidateCache(pattern: string): void {
  if (pattern.includes('*')) {
    const prefix = pattern.replace('*', '')
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key)
    }
  } else {
    cache.delete(pattern)
  }
}

export function clearAllCache(): void {
  cache.clear()
}

/**
 * Hook: useDataCache — stale-while-revalidate data fetching
 *
 * @param key - Unique cache key for this data
 * @param fetcher - Async function that returns the data
 * @param options - { enabled, staleTime, onSuccess }
 *
 * Returns: { data, isLoading, isRefreshing, error, refetch }
 *   - isLoading: true only on FIRST load (no cached data)
 *   - isRefreshing: true when refreshing stale data in background (cached data shown)
 */
export function useDataCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    enabled?: boolean
    staleTime?: number
    onSuccess?: (data: T) => void
  }
) {
  const { enabled = true, staleTime = DEFAULT_STALE_TIME, onSuccess } = options || {}

  // Initialize from cache immediately (synchronous)
  // Use undefined (not null) so destructuring defaults like `data: x = []` work correctly
  const cached = getCached<T>(key)
  const [data, setData] = useState<T | undefined>(cached ?? undefined)
  const [isLoading, setIsLoading] = useState(!cached && enabled)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const doFetch = useCallback(
    async (background = false) => {
      if (!enabled) return

      if (!background) {
        // Only show loading spinner if no cached data
        if (!getCached(key)) setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      try {
        const result = await fetcherRef.current()
        if (!mountedRef.current) return

        setData(result)
        setCache(key, result)
        setError(null)
        onSuccess?.(result)
      } catch (err: any) {
        if (!mountedRef.current) return
        // Don't overwrite existing data on background refresh error
        if (!background) {
          setError(err?.message || 'Failed to load data')
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [key, enabled, onSuccess]
  )

  useEffect(() => {
    mountedRef.current = true

    if (!enabled) {
      setIsLoading(false)
      return
    }

    const cachedData = getCached<T>(key)
    if (cachedData) {
      // Show cached data instantly
      setData(cachedData)
      setIsLoading(false)

      // Refresh in background if stale
      if (isStale(key, staleTime)) {
        doFetch(true)
      }
    } else {
      // No cache — must do a foreground fetch (shows loading)
      doFetch(false)
    }

    return () => {
      mountedRef.current = false
    }
  }, [key, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => {
    // Clear stale cache so we always hit the server
    cache.delete(key)
    // Use background mode to show the refresh spinner (not full loading skeleton)
    return doFetch(true)
  }, [doFetch, key])

  // Return `undefined` instead of `null` when there's no data.
  // This allows consumers to use destructuring defaults: `const { data: x = [] } = ...`
  // (JS defaults only trigger for `undefined`, not `null`)
  return { data: data ?? undefined, isLoading, isRefreshing, error, refetch }
}
