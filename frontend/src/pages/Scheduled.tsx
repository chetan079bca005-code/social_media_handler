import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { request } from '../services/api'

export function Scheduled() {
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await request<{ data: any[] }>(
          {
            method: 'GET',
            url: '/posts',
            params: { status: 'SCHEDULED' },
          }
        )
        if (isMounted) {
          setPosts(response.data || [])
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load scheduled posts')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Scheduled Posts</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoading && <p className="text-slate-500">Loading scheduled posts...</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {!isLoading && !error && posts.length === 0 && (
            <p className="text-slate-500 text-sm sm:text-base">No scheduled posts yet.</p>
          )}
          {!isLoading && !error && posts.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-xs sm:text-sm text-slate-500 mb-1">
                    Scheduled: {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'N/A'}
                  </div>
                  <div className="text-sm sm:text-base text-slate-900 dark:text-white line-clamp-3">
                    {post.content || post.caption || 'Untitled post'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
