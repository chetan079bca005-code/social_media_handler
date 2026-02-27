import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film,
  Loader2,
  Download,
  Play,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/utils'
import {
  generateVideo,
  downloadVideo,
  getVideoHistory,
  type VideoHistoryItem,
} from '../services/video'
import { useVideoStore } from '../store/videoStore'
import toast from 'react-hot-toast'

// ─── Constants ──────────────────────────────────────────────────────
const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Landscape)' },
  { value: '9:16', label: '9:16 (Portrait)' },
]

const DURATIONS = [
  { value: '4', label: '4 seconds' },
  { value: '6', label: '6 seconds' },
  { value: '8', label: '8 seconds' },
]

const RESOLUTIONS = [
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' },
]

// Status label map
const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Loader2 }> = {
  idle: { label: 'Ready', color: 'text-slate-400', icon: Film },
  submitting: { label: 'Submitting...', color: 'text-blue-500', icon: Loader2 },
  processing: { label: 'Generating video...', color: 'text-amber-500', icon: Loader2 },
  downloading: { label: 'Fetching result...', color: 'text-indigo-500', icon: Loader2 },
  complete: { label: 'Complete!', color: 'text-emerald-500', icon: CheckCircle2 },
  error: { label: 'Failed', color: 'text-red-500', icon: AlertCircle },
}

