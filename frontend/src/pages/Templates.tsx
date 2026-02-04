import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Plus,
  Search,
  Grid3X3,
  List,
  Star,
  Copy,
  Edit2,
  Trash2,
  MoreVertical,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Type,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/Dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/DropdownMenu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs'
import { cn, PLATFORMS, getPlatformColor } from '../lib/utils'
import toast from 'react-hot-toast'

interface Template {
  id: string
  name: string
  description: string
  content: string
  category: string
  platforms: string[]
  tags: string[]
  isFavorite: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
  thumbnail?: string
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Product Launch Announcement',
    description: 'Perfect for announcing new product releases',
    content: '🚀 Exciting news! We\'re thrilled to introduce [Product Name] - [Brief description]!\n\n✨ Key features:\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\n🎁 Special launch offer: [Offer details]\n\nLink in bio to learn more! 👆\n\n#NewProduct #Launch #Innovation',
    category: 'announcement',
    platforms: ['instagram', 'facebook', 'twitter'],
    tags: ['product', 'launch', 'announcement'],
    isFavorite: true,
    usageCount: 45,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: '2',
    name: 'Weekly Tips Series',
    description: 'Share valuable tips with your audience',
    content: '💡 [Industry] Tip of the Week!\n\nDid you know? [Interesting fact or tip]\n\n📌 Quick takeaway: [Key point]\n\n👇 Share your thoughts in the comments!\n\n#Tips #[Industry] #WeeklyWisdom',
    category: 'educational',
    platforms: ['instagram', 'linkedin', 'twitter'],
    tags: ['tips', 'educational', 'engagement'],
    isFavorite: true,
    usageCount: 67,
    createdAt: '2024-01-08T09:00:00Z',
    updatedAt: '2024-01-14T11:20:00Z',
  },
  {
    id: '3',
    name: 'Customer Testimonial',
    description: 'Showcase positive customer feedback',
    content: '⭐️ Customer Love ⭐️\n\n"[Customer quote about your product/service]"\n\n— [Customer Name], [Title/Company]\n\nThank you for the kind words! We\'re so grateful for customers like you. 💜\n\n#CustomerLove #Testimonial #ThankYou',
    category: 'social-proof',
    platforms: ['instagram', 'facebook', 'linkedin'],
    tags: ['testimonial', 'social-proof', 'customer'],
    isFavorite: false,
    usageCount: 32,
    createdAt: '2024-01-05T15:00:00Z',
    updatedAt: '2024-01-12T10:45:00Z',
  },
  {
    id: '4',
    name: 'Behind the Scenes',
    description: 'Give a peek behind your business',
    content: '📸 Behind the scenes at [Company Name]!\n\nEver wonder what happens behind closed doors? Here\'s a sneak peek into [what\'s happening].\n\n🎬 Swipe to see more!\n\n#BTS #BehindTheScenes #[Company]',
    category: 'engagement',
    platforms: ['instagram', 'tiktok'],
    tags: ['bts', 'engagement', 'authentic'],
    isFavorite: false,
    usageCount: 28,
    createdAt: '2024-01-03T12:00:00Z',
    updatedAt: '2024-01-10T16:30:00Z',
  },
  {
    id: '5',
    name: 'Hiring Announcement',
    description: 'Attract top talent to your team',
    content: '🎯 We\'re Hiring!\n\n[Company Name] is looking for a [Position] to join our amazing team!\n\n✅ What we offer:\n• [Benefit 1]\n• [Benefit 2]\n• [Benefit 3]\n\n📧 Apply now: [Link]\n\nKnow someone perfect for this role? Tag them! 👇\n\n#Hiring #JobOpening #JoinOurTeam',
    category: 'recruitment',
    platforms: ['linkedin', 'twitter', 'facebook'],
    tags: ['hiring', 'jobs', 'recruitment'],
    isFavorite: true,
    usageCount: 15,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-08T09:15:00Z',
  },
  {
    id: '6',
    name: 'Flash Sale',
    description: 'Create urgency with limited-time offers',
    content: '⚡️ FLASH SALE ⚡️\n\n[X]% OFF everything for the next [time period]!\n\n🔥 Don\'t miss out on:\n• [Product/Category 1]\n• [Product/Category 2]\n• [Product/Category 3]\n\n⏰ Ends [Date/Time]\n\nShop now: [Link]\n\n#FlashSale #LimitedTime #Sale',
    category: 'promotional',
    platforms: ['instagram', 'facebook', 'twitter'],
    tags: ['sale', 'promotion', 'urgency'],
    isFavorite: false,
    usageCount: 52,
    createdAt: '2023-12-28T14:00:00Z',
    updatedAt: '2024-01-05T11:30:00Z',
  },
]

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'educational', label: 'Educational' },
  { value: 'social-proof', label: 'Social Proof' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'recruitment', label: 'Recruitment' },
  { value: 'promotional', label: 'Promotional' },
]

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'instagram':
      return <Instagram className="w-3 h-3" />
    case 'twitter':
      return <Twitter className="w-3 h-3" />
    case 'facebook':
      return <Facebook className="w-3 h-3" />
    case 'linkedin':
      return <Linkedin className="w-3 h-3" />
    case 'youtube':
      return <Youtube className="w-3 h-3" />
    default:
      return null
  }
}

