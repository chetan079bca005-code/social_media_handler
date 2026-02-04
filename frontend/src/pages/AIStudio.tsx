import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Wand2,
  Type,
  Image,
  Hash,
  Lightbulb,
  Languages,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select'
import { Switch } from '../components/ui/Switch'
import { cn, PLATFORMS } from '../lib/utils'
import {
  generateText,
  generateHashtags,
  generateContentIdeas,
  translateContent,
  rewriteCaption,
} from '../services/ai'
import toast from 'react-hot-toast'

const AI_TOOLS = [
  {
    id: 'text-generator',
    name: 'Caption Generator',
    description: 'Generate engaging captions for any platform',
    icon: Type,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'image-generator',
    name: 'Image Generator',
    description: 'Create AI-generated images from text',
    icon: Image,
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'hashtag-generator',
    name: 'Hashtag Generator',
    description: 'Find the best hashtags for your content',
    icon: Hash,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'content-ideas',
    name: 'Content Ideas',
    description: 'Get fresh ideas for your social media',
    icon: Lightbulb,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'caption-rewriter',
    name: 'Caption Rewriter',
    description: 'Improve your existing captions',
    icon: Wand2,
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'translator',
    name: 'Content Translator',
    description: 'Translate your content to any language',
    icon: Languages,
    color: 'from-cyan-500 to-blue-500',
  },
]

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'educational', label: 'Educational' },
]

const LENGTHS = [
  { value: 'short', label: 'Short (50-100 chars)' },
  { value: 'medium', label: 'Medium (150-300 chars)' },
  { value: 'long', label: 'Long (300-600 chars)' },
]

const LANGUAGES = [
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'italian', label: 'Italian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'hindi', label: 'Hindi' },
]

