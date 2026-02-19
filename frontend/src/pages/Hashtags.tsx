import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { generateHashtags } from '../services/ai'
import { Copy, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const PLATFORMS = [
  'instagram',
  'facebook',
  'twitter',
  'linkedin',
  'tiktok',
  'youtube',
  'pinterest',
  'threads',
]

export function Hashtags() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [isLoading, setIsLoading] = useState(false)
  const [hashtags, setHashtags] = useState<string[]>([])
  const navigate = useNavigate()

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setIsLoading(true)
    try {
      const result = await generateHashtags(topic, platform, 15)
      if (result.length === 0) {
        toast.error('Could not generate hashtags. The AI service may be unavailable.')
      } else {
        setHashtags(result)
        toast.success('Hashtags generated')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate hashtags')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hashtag Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Topic
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. digital marketing"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Platform
              </label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Hashtags'}
            </Button>

            {hashtags.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(hashtags.map(t => `#${t}`).join(' '))
                      toast.success('All hashtags copied!')
                    }}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const text = hashtags.map(t => `#${t}`).join(' ')
                      navigate(`/create?hashtags=${encodeURIComponent(text)}`)
                    }}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Use in Post
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        navigator.clipboard.writeText(`#${tag}`)
                        toast.success(`#${tag} copied!`)
                      }}
                      className="px-3 py-1 rounded-full text-sm bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