export function Templates() {
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

  // Create template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    content: '',
    category: 'announcement',
    platforms: [] as string[],
    tags: '',
  })

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    const matchesTab = activeTab === 'all' || (activeTab === 'favorites' && template.isFavorite)
    return matchesSearch && matchesCategory && matchesTab
  })

  const toggleFavorite = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t))
    )
    toast.success('Template updated')
  }

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    toast.success('Template deleted')
  }

  const copyTemplate = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Template copied to clipboard')
  }

  const useTemplate = (template: Template) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t))
    )
    copyTemplate(template.content)
  }

  const togglePlatform = (platform: string) => {
    setNewTemplate((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    const template: Template = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description,
      content: newTemplate.content,
      category: newTemplate.category,
      platforms: newTemplate.platforms,
      tags: newTemplate.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isFavorite: false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setTemplates((prev) => [template, ...prev])
    setIsCreateModalOpen(false)
    setNewTemplate({
      name: '',
      description: '',
      content: '',
      category: 'announcement',
      platforms: [],
      tags: '',
    })
    toast.success('Template created!')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            Templates
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Save and reuse your best-performing content
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="favorites">
            <Star className="w-4 h-4 mr-1" />
            Favorites
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'grid'
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'list'
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Templates Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-1 mt-1">
                        {template.description}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(template.id)
                      }}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          'w-5 h-5 transition-colors',
                          template.isFavorite
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300 hover:text-amber-400'
                        )}
                      />
                    </button>
                  </div>

                  <div
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-4 cursor-pointer"
                    onClick={() => {
                      setSelectedTemplate(template)
                      setIsPreviewModalOpen(true)
                    }}
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4 whitespace-pre-wrap">
                      {template.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {template.platforms.map((platform) => (
                      <div
                        key={platform}
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${getPlatformColor(platform)}20`, color: getPlatformColor(platform) }}
                      >
                        {getPlatformIcon(platform)}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="capitalize">
                      {template.category.replace('-', ' ')}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => useTemplate(template)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedTemplate(template)
                            setIsPreviewModalOpen(true)
                          }}>
                            <Type className="w-4 h-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">
                      Used {template.usageCount} times
                    </span>
                    <span className="text-xs text-slate-500">
                      {template.tags.length} tags
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Category</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Platforms</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Usage</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleFavorite(template.id)}>
                          <Star
                            className={cn(
                              'w-4 h-4',
                              template.isFavorite
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-300'
                            )}
                          />
                        </button>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {template.name}
                          </p>
                          <p className="text-xs text-slate-500">{template.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="capitalize">
                        {template.category.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {template.platforms.map((platform) => (
                          <div
                            key={platform}
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: `${getPlatformColor(platform)}20`,
                              color: getPlatformColor(platform),
                            }}
                          >
                            {getPlatformIcon(platform)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{template.usageCount} times</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => useTemplate(template)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template)
                            setIsPreviewModalOpen(true)
                          }}
                        >
                          <Type className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No templates found</h3>
          <p className="text-slate-500 mt-1">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Create your first template to get started'}
          </p>
          {!searchQuery && (
            <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      )}

      {/* Create Template Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Template Name *
              </label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Product Launch Announcement"
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <Input
                value={newTemplate.description}
                onChange={(e) =>
                  setNewTemplate((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="A brief description of when to use this template"
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Template Content *
              </label>
              <Textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your template content. Use placeholders like [Product Name] for variable content."
                className="mt-1.5 min-h-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <Select
                value={newTemplate.category}
                onValueChange={(v) => setNewTemplate((prev) => ({ ...prev, category: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Platforms
              </label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                      newTemplate.platforms.includes(platform.id)
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    )}
                  >
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tags (comma-separated)
              </label>
              <Input
                value={newTemplate.tags}
                onChange={(e) => setNewTemplate((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g., product, launch, announcement"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{selectedTemplate.description}</p>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedTemplate.content}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedTemplate.platforms.map((platform) => (
                  <div
                    key={platform}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${getPlatformColor(platform)}20`,
                      color: getPlatformColor(platform),
                    }}
                  >
                    {getPlatformIcon(platform)}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => selectedTemplate && useTemplate(selectedTemplate)}>
              <Copy className="w-4 h-4 mr-2" />
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
