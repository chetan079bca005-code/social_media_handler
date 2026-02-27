import { request } from './api'

// ─── Types ──────────────────────────────────────────────────────────
export interface VideoGenerationOptions {
  prompt: string
  imageUrl: string
  aspectRatio?: '16:9' | '9:16'
  duration?: 4 | 6 | 8
  resolution?: '720p' | '1080p'
}

export interface Text2VideoOptions {
  prompt: string
  aspectRatio?: '16:9' | '9:16'
  duration?: 4 | 6 | 8
  resolution?: '720p' | '1080p'
}

export interface VideoHistoryItem {
  id: string
  url: string
  createdAt: string
  metadata?: Record<string, unknown>
}

interface SubmitResponse {
  data?: { requestId?: string }
}

interface StatusResponse {
  data?: {
    status?: string
    time?: {
      submit_time?: string
      start_execute?: string
      end_execute?: string
    } | null
    error?: string | null
  }
}

interface ResultResponse {
  data?: {
    status?: string
    videoList?: string[]
    savedVideos?: { cloudinaryUrl: string; publicId?: string }[]
    error?: string | null
  }
}

interface HistoryResponse {
  data?: {
    videos?: VideoHistoryItem[]
  }
}

// ─── Submit video generation ────────────────────────────────────────
export async function submitVideoGeneration(
  options: VideoGenerationOptions
): Promise<string> {
  let response: SubmitResponse
  try {
    response = await request<SubmitResponse>({
      method: 'POST',
      url: '/video/submit',
      timeout: 60000,
      data: {
        prompt: options.prompt,
        imageUrl: options.imageUrl,
        aspectRatio: options.aspectRatio || '16:9',
        duration: options.duration || 4,
        resolution: options.resolution || '720p',
      },
    })
  } catch (err: any) {
    throw new Error(err.message || 'Failed to submit video generation request')
  }

  const requestId = response.data?.requestId
  if (!requestId) {
    throw new Error('No request ID returned from video submission')
  }
  return requestId
}

// ─── Poll video status ──────────────────────────────────────────────
export async function checkVideoStatus(
  requestId: string
): Promise<{ status: string; error?: string | null }> {
  const response = await request<StatusResponse>({
    method: 'GET',
    url: `/video/${requestId}/status`,
    timeout: 15000,
  })

  return {
    status: response.data?.status || 'processing',
    error: response.data?.error,
  }
}

// ─── Fetch video result ─────────────────────────────────────────────
export async function getVideoResult(
  requestId: string,
  prompt?: string
): Promise<{
  status: string
  videoList: string[]
  savedVideos?: { cloudinaryUrl: string; publicId?: string }[]
  error?: string | null
}> {
  const params = prompt ? `?prompt=${encodeURIComponent(prompt)}` : ''
  const response = await request<ResultResponse>({
    method: 'GET',
    url: `/video/${requestId}/result${params}`,
    timeout: 30000,
  })

  return {
    status: response.data?.status || 'processing',
    videoList: response.data?.videoList || [],
    savedVideos: response.data?.savedVideos,
    error: response.data?.error,
  }
}

