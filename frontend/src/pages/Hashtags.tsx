import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { generateHashtags } from '../services/ai'
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
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-sm bg-slate-100 dark:bg-slate-800">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