// ─── Component ──────────────────────────────────────────────────────
export function VideoStudio() {
  // Persisted form state (survives page refresh)
  const { form, updateForm } = useVideoStore()

  // Convenience aliases that read/write through the store
  const prompt = form.prompt
  const imageUrl = form.imageUrl
  const aspectRatio = form.aspectRatio
  const duration = form.duration
  const resolution = form.resolution

  const setPrompt = (v: string) => updateForm({ prompt: v })
  const setImageUrl = (v: string) => updateForm({ imageUrl: v })
  const setAspectRatio = (v: '16:9' | '9:16') => updateForm({ aspectRatio: v })
  const setDuration = (v: 4 | 6 | 8) => updateForm({ duration: v })
  const setResolution = (v: '720p' | '1080p') => updateForm({ resolution: v })

  // Generation state — restore last results from store on mount
  const [status, setStatus] = useState<string>(
    form.generatedVideos.length > 0 ? 'complete' : 'idle'
  )
  const [statusDetail, setStatusDetail] = useState<string>('')
  const [generatedVideos, setGeneratedVideos] = useState<string[]>(form.generatedVideos)
  const [savedVideos, setSavedVideos] = useState<{ cloudinaryUrl: string; publicId?: string }[]>(form.savedVideos)

  // History
  const [history, setHistory] = useState<VideoHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const isGenerating = ['submitting', 'processing', 'downloading'].includes(status)

  // Load history on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadingHistory(true)
      try {
        const items = await getVideoHistory()
        if (!cancelled) setHistory(items)
      } catch {
        // silent — auth may not be ready yet
      } finally {
        if (!cancelled) setLoadingHistory(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  async function fetchHistory() {
    setLoadingHistory(true)
    try {
      const items = await getVideoHistory()
      setHistory(items)
    } catch {
      // silent
    } finally {
      setLoadingHistory(false)
    }
  }

  // ─── Generate handler ─────────────────────────────────────────────
  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt describing the video motion')
      return
    }
    if (!imageUrl.trim()) {
      toast.error('Please provide an image URL to animate')
      return
    }

    // Basic URL validation
    try {
      new URL(imageUrl)
    } catch {
      toast.error('Please enter a valid image URL')
      return
    }

    // Quick client-side image reachability check
    setStatus('submitting')
    setStatusDetail('Verifying image URL...')
    const imgOk = await new Promise<boolean>((resolve) => {
      const img = new window.Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = imageUrl
      // Timeout after 8s
      setTimeout(() => resolve(false), 8000)
    })

    if (!imgOk) {
      setStatus('error')
      setStatusDetail('')
      toast.error(
        'Cannot load this image. The URL may be broken, access-restricted, or not a valid image. ' +
        'Try a direct public URL from Unsplash, Imgur, or Cloudinary.',
        { duration: 6000 }
      )
      return
    }

    setGeneratedVideos([])
    setSavedVideos([])
    updateForm({ generatedVideos: [], savedVideos: [], lastStatus: 'submitting' })
    setStatus('submitting')

    try {
      const result = await generateVideo(
        { prompt, imageUrl, aspectRatio, duration, resolution },
        (s, detail) => {
          setStatus(s)
          if (detail) setStatusDetail(detail)
        }
      )

      setGeneratedVideos(result.videoList)
      setSavedVideos(result.savedVideos || [])
      setStatus('complete')
      updateForm({
        generatedVideos: result.videoList,
        savedVideos: result.savedVideos || [],
        lastStatus: 'complete',
      })
      toast.success('Video generated successfully!')

      // Refresh history
      fetchHistory()
    } catch (error: any) {
      setStatus('error')
      updateForm({ lastStatus: 'error' })
      toast.error(error.message || 'Video generation failed')
    }
  }

  // ─── Download handler ─────────────────────────────────────────────
  async function handleDownload(url: string, index: number) {
    toast.loading('Preparing download...', { id: 'video-dl' })
    try {
      await downloadVideo(url, `ai-video-${Date.now()}-${index + 1}.mp4`)
      toast.success('Download started!', { id: 'video-dl' })
    } catch {
      toast.error('Download failed — opening in new tab', { id: 'video-dl' })
    }
  }

  // ─── Status badge ─────────────────────────────────────────────────
  const currentStatus = STATUS_LABELS[status] || STATUS_LABELS.idle
  const StatusIcon = currentStatus.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Film className="w-7 h-7 text-indigo-500" />
            Video Studio
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Generate stunning AI videos from images using Veo 3.1
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="gap-2"
        >
          <Clock className="w-4 h-4" />
          {showHistory ? 'Hide History' : 'History'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ───── Left: Settings Panel ─────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Video Settings
              </CardTitle>
              <CardDescription>
                Provide an image and describe the motion you want
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  Source Image URL
                </label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isGenerating}
                />
                <p className="text-xs text-slate-400">
                  Use a <strong>direct, publicly accessible</strong> image URL (e.g. Unsplash, Imgur, Cloudinary).
                  CDN-protected or redirect URLs may be rejected by the AI service.
                </p>
              </div>

              {/* Image preview */}
              {imageUrl && (
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={imageUrl}
                    alt="Source preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}

              {/* Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Motion Prompt
                </label>
                <Textarea
                  placeholder="Describe how the image should be animated... e.g. 'The mist gently flows between the plants; the camera pans slowly to the right; purple lights pulse softly.'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  disabled={isGenerating}
                  className="resize-none"
                />
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Aspect Ratio
                </label>
                <Select
                  value={aspectRatio}
                  onValueChange={(v) => setAspectRatio(v as '16:9' | '9:16')}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Duration
                </label>
                <Select
                  value={String(duration)}
                  onValueChange={(v) => setDuration(Number(v) as 4 | 6 | 8)}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resolution */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Resolution
                </label>
                <Select
                  value={resolution}
                  onValueChange={(v) => setResolution(v as '720p' | '1080p')}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || !imageUrl.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    Generate Video
                  </>
                )}
              </Button>

              {/* Status indicator */}
              {status !== 'idle' && (
                <div
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium p-3 rounded-lg',
                    'bg-slate-50 dark:bg-slate-800/50',
                    currentStatus.color
                  )}
                >
                  <StatusIcon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      isGenerating && 'animate-spin'
                    )}
                  />
                  <div className="min-w-0">
                    <span>{currentStatus.label}</span>
                    {statusDetail && isGenerating && (
                      <p className="text-xs opacity-75 mt-0.5 truncate">{statusDetail}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ───── Right: Result Panel ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Generated Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-500" />
                Generated Video
              </CardTitle>
              <CardDescription>
                Your AI-generated video will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {generatedVideos.length > 0 ? (
                  <motion.div
                    key="videos"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {generatedVideos.map((url, i) => (
                      <div key={i} className="space-y-3">
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
                          <video
                            src={url}
                            controls
                            className="w-full max-h-125"
                            preload="metadata"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleDownload(url, i)}
                            className="gap-2"
                            variant="default"
                          >
                            <Download className="w-4 h-4" />
                            Download Video
                          </Button>
                          <Button
                            onClick={() => window.open(url, '_blank')}
                            variant="outline"
                            className="gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open in New Tab
                          </Button>
                          {savedVideos[i] && (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Saved to Cloud
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center space-y-4"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        Generating your video...
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {statusDetail || 'This may take 1-5 minutes depending on duration and resolution.'}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center space-y-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Film className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      No video generated yet. Fill in the settings and click Generate.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* ───── History panel ──────────────────────────────────── */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-500" />
                        Video History
                      </CardTitle>
                      <CardDescription>Previously generated videos</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchHistory}
                      disabled={loadingHistory}
                    >
                      <RefreshCw
                        className={cn('w-4 h-4', loadingHistory && 'animate-spin')}
                      />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                      </div>
                    ) : history.length === 0 ? (
                      <p className="text-center text-slate-400 py-8">
                        No videos generated yet
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                          >
                            <video
                              src={item.url}
                              controls
                              className="w-full h-40 object-cover bg-black"
                              preload="metadata"
                            />
                            <div className="p-3 space-y-2">
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(item.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {(item.metadata as any)?.prompt && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                                  {(item.metadata as any).prompt}
                                </p>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full gap-1"
                                onClick={() => {
                                  downloadVideo(item.url, `video-${item.id}.mp4`)
                                    .catch(() => window.open(item.url, '_blank'))
                                }}
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
