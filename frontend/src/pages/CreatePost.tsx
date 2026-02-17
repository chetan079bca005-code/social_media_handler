import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  Image,
  Hash,
  Link2,
  Calendar,
  Send,
  Save,
  Sparkles,
  Loader2,
  X,
  Plus,
  Wand2,
  Check,
  Paintbrush,
  Eye,
  EyeOff,
  RotateCcw,
  AlertCircle,
  Clock,
  FileText,
  Globe,
  Zap,
  Copy,
  ArrowLeft,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Textarea'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog'
import { Switch } from '../components/ui/Switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip'
import { cn, getCharacterLimit, getPlatformColor, PLATFORMS, formatDateTime } from '../lib/utils'
import { generateText, generateHashtags } from '../services/ai'
import { postsApi, mediaApi, socialAccountsApi } from '../services/api'
import { useWorkspaceStore } from '../store'
import { useDraftStore } from '../store/draftStore'
import toast from 'react-hot-toast'

// ─── Constants ───────────────────────────────────────────────────────────────

const TONES = [
  { value: 'professional', label: 'Professional', icon: '💼' },
  { value: 'casual', label: 'Casual', icon: '😎' },
  { value: 'humorous', label: 'Humorous', icon: '😄' },
  { value: 'inspirational', label: 'Inspirational', icon: '✨' },
  { value: 'educational', label: 'Educational', icon: '📚' },
] as const

const LENGTHS = [
  { value: 'short', label: 'Short', desc: '< 100 chars' },
  { value: 'medium', label: 'Medium', desc: '100-300 chars' },
  { value: 'long', label: 'Long', desc: '300+ chars' },
] as const

const POST_TYPES = [
  { value: 'TEXT', label: 'Text', icon: FileText },
  { value: 'IMAGE', label: 'Image', icon: Image },
  { value: 'VIDEO', label: 'Video', icon: Eye },
  { value: 'CAROUSEL', label: 'Carousel', icon: Copy },
  { value: 'STORY', label: 'Story', icon: Clock },
  { value: 'REEL', label: 'Reel', icon: Zap },
] as const

const AUTO_SAVE_DELAY = 1500

// ─── Component ───────────────────────────────────────────────────────────────

