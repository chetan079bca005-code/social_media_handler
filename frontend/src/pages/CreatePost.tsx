import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  Image,
  Smile,
  Hash,
  AtSign,
  MapPin,
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
import { cn, getCharacterLimit, getPlatformColor, PLATFORMS } from '../lib/utils'
import { generateText, generateHashtags } from '../services/ai'
import toast from 'react-hot-toast'

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'educational', label: 'Educational' },
]

const LENGTHS = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
]

export function CreatePost() {
  const navigate = useNavigate()
  const [caption, setCaption] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram'])
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([])
  const [hashtags, setHashtags] = useState<string[]>([])
  const [hashtagInput, setHashtagInput] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiTopic, setAITopic] = useState('')
  const [aiTone, setAITone] = useState<'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational'>('casual')
  const [aiLength, setAILength] = useState<'short' | 'medium' | 'long'>('medium')
  const [aiVariations, setAIVariations] = useState<string[]>([])
  const [includeHashtags, setIncludeHashtags] = useState(true)
  const [includeEmojis, setIncludeEmojis] = useState(true)
  const [includeCTA, setIncludeCTA] = useState(false)

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...mediaFiles, ...acceptedFiles].slice(0, 10)
    setMediaFiles(newFiles)

    const newUrls = newFiles.map((file) => URL.createObjectURL(file))
    setMediaPreviewUrls(newUrls)
  }, [mediaFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index)
    const newUrls = mediaPreviewUrls.filter((_, i) => i !== index)
    setMediaFiles(newFiles)
    setMediaPreviewUrls(newUrls)
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  const addHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      setHashtags([...hashtags, hashtagInput.trim().replace(/^#/, '')])
      setHashtagInput('')
    }
  }

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag))
  }

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setIsGenerating(true)
    try {
      const variations = await generateText({
        topic: aiTopic,
        tone: aiTone,
        platform: selectedPlatforms[0] || 'instagram',
        length: aiLength,
        includeHashtags,
        includeEmojis,
        includeCTA,
        variations: 3,
      })
      setAIVariations(variations)
    } catch (error) {
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

    try {
      const generatedHashtags = await generateHashtags(
        caption,
        selectedPlatforms[0] || 'instagram',
        10
      )
      setHashtags([...new Set([...hashtags, ...generatedHashtags])])
      toast.success('Hashtags generated!')
    } catch (error) {
      toast.error('Failed to generate hashtags')
    }
  }

  const selectAIVariation = (variation: string) => {
    setCaption(variation)
    setIsAIModalOpen(false)
    toast.success('Caption applied!')
  }

  const handleSaveDraft = () => {
    toast.success('Post saved as draft!')
  }

  const handleSchedulePost = () => {
    setIsScheduleModalOpen(true)
  }

  const handlePublishNow = () => {
    toast.success('Post published!')
  }

  const confirmSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select date and time')
      return
    }
    toast.success('Post scheduled!')
    setIsScheduleModalOpen(false)
  }

  const currentPlatform = selectedPlatforms[0] || 'instagram'
  const characterLimit = getCharacterLimit(currentPlatform)
  const isOverLimit = caption.length > characterLimit

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Create Post
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Compose and schedule your social media content
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" onClick={handleSaveDraft} size="sm" className="sm:size-default">
            <Save className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Save Draft</span>
          </Button>
          <Button variant="outline" onClick={handleSchedulePost} size="sm" className="sm:size-default">
            <Calendar className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Schedule</span>
          </Button>
          <Button onClick={handlePublishNow} size="sm" className="sm:size-default">
            <Send className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Publish Now</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Composer */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Platform Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Platforms</CardTitle>
              <CardDescription>Choose where to publish your content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id)
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: platform.color }}
                      >
                        {platform.name[0]}
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isSelected
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-400'
                        )}
                      >
                        {platform.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Caption Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Caption</CardTitle>
                  <CardDescription>Write your post content</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAIModalOpen(true)}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-50 resize-none"
                characterCount={caption.length}
                maxCharacters={characterLimit}
                error={isOverLimit ? `Character limit exceeded for ${currentPlatform}` : undefined}
              />
              <div className="flex items-center gap-2 mt-4">
                <Button variant="ghost" size="sm">
                  <Smile className="w-4 h-4 mr-1" />
                  Emoji
                </Button>
                <Button variant="ghost" size="sm" onClick={handleGenerateHashtags}>
                  <Hash className="w-4 h-4 mr-1" />
                  Generate Hashtags
                </Button>
                <Button variant="ghost" size="sm">
                  <AtSign className="w-4 h-4 mr-1" />
                  Mention
                </Button>
                <Button variant="ghost" size="sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  Location
                </Button>
                <Button variant="ghost" size="sm">
                  <Link2 className="w-4 h-4 mr-1" />
                  Link
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Media</CardTitle>
                  <CardDescription>Add images or videos (up to 10)</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/design-studio')}
                  className="gap-2"
                >
                  <Paintbrush className="w-4 h-4" />
                  Design Studio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                  isDragActive
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Image className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      or click to browse (images and videos up to 100MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Media Previews */}
              {mediaPreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {mediaPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt=""
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {mediaFiles.length < 10 && (
                    <div
                      {...getRootProps()}
                      className="w-full aspect-square rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                    >
                      <Plus className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hashtags */}
          <Card>
            <CardHeader>
              <CardTitle>Hashtags</CardTitle>
              <CardDescription>Add relevant hashtags to increase reach</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  placeholder="Add a hashtag"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                />
                <Button onClick={addHashtag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button
                      onClick={() => removeHashtag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>See how your post will look</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={selectedPlatforms[0] || 'instagram'}>
                <TabsList className="w-full">
                  {selectedPlatforms.map((platform) => (
                    <TabsTrigger key={platform} value={platform} className="flex-1">
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {selectedPlatforms.map((platform) => (
                  <TabsContent key={platform} value={platform}>
                    <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      {/* Preview Header */}
                      <div className="p-3 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: getPlatformColor(platform) }}
                        >
                          U
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            Your Account
                          </p>
                          <p className="text-xs text-slate-500">Just now</p>
                        </div>
                      </div>

                      {/* Preview Media */}
                      {mediaPreviewUrls.length > 0 && (
                        <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                          <img
                            src={mediaPreviewUrls[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Preview Caption */}
                      <div className="p-3">
                        <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">
                          {caption || 'Your caption will appear here...'}
                        </p>
                        {hashtags.length > 0 && (
                          <p className="text-sm text-indigo-500 mt-2">
                            {hashtags.map((tag) => `#${tag}`).join(' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Generation Modal */}
      <Dialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Generate with AI
            </DialogTitle>
            <DialogDescription>
              Describe your content and let AI create engaging captions for you
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Topic or Description
              </label>
              <Textarea
                value={aiTopic}
                onChange={(e) => setAITopic(e.target.value)}
                placeholder="e.g., New product launch for our eco-friendly water bottles"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tone
                </label>
                <Select value={aiTone} onValueChange={(v: any) => setAITone(v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Length
                </label>
                <Select value={aiLength} onValueChange={(v: any) => setAILength(v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LENGTHS.map((length) => (
                      <SelectItem key={length.value} value={length.value}>
                        {length.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <Switch checked={includeHashtags} onCheckedChange={setIncludeHashtags} />
                <span className="text-sm text-slate-600 dark:text-slate-400">Include hashtags</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={includeEmojis} onCheckedChange={setIncludeEmojis} />
                <span className="text-sm text-slate-600 dark:text-slate-400">Include emojis</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={includeCTA} onCheckedChange={setIncludeCTA} />
                <span className="text-sm text-slate-600 dark:text-slate-400">Include CTA</span>
              </label>
            </div>

            <Button
              onClick={handleAIGenerate}
              disabled={isGenerating || !aiTopic.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Variations
                </>
              )}
            </Button>

            {/* AI Variations */}
            {aiVariations.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Generated Variations
                </h4>
                {aiVariations.map((variation, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer group"
                    onClick={() => selectAIVariation(variation)}
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {variation}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500">
                        {variation.length} characters
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Use this
                        <Check className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Post</DialogTitle>
            <DialogDescription>
              Choose when you want this post to be published
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Date
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Time
              </label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSchedule}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