// ─── Full generate-and-poll flow ────────────────────────────────────
export async function generateVideo(
  options: VideoGenerationOptions,
  onStatusChange?: (status: string, detail?: string) => void
): Promise<{
  videoList: string[]
  savedVideos?: { cloudinaryUrl: string; publicId?: string }[]
}> {
  // Step 1: Submit
  onStatusChange?.('submitting', 'Sending request to Veo API...')
  const requestId = await submitVideoGeneration(options)
  onStatusChange?.('processing', 'Video queued — generation starting...')

  // Step 2: Poll status
  // Longer videos (6s/8s) and 1080p can take 5-15 min; allow up to 25 min
  const MAX_ATTEMPTS = 300 // 25 minutes at 5s intervals
  const POLL_INTERVAL = 5000
  let consecutiveErrors = 0
  const startTime = Date.now()

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))

    const elapsed = Math.round((Date.now() - startTime) / 1000)
    const elapsedStr = elapsed < 60
      ? `${elapsed}s`
      : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`

    try {
      const { status, error } = await checkVideoStatus(requestId)
      consecutiveErrors = 0 // reset on success

      if (status === 'success') {
        onStatusChange?.('downloading', 'Video ready — fetching result...')
        break
      }

      if (status === 'error' || status === 'failed') {
        throw new Error(error || 'Video generation failed on the server')
      }

      onStatusChange?.('processing', `Generating video... (${elapsedStr} elapsed)`)
    } catch (err: any) {
      // If it's a definitive "failed" error from the API, re-throw immediately
      if (err.message?.includes('failed on the server')) {
        throw err
      }
      // Otherwise it's a transient network/auth error — tolerate a few
      consecutiveErrors++
      console.warn(`Status poll error (${consecutiveErrors}):`, err.message)
      if (consecutiveErrors >= 5) {
        throw new Error('Lost connection while checking video status. Please check your network and try again.')
      }
      onStatusChange?.('processing', `Generating... (${elapsedStr}, retrying status check)`)
    }
  }

  // Step 3: Get result
  const result = await getVideoResult(requestId, options.prompt)

  if (result.status !== 'success' || result.videoList.length === 0) {
    throw new Error(result.error || 'Video generation timed out or failed')
  }

  onStatusChange?.('complete')

  return {
    videoList: result.videoList,
    savedVideos: result.savedVideos,
  }
}

// ─── Video history ──────────────────────────────────────────────────
export async function getVideoHistory(): Promise<VideoHistoryItem[]> {
  try {
    const response = await request<HistoryResponse>({
      method: 'GET',
      url: '/video/history',
    })
    return response.data?.videos || []
  } catch (error) {
    console.error('Video history error:', error)
    return []
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── Text-to-Video (T2V) functions ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export async function submitT2V(
  options: Text2VideoOptions
): Promise<string> {
  let response: SubmitResponse
  try {
    response = await request<SubmitResponse>({
      method: 'POST',
      url: '/video/t2v/submit',
      timeout: 60000,
      data: {
        prompt: options.prompt,
        aspectRatio: options.aspectRatio || '16:9',
        duration: options.duration || 4,
        resolution: options.resolution || '720p',
      },
    })
  } catch (err: any) {
    throw new Error(err.message || 'Failed to submit text-to-video request')
  }

  const requestId = response.data?.requestId
  if (!requestId) {
    throw new Error('No request ID returned from T2V submission')
  }
  return requestId
}

export async function checkT2VStatus(
  requestId: string
): Promise<{ status: string; error?: string | null }> {
  const response = await request<StatusResponse>({
    method: 'GET',
    url: `/video/t2v/${requestId}/status`,
    timeout: 15000,
  })

  return {
    status: response.data?.status || 'processing',
    error: response.data?.error,
  }
}

export async function getT2VResult(
  requestId: string,
  prompt?: string
): Promise<{
  status: string
  videoList: string[]
  savedVideos?: { cloudinaryUrl: string; publicId?: string }[]
  error?: string | null
}> {
  const params = prompt ? `?prompt=${encodeURIComponent(prompt)}` : ''
  const response = await request<ResultResponse>({
    method: 'GET',
    url: `/video/t2v/${requestId}/result${params}`,
    timeout: 30000,
  })

  return {
    status: response.data?.status || 'processing',
    videoList: response.data?.videoList || [],
    savedVideos: response.data?.savedVideos,
    error: response.data?.error,
  }
}

// ─── Full T2V generate-and-poll flow ────────────────────────────────
export async function generateT2V(
  options: Text2VideoOptions,
  onStatusChange?: (status: string, detail?: string) => void
): Promise<{
  videoList: string[]
  savedVideos?: { cloudinaryUrl: string; publicId?: string }[]
}> {
  onStatusChange?.('submitting', 'Sending text-to-video request...')
  const requestId = await submitT2V(options)
  onStatusChange?.('processing', 'Video queued — generation starting...')

  const MAX_ATTEMPTS = 300
  const POLL_INTERVAL = 5000
  let consecutiveErrors = 0
  const startTime = Date.now()

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))

    const elapsed = Math.round((Date.now() - startTime) / 1000)
    const elapsedStr = elapsed < 60
      ? `${elapsed}s`
      : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`

    try {
      const { status, error } = await checkT2VStatus(requestId)
      consecutiveErrors = 0

      if (status === 'success') {
        onStatusChange?.('downloading', 'Video ready — fetching result...')
        break
      }

      if (status === 'error' || status === 'failed') {
        throw new Error(error || 'Video generation failed on the server')
      }

      onStatusChange?.('processing', `Generating video... (${elapsedStr} elapsed)`)
    } catch (err: any) {
      if (err.message?.includes('failed on the server')) {
        throw err
      }
      consecutiveErrors++
      console.warn(`T2V status poll error (${consecutiveErrors}):`, err.message)
      if (consecutiveErrors >= 5) {
        throw new Error('Lost connection while checking video status. Please check your network and try again.')
      }
      onStatusChange?.('processing', `Generating... (${elapsedStr}, retrying status check)`)
    }
  }

  const result = await getT2VResult(requestId, options.prompt)

  if (result.status !== 'success' || result.videoList.length === 0) {
    throw new Error(result.error || 'Video generation timed out or failed')
  }

  onStatusChange?.('complete')

  return {
    videoList: result.videoList,
    savedVideos: result.savedVideos,
  }
}

// ─── Download helper (triggers browser download) ────────────────────
export async function downloadVideo(url: string, filename?: string): Promise<void> {
  const name = filename || `ai-video-${Date.now()}.mp4`
  try {
    // Fetch the video as a blob so the browser can download cross-origin files
    const response = await fetch(url, { mode: 'cors' })
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch {
    // Fallback: open in a new tab so the user can save manually
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