export function CreatePost() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { postId: routePostId } = useParams<{ postId: string }>()
  const editId = routePostId || searchParams.get('edit')
  const { currentWorkspace } = useWorkspaceStore()
  const wsId = currentWorkspace?.id

  // Draft store for persistence across navigation
  const { draft, isDirty, updateDraft, loadForEdit, clearDraft, hasDraft } = useDraftStore()

  // ─── Local UI state (not persisted) ──────────────────────────────────────
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [hashtagInput, setHashtagInput] = useState('')
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiVariations, setAIVariations] = useState<string[]>([])
  const [includeHashtags, setIncludeHashtags] = useState(true)
  const [includeEmojis, setIncludeEmojis] = useState(true)
  const [includeCTA, setIncludeCTA] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [isLoadingPost, setIsLoadingPost] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [postType, setPostType] = useState<string>('TEXT')
  const [linkUrl, setLinkUrl] = useState(draft.linkUrl || '')
  const [showLinkInput, setShowLinkInput] = useState(!!draft.linkUrl)
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialLoadRef = useRef(true)

  // Derived state from draft store
  const caption = draft.content
  const selectedAccountIds = draft.selectedAccountIds
  const hashtags = draft.hashtags
  const scheduledDate = draft.scheduledDate
  const scheduledTime = draft.scheduledTime
  const mediaPreviewUrls = draft.mediaPreviewUrls

  // ─── Load connected social accounts ──────────────────────────────────────
  useEffect(() => {
    if (!wsId) return
    setIsLoadingAccounts(true)
    socialAccountsApi.getAll(wsId)
      .then((res) => {
        const payload = (res as any)?.data ?? res
        const accounts = payload?.data?.accounts || payload?.accounts || []
        setConnectedAccounts(accounts)
      })
      .catch(() => setConnectedAccounts([]))
      .finally(() => setIsLoadingAccounts(false))
  }, [wsId])

  // ─── Load post for editing ───────────────────────────────────────────────
  useEffect(() => {
    if (!editId) {
      isInitialLoadRef.current = false
      return
    }
    // If we already loaded this edit, skip
    if (draft.editId === editId && draft.content) {
      isInitialLoadRef.current = false
      return
    }

    setIsLoadingPost(true)
    postsApi.getById(editId)
      .then((res) => {
        const post = res?.data?.data?.post || res?.data?.post || res?.data?.data || res?.data
        if (post) {
          loadForEdit(post)
          setPostType(post.postType || 'TEXT')
          setLinkUrl(post.linkUrl || '')
          setShowLinkInput(!!post.linkUrl)
        } else {
          toast.error('Post not found')
          navigate('/create')
        }
      })
      .catch(() => {
        toast.error('Failed to load post')
        navigate('/create')
      })
      .finally(() => {
        setIsLoadingPost(false)
        isInitialLoadRef.current = false
      })
  }, [editId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Clear stale edit draft when creating new post ───────────────────────
  useEffect(() => {
    if (!editId && draft.editId) {
      clearDraft()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-save to draft store on changes ─────────────────────────────────
  useEffect(() => {
    if (isInitialLoadRef.current) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      updateDraft({
        content: caption,
        selectedAccountIds,
        hashtags,
        linkUrl,
        scheduledDate,
        scheduledTime,
        editId: editId || draft.editId,
      })
    }, AUTO_SAVE_DELAY)
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current) }
  }, [caption, selectedAccountIds, hashtags, linkUrl, scheduledDate, scheduledTime]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Warn on page close with unsaved changes ────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && caption.trim()) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, caption])

  // ─── File drop handler ───────────────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...mediaFiles, ...acceptedFiles].slice(0, 10)
    setMediaFiles(newFiles)
    const newUrls = newFiles.map((file) => URL.createObjectURL(file))
    updateDraft({ mediaPreviewUrls: newUrls })

    // Auto-detect post type from media
    if (newFiles.length > 0) {
      const hasVideo = newFiles.some((f) => f.type.startsWith('video'))
      if (hasVideo) setPostType('VIDEO')
      else if (newFiles.length > 1) setPostType('CAROUSEL')
      else setPostType('IMAGE')
    }
  }, [mediaFiles, updateDraft])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    },
    maxSize: 100 * 1024 * 1024,
  })

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index)
    const newUrls = mediaPreviewUrls.filter((_, i) => i !== index)
    setMediaFiles(newFiles)
    updateDraft({ mediaPreviewUrls: newUrls })
    if (newFiles.length === 0) setPostType('TEXT')
    else if (newFiles.length === 1 && newFiles[0]?.type.startsWith('video')) setPostType('VIDEO')
    else if (newFiles.length === 1) setPostType('IMAGE')
    else setPostType('CAROUSEL')
  }

  // ─── Account selection ───────────────────────────────────────────────────
  const toggleAccount = (accountId: string) => {
    const newIds = selectedAccountIds.includes(accountId)
      ? selectedAccountIds.filter((id) => id !== accountId)
      : [...selectedAccountIds, accountId]
    updateDraft({ selectedAccountIds: newIds })
  }

  const selectedPlatformNames = useMemo(() => {
    return connectedAccounts
      .filter((a) => selectedAccountIds.includes(a.id))
      .map((a) => (a.platform || '').toLowerCase())
  }, [connectedAccounts, selectedAccountIds])

  // ─── Hashtag helpers ─────────────────────────────────────────────────────
  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '')
    if (tag && !hashtags.includes(tag)) {
      updateDraft({ hashtags: [...hashtags, tag] })
      setHashtagInput('')
    }
  }

  const removeHashtag = (tag: string) => {
    updateDraft({ hashtags: hashtags.filter((t) => t !== tag) })
  }

  // ─── AI Generation ──────────────────────────────────────────────────────
  const handleAIGenerate = async () => {
    if (!draft.aiTopic.trim()) {
      toast.error('Please enter a topic')
      return
    }
    setIsGenerating(true)
    try {
      const variations = await generateText({
        topic: draft.aiTopic,
        tone: draft.aiTone,
        platform: selectedPlatformNames[0] || 'instagram',
        length: draft.aiLength,
        includeHashtags,
        includeEmojis,
        includeCTA,
        variations: 3,
      })
      setAIVariations(variations)
    } catch {
      toast.error('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateHashtags = async () => {
    if (!caption.trim()) {
      toast.error('Please enter a caption first')
      return
    }
    const toastId = toast.loading('Generating hashtags...')
    try {
      const generatedHashtags = await generateHashtags(
        caption,
        selectedPlatformNames[0] || 'instagram',
        10,
      )
      updateDraft({ hashtags: [...new Set([...hashtags, ...generatedHashtags])] })
      toast.success('Hashtags generated!', { id: toastId })
    } catch {
      toast.error('Failed to generate hashtags', { id: toastId })
    }
  }

  const selectAIVariation = (variation: string) => {
    updateDraft({ content: variation })
    setIsAIModalOpen(false)
    toast.success('Caption applied!')
  }

  // ─── Media upload ────────────────────────────────────────────────────────
  const uploadMediaFiles = async (): Promise<string[]> => {
    if (!wsId) return draft.uploadedMediaIds
    if (mediaFiles.length === 0 && draft.uploadedMediaIds.length > 0) return draft.uploadedMediaIds
    const mediaIds: string[] = [...draft.uploadedMediaIds]
    for (const file of mediaFiles) {
      try {
        const res = await mediaApi.upload(wsId, file)
        const id = res.data?.data?.id || res.data?.id
        if (id) mediaIds.push(id)
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    return mediaIds
  }

  // ─── Build post data ────────────────────────────────────────────────────
  const buildPostData = (mediaIds: string[]) => {
    const detectedType = mediaFiles.length > 0
      ? (mediaFiles.some((f) => f.type.startsWith('video')) ? 'VIDEO' : (mediaFiles.length > 1 ? 'CAROUSEL' : 'IMAGE'))
      : postType
    return {
      content: caption,
      type: detectedType || 'TEXT',
      platforms: selectedAccountIds.map((id) => ({ socialAccountId: id })),
      hashtags,
      ...(mediaIds.length > 0 && { mediaIds }),
      ...(linkUrl.trim() && { linkUrl: linkUrl.trim() }),
    }
  }

  // ─── Validation ──────────────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!caption.trim()) {
      toast.error('Please write some content')
      return false
    }
    if (selectedAccountIds.length === 0) {
      toast.error('Please select at least one social account')
      return false
    }
    for (const name of selectedPlatformNames) {
      const limit = getCharacterLimit(name)
      if (caption.length > limit) {
        toast.error(`Caption exceeds ${name} limit (${caption.length}/${limit})`)
        return false
      }
    }
    return true
  }

  // ─── Actions ─────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!caption.trim()) { toast.error('Please write some content'); return }
    if (selectedAccountIds.length === 0) { toast.error('Please select at least one social account'); return }
    setIsSavingDraft(true)
    try {
      const mediaIds = await uploadMediaFiles()
      if (editId || draft.editId) {
        await postsApi.update(editId || draft.editId!, {
          content: caption,
          type: postType,
          hashtags,
          ...(linkUrl.trim() && { linkUrl: linkUrl.trim() }),
        })
        toast.success('Draft updated!')
      } else {
        await postsApi.create(buildPostData(mediaIds))
        toast.success('Post saved as draft!')
      }
      clearDraft()
      navigate('/scheduled')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save draft')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handlePublishNow = async () => {
    if (!validate()) return
    setIsPublishing(true)
    try {
      const mediaIds = await uploadMediaFiles()
      let postId = editId || draft.editId
      if (postId) {
        await postsApi.update(postId, {
          content: caption,
          type: postType,
          hashtags,
          ...(linkUrl.trim() && { linkUrl: linkUrl.trim() }),
        })
      } else {
        const res = await postsApi.create(buildPostData(mediaIds))
        postId = res.data?.data?.id || res.data?.data?.post?.id || res.data?.id
      }
      if (postId) await postsApi.publish(postId)
      clearDraft()
      toast.success('Post published!')
      navigate('/published')
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish post')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSchedulePost = () => {
    if (!validate()) return
    setIsScheduleModalOpen(true)
  }

  const confirmSchedule = async () => {
    if (!scheduledDate || !scheduledTime) { toast.error('Please select date and time'); return }
    if (!caption.trim()) { toast.error('Please write some content'); return }
    const scheduledAtDate = new Date(`${scheduledDate}T${scheduledTime}`)
    if (scheduledAtDate <= new Date()) { toast.error('Scheduled time must be in the future'); return }

    setIsScheduling(true)
    try {
      const mediaIds = await uploadMediaFiles()
      const scheduledAt = scheduledAtDate.toISOString()
      let postId = editId || draft.editId
      if (postId) {
        await postsApi.update(postId, {
          content: caption, type: postType, hashtags, scheduledAt,
          ...(linkUrl.trim() && { linkUrl: linkUrl.trim() }),
        })
        await postsApi.schedule(postId, scheduledAt)
      } else {
        const res = await postsApi.create(buildPostData(mediaIds))
        postId = res.data?.data?.id || res.data?.data?.post?.id || res.data?.id
        if (postId) await postsApi.schedule(postId, scheduledAt)
      }
      clearDraft()
      toast.success('Post scheduled!')
      setIsScheduleModalOpen(false)
      navigate('/scheduled')
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule post')
    } finally {
      setIsScheduling(false)
    }
  }

  const handleDiscard = () => {
    clearDraft()
    setMediaFiles([])
    setLinkUrl('')
    setShowLinkInput(false)
    setPostType('TEXT')
    setAIVariations([])
    if (editId) navigate('/scheduled')
    else toast.success('Draft discarded')
  }

  // ─── Computed values ─────────────────────────────────────────────────────
  const currentPlatform = selectedPlatformNames[0] || 'instagram'
  const characterLimit = getCharacterLimit(currentPlatform)
  const isOverLimit = caption.length > characterLimit
  const charPercent = Math.min((caption.length / characterLimit) * 100, 100)
  const wordCount = caption.trim() ? caption.trim().split(/\s+/).length : 0
  const isEditing = !!(editId || draft.editId)
  const totalMedia = mediaFiles.length + (draft.uploadedMediaIds.length > 0 && mediaFiles.length === 0 ? draft.uploadedMediaIds.length : 0)

  // Group connected accounts by platform
  const accountsByPlatform = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const account of connectedAccounts) {
      const platform = (account.platform || '').toLowerCase()
      if (!map[platform]) map[platform] = []
      map[platform].push(account)
    }
    return map
  }, [connectedAccounts])

  // ─── Loading state ───────────────────────────────────────────────────────
  if (isLoadingPost) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-4 sm:space-y-5"
    >
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          {isEditing && (
            <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {isEditing ? 'Edit Post' : 'Create Post'}
              {isDirty && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved
                </span>
              )}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditing ? 'Update your post content and settings' : 'Compose and schedule your social media content'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {(isDirty || isEditing) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={handleDiscard}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Discard changes</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="outline" onClick={handleSaveDraft} size="sm" disabled={isSavingDraft || !caption.trim()}>
            {isSavingDraft ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : <Save className="w-4 h-4 sm:mr-2" />}
            <span className="hidden sm:inline">{isSavingDraft ? 'Saving...' : isEditing ? 'Update Draft' : 'Save Draft'}</span>
          </Button>
          <Button variant="outline" onClick={handleSchedulePost} size="sm" disabled={!caption.trim()}>
            <Calendar className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Schedule</span>
          </Button>
          <Button onClick={handlePublishNow} size="sm" disabled={isPublishing || !caption.trim()}>
            {isPublishing ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : <Send className="w-4 h-4 sm:mr-2" />}
            <span className="hidden sm:inline">{isPublishing ? 'Publishing...' : 'Publish Now'}</span>
          </Button>
        </div>
      </div>

      {/* ─── Draft banner ──────────────────────────────────────────────── */}
      {!editId && hasDraft() && draft.content && !isInitialLoadRef.current && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <FileText className="w-4 h-4" />
            <span>Unsaved draft from {draft.lastModified ? formatDateTime(new Date(draft.lastModified)) : 'earlier'}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDiscard} className="text-blue-600 hover:text-blue-700">
            Discard
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* ─── Left Column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* Account Selection */}
          <Card className="border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Accounts</CardTitle>
              <CardDescription>Choose which accounts to publish to</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAccounts ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-500">Loading accounts...</span>
                </div>
              ) : connectedAccounts.length === 0 ? (
                <div className="text-center py-6">
                  <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 mb-3">No social accounts connected</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/accounts')}>
                    Connect Accounts
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(accountsByPlatform).map(([platform, accounts]) => {
                    const platformInfo = PLATFORMS.find((p) => p.id === platform)
                    return (
                      <div key={platform}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          {platformInfo?.name || platform}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {accounts.map((account: any) => {
                            const isSelected = selectedAccountIds.includes(account.id)
                            const color = getPlatformColor(platform)
                            return (
                              <button
                                key={account.id}
                                onClick={() => toggleAccount(account.id)}
                                className={cn(
                                  'flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all text-left',
                                  isSelected
                                    ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm shadow-indigo-100 dark:shadow-none'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                )}
                              >
                                {account.profileImageUrl ? (
                                  <img src={account.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800" />
                                ) : (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-slate-800"
                                    style={{ backgroundColor: color }}
                                  >
                                    {(account.accountName || platform)[0]?.toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className={cn(
                                    'text-sm font-medium truncate max-w-35',
                                    isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'
                                  )}>
                                    {account.accountName || account.accountUsername}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate max-w-35">
                                    @{account.accountUsername || account.accountName}
                                  </p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Caption Editor */}
          <Card className="border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Content</CardTitle>
                  <CardDescription>Write your post content</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger className="w-32.5 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-1.5">
                            <type.icon className="w-3.5 h-3.5" />
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setIsAIModalOpen(true)} className="gap-1.5 h-8">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">AI Generate</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  value={caption}
                  onChange={(e) => updateDraft({ content: e.target.value })}
                  placeholder="What's on your mind? Share something great with your audience..."
                  className="min-h-45 resize-none text-[15px] leading-relaxed border-slate-200 dark:border-slate-700 focus:border-indigo-400"
                />
                {/* Character ring */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className={cn(
                    'text-xs tabular-nums',
                    isOverLimit ? 'text-red-500 font-semibold' : caption.length > characterLimit * 0.9 ? 'text-amber-500' : 'text-slate-400'
                  )}>
                    {caption.length}/{characterLimit}
                  </span>
                  <div className="relative w-6 h-6">
                    <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="2" />
                      <circle
                        cx="12" cy="12" r="10" fill="none"
                        stroke={isOverLimit ? '#ef4444' : charPercent > 90 ? '#f59e0b' : '#6366f1'}
                        strokeWidth="2"
                        strokeDasharray={`${charPercent * 0.628} 62.8`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {isOverLimit && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Character limit exceeded for {currentPlatform} ({caption.length - characterLimit} over)
                </p>
              )}

              {/* Toolbar */}
              <div className="flex items-center gap-1 mt-3 flex-wrap">
                <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs" onClick={handleGenerateHashtags}>
                  <Hash className="w-3.5 h-3.5 mr-1" /> AI Hashtags
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs" onClick={() => { setShowLinkInput(!showLinkInput); if (!showLinkInput) setLinkUrl('') }}>
                  <Link2 className="w-3.5 h-3.5 mr-1" /> Link
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs" onClick={() => navigate('/design-studio')}>
                  <Paintbrush className="w-3.5 h-3.5 mr-1" /> Design
                </Button>
                <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
                  <span>{wordCount} words</span>
                  {selectedPlatformNames.length > 0 && (
                    <span>{selectedPlatformNames.length} platform{selectedPlatformNames.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>

              {/* Link URL */}
              <AnimatePresence>
                {showLinkInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="flex gap-2">
                      <Input
                        value={linkUrl}
                        onChange={(e) => { setLinkUrl(e.target.value); updateDraft({ linkUrl: e.target.value }) }}
                        placeholder="https://example.com"
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon-sm" onClick={() => { setShowLinkInput(false); setLinkUrl(''); updateDraft({ linkUrl: '' }) }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card className="border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Media</CardTitle>
                  <CardDescription>Add images or videos (up to 10 files, max 100MB each)</CardDescription>
                </div>
                <Badge variant="secondary" size="sm">{totalMedia}/10</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
                  isDragActive
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Image className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {isDragActive ? 'Drop files here' : 'Drag & drop or click to browse'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, GIF, WEBP, MP4, MOV</p>
                  </div>
                </div>
              </div>

              {mediaPreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                  {mediaPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg ring-1 ring-slate-200 dark:ring-slate-700" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeMedia(index) }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">{index + 1}</div>
                    </div>
                  ))}
                  {totalMedia < 10 && (
                    <div
                      {...getRootProps()}
                      className="aspect-square rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                    >
                      <Plus className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hashtags */}
          <Card className="border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Hashtags</CardTitle>
                  <CardDescription>Add relevant hashtags to increase reach</CardDescription>
                </div>
                {hashtags.length > 0 && <Badge variant="secondary" size="sm">{hashtags.length} tags</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  placeholder="Type a hashtag and press Enter"
                  className="flex-1"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag() } }}
                />
                <Button onClick={addHashtag} variant="outline" size="sm" className="px-4 shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {hashtags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1 py-1 text-xs">
                      <span className="text-indigo-500">#</span>{tag}
                      <button
                        onClick={() => removeHashtag(tag)}
                        className="ml-0.5 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">
                  No hashtags yet. Type to add or use AI to generate.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Right Column ────────────────────────────────────────────── */}
        <div className="space-y-4 sm:space-y-5">
          {/* Preview */}
          <Card className="sticky top-20 border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Preview</CardTitle>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <CardContent className="pt-0">
                    {selectedPlatformNames.length === 0 ? (
                      <div className="text-center py-8 text-sm text-slate-400">
                        Select an account to see preview
                      </div>
                    ) : (
                      <Tabs defaultValue={selectedPlatformNames[0] || 'instagram'}>
                        <TabsList className="w-full">
                          {selectedPlatformNames.slice(0, 4).map((platform) => (
                            <TabsTrigger key={platform} value={platform} className="flex-1 text-xs">
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {selectedPlatformNames.map((platform) => {
                          const account = connectedAccounts.find(
                            (a) => (a.platform || '').toLowerCase() === platform && selectedAccountIds.includes(a.id)
                          )
                          const platformColor = getPlatformColor(platform)
                          const platformLimit = getCharacterLimit(platform)
                          const isAtLimit = caption.length > platformLimit

                          return (
                            <TabsContent key={platform} value={platform}>
                              <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                                {/* Header */}
                                <div className="p-3 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                                  {account?.profileImageUrl ? (
                                    <img src={account.profileImageUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                                  ) : (
                                    <div
                                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                      style={{ backgroundColor: platformColor }}
                                    >
                                      {(account?.accountName || 'U')[0]?.toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                      {account?.accountName || 'Your Account'}
                                    </p>
                                    <p className="text-[11px] text-slate-400">Just now</p>
                                  </div>
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platformColor }} />
                                </div>

                                {/* Media */}
                                {mediaPreviewUrls.length > 0 && (
                                  <div className="aspect-square bg-slate-50 dark:bg-slate-800 relative">
                                    <img src={mediaPreviewUrls[0]} alt="" className="w-full h-full object-cover" />
                                    {mediaPreviewUrls.length > 1 && (
                                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                                        1/{mediaPreviewUrls.length}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Caption */}
                                <div className="p-3">
                                  <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                    {caption || <span className="text-slate-400 italic">Your caption will appear here...</span>}
                                  </p>
                                  {linkUrl && (
                                    <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                      <p className="text-xs text-indigo-500 truncate flex items-center gap-1">
                                        <Link2 className="w-3 h-3 shrink-0" />{linkUrl}
                                      </p>
                                    </div>
                                  )}
                                  {hashtags.length > 0 && (
                                    <p className="text-sm text-indigo-500 mt-2 leading-relaxed">
                                      {hashtags.map((tag) => `#${tag}`).join(' ')}
                                    </p>
                                  )}
                                </div>

                                {/* Footer */}
                                <div className={cn(
                                  'px-3 py-2 border-t text-xs flex items-center justify-between',
                                  isAtLimit
                                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-red-500'
                                    : 'border-slate-100 dark:border-slate-800 text-slate-400'
                                )}>
                                  <span>{caption.length} / {platformLimit}</span>
                                  {isAtLimit && (
                                    <span className="flex items-center gap-1 font-medium">
                                      <AlertCircle className="w-3 h-3" /> Over limit
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TabsContent>
                          )
                        })}
                      </Tabs>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Summary */}
          <Card className="border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Type</span>
                <Badge variant="secondary" size="sm">{postType}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Accounts</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedAccountIds.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Media</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{totalMedia} files</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Hashtags</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{hashtags.length}</span>
              </div>
              {linkUrl && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Link</span>
                  <span className="font-medium text-indigo-500 truncate max-w-37.5">{linkUrl}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Characters</span>
                <span className={cn('font-medium', isOverLimit ? 'text-red-500' : 'text-slate-700 dark:text-slate-300')}>
                  {caption.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Words</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{wordCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── AI Modal ──────────────────────────────────────────────────── */}
      <Dialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              AI Content Generator
            </DialogTitle>
            <DialogDescription>Describe your content and let AI create engaging captions</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Topic or Description</label>
              <Textarea
                value={draft.aiTopic}
                onChange={(e) => updateDraft({ aiTopic: e.target.value })}
                placeholder="e.g., New product launch for our eco-friendly water bottles"
                className="mt-1.5 min-h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tone</label>
                <Select value={draft.aiTone} onValueChange={(v: any) => updateDraft({ aiTone: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        <span className="flex items-center gap-2"><span>{tone.icon}</span>{tone.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Length</label>
                <Select value={draft.aiLength} onValueChange={(v: any) => updateDraft({ aiLength: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LENGTHS.map((length) => (
                      <SelectItem key={length.value} value={length.value}>
                        <span className="flex items-center gap-3">{length.label} <span className="text-[10px] text-slate-400">{length.desc}</span></span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <Switch checked={includeHashtags} onCheckedChange={setIncludeHashtags} />
                <span className="text-sm text-slate-600 dark:text-slate-400">Hashtags</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={includeEmojis} onCheckedChange={setIncludeEmojis} />
                <span className="text-sm text-slate-600 dark:text-slate-400">Emojis</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={includeCTA} onCheckedChange={setIncludeCTA} />
                <span className="text-sm text-slate-600 dark:text-slate-400">Call to Action</span>
              </label>
            </div>

            <Button
              onClick={handleAIGenerate}
              disabled={isGenerating || !draft.aiTopic.trim()}
              className="w-full bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Generate Variations</>
              )}
            </Button>

            <AnimatePresence>
              {aiVariations.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" /> Generated Variations
                  </h4>
                  {aiVariations.map((variation, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer group hover:shadow-sm"
                      onClick={() => selectAIVariation(variation)}
                    >
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{variation}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400">
                          {variation.length} chars · {variation.trim().split(/\s+/).length} words
                        </span>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7">
                          Use this <Check className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Schedule Modal ────────────────────────────────────────────── */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              Schedule Post
            </DialogTitle>
            <DialogDescription>Choose when you want this post to be published</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => updateDraft({ scheduledDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Time</label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => updateDraft({ scheduledTime: e.target.value })}
                className="mt-1.5"
              />
            </div>
            {scheduledDate && scheduledTime && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Scheduled for {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmSchedule} disabled={isScheduling || !scheduledDate || !scheduledTime}>
              {isScheduling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
              {isScheduling ? 'Scheduling...' : 'Schedule Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