export function AIStudio() {
  const [activeTool, setActiveTool] = useState('text-generator')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Text Generator State
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState<'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational'>('casual')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [platform, setPlatform] = useState('instagram')
  const [includeHashtags, setIncludeHashtags] = useState(true)
  const [includeEmojis, setIncludeEmojis] = useState(true)
  const [includeCTA, setIncludeCTA] = useState(false)
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([])

  // Hashtag Generator State
  const [hashtagTopic, setHashtagTopic] = useState('')
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([])

  // Content Ideas State
  const [niche, setNiche] = useState('')
  const [contentIdeas, setContentIdeas] = useState<{ title: string; description: string; contentType: string }[]>([])

  // Rewriter State
  const [originalCaption, setOriginalCaption] = useState('')
  const [rewrittenCaption, setRewrittenCaption] = useState('')

  // Translator State
  const [contentToTranslate, setContentToTranslate] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('spanish')
  const [translatedContent, setTranslatedContent] = useState('')

  const handleGenerateCaptions = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setIsGenerating(true)
    try {
      const captions = await generateText({
        topic,
        tone,
        platform,
        length,
        includeHashtags,
        includeEmojis,
        includeCTA,
        variations: 3,
      })
      setGeneratedCaptions(captions)
      toast.success('Captions generated!')
    } catch (error) {
      toast.error('Failed to generate captions')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateHashtags = async () => {
    if (!hashtagTopic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setIsGenerating(true)
    try {
      const hashtags = await generateHashtags(hashtagTopic, platform, 15)
      setGeneratedHashtags(hashtags)
      toast.success('Hashtags generated!')
    } catch (error) {
      toast.error('Failed to generate hashtags')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateIdeas = async () => {
    if (!niche.trim()) {
      toast.error('Please enter your niche')
      return
    }

    setIsGenerating(true)
    try {
      const ideas = await generateContentIdeas(niche, platform, 5)
      setContentIdeas(ideas)
      toast.success('Ideas generated!')
    } catch (error) {
      toast.error('Failed to generate ideas')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRewrite = async () => {
    if (!originalCaption.trim()) {
      toast.error('Please enter a caption to rewrite')
      return
    }

    setIsGenerating(true)
    try {
      const rewritten = await rewriteCaption(originalCaption, platform, tone)
      setRewrittenCaption(rewritten)
      toast.success('Caption rewritten!')
    } catch (error) {
      toast.error('Failed to rewrite caption')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTranslate = async () => {
    if (!contentToTranslate.trim()) {
      toast.error('Please enter content to translate')
      return
    }

    setIsGenerating(true)
    try {
      const translated = await translateContent(contentToTranslate, targetLanguage)
      setTranslatedContent(translated)
      toast.success('Content translated!')
    } catch (error) {
      toast.error('Failed to translate content')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text)
    if (index !== undefined) {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
    toast.success('Copied to clipboard!')
  }

  const renderToolContent = () => {
    switch (activeTool) {
      case 'text-generator':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Topic or Description
              </label>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., New product launch for eco-friendly water bottles, focusing on sustainability and convenience"
                className="mt-1.5 min-h-30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Platform
                </label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tone
                </label>
                <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Length
                </label>
                <Select value={length} onValueChange={(v: any) => setLength(v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LENGTHS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
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
                <span className="text-sm text-slate-600 dark:text-slate-400">Include call-to-action</span>
              </label>
            </div>

            <Button
              onClick={handleGenerateCaptions}
              disabled={isGenerating || !topic.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Captions
                </>
              )}
            </Button>

            {generatedCaptions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Generated Captions
                </h3>
                {generatedCaptions.map((caption, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {caption}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500">{caption.length} characters</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(caption, index)}
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'hashtag-generator':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Topic or Keywords
              </label>
              <Input
                value={hashtagTopic}
                onChange={(e) => setHashtagTopic(e.target.value)}
                placeholder="e.g., fitness, health, wellness, gym workout"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Platform
              </label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateHashtags}
              disabled={isGenerating || !hashtagTopic.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Hash className="w-4 h-4 mr-2" />
                  Generate Hashtags
                </>
              )}
            </Button>

            {generatedHashtags.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Generated Hashtags
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedHashtags.map((h) => `#${h}`).join(' '))}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {generatedHashtags.map((hashtag) => (
                    <Badge
                      key={hashtag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                      onClick={() => copyToClipboard(`#${hashtag}`)}
                    >
                      #{hashtag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'content-ideas':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Your Niche or Industry
              </label>
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., fitness coaching, SaaS marketing, food blogging"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Platform
              </label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateIdeas}
              disabled={isGenerating || !niche.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Generate Ideas
                </>
              )}
            </Button>

            {contentIdeas.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Content Ideas
                </h3>
                {contentIdeas.map((idea, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {idea.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {idea.description}
                        </p>
                      </div>
                      <Badge variant="secondary">{idea.contentType}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'caption-rewriter':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Original Caption
              </label>
              <Textarea
                value={originalCaption}
                onChange={(e) => setOriginalCaption(e.target.value)}
                placeholder="Paste your existing caption here..."
                className="mt-1.5 min-h-37.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Platform
                </label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Desired Tone
                </label>
                <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleRewrite}
              disabled={isGenerating || !originalCaption.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rewriting...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Rewrite Caption
                </>
              )}
            </Button>

            {rewrittenCaption && (
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Improved Caption
                </h3>
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {rewrittenCaption}
                  </p>
                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(rewrittenCaption)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'translator':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Content to Translate
              </label>
              <Textarea
                value={contentToTranslate}
                onChange={(e) => setContentToTranslate(e.target.value)}
                placeholder="Enter the content you want to translate..."
                className="mt-1.5 min-h-37.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Target Language
              </label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleTranslate}
              disabled={isGenerating || !contentToTranslate.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4 mr-2" />
                  Translate
                </>
              )}
            </Button>

            {translatedContent && (
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Translated Content
                </h3>
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {translatedContent}
                  </p>
                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(translatedContent)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="text-center py-12">
            <p className="text-slate-500">Coming soon...</p>
          </div>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          AI Studio
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
          Powerful AI tools to supercharge your content creation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Tool Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>AI Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {AI_TOOLS.map((tool) => {
              const Icon = tool.icon
              const isActive = activeTool === tool.id
              const isAvailable = ['text-generator', 'hashtag-generator', 'content-ideas', 'caption-rewriter', 'translator'].includes(tool.id)

              return (
                <button
                  key={tool.id}
                  onClick={() => isAvailable && setActiveTool(tool.id)}
                  disabled={!isAvailable}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-all',
                    isActive
                      ? 'bg-linear-to-r from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500'
                      : isAvailable
                      ? 'hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-transparent'
                      : 'opacity-50 cursor-not-allowed border-2 border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center bg-linear-to-br',
                        tool.color
                      )}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p
                        className={cn(
                          'font-medium',
                          isActive
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-900 dark:text-white'
                        )}
                      >
                        {tool.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Tool Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              {AI_TOOLS.find((t) => t.id === activeTool)?.name}
            </CardTitle>
            <CardDescription>
              {AI_TOOLS.find((t) => t.id === activeTool)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>{renderToolContent()}</CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
