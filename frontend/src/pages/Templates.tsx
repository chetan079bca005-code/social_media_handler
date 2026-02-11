import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Plus,
  Search,
  Grid3X3,
  List,
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
  Loader2,
  RefreshCw,
  TrendingUp,
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
import { cn, PLATFORMS, getPlatformColor } from '../lib/utils'
import toast from 'react-hot-toast'
import { templatesApi } from '../services/api'

interface Template {
  id: string
  name: string
  description: string
  content: string
  category: string
  platforms: string[]
  tags: string[]
  isPublic: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
  createdBy?: { id: string; name: string; avatarUrl?: string }
}

const DEFAULT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'educational', label: 'Educational' },
  { value: 'social-proof', label: 'Social Proof' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'recruitment', label: 'Recruitment' },
  { value: 'promotional', label: 'Promotional' },
]

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
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
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    content: '',
    category: 'general',
    platforms: [] as string[],
    tags: '',
    isPublic: false,
  })

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (categoryFilter !== 'all') params.category = categoryFilter
      if (searchQuery.trim()) params.search = searchQuery.trim()
      const res = await templatesApi.getAll(params)
      setTemplates(res?.data?.templates || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => fetchTemplates(), searchQuery ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchTemplates])

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error('Please fill in name and content')
      return
    }
    try {
      setSaving(true)
      const data = {
        name: newTemplate.name,
        description: newTemplate.description,
        content: newTemplate.content,
        category: newTemplate.category,
        platforms: newTemplate.platforms,
        tags: newTemplate.tags.split(',').map((t) => t.trim()).filter(Boolean),
        isPublic: newTemplate.isPublic,
      }

      if (isEditMode && selectedTemplate) {
        await templatesApi.update(selectedTemplate.id, data)
        toast.success('Template updated!')
      } else {
        await templatesApi.create(data)
        toast.success('Template created!')
      }

      setIsCreateModalOpen(false)
      resetForm()
      fetchTemplates()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      await templatesApi.delete(id)
      toast.success('Template deleted')
      fetchTemplates()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete template')
    }
  }

  const handleUseTemplate = async (template: Template) => {
    try {
      await templatesApi.use(template.id)
      navigator.clipboard.writeText(template.content)
      toast.success('Template copied to clipboard!')
      fetchTemplates()
    } catch {
      navigator.clipboard.writeText(template.content)
      toast.success('Template copied to clipboard!')
    }
  }

  const openEditModal = (template: Template) => {
    setSelectedTemplate(template)
    setNewTemplate({
      name: template.name,
      description: template.description || '',
      content: template.content,
      category: template.category || 'general',
      platforms: template.platforms || [],
      tags: (template.tags || []).join(', '),
      isPublic: template.isPublic || false,
    })
    setIsEditMode(true)
    setIsCreateModalOpen(true)
  }

  const resetForm = () => {
    setNewTemplate({ name: '', description: '', content: '', category: 'general', platforms: [], tags: '', isPublic: false })
    setIsEditMode(false)
    setSelectedTemplate(null)
  }

  const togglePlatform = (platform: string) => {
    setNewTemplate((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => { resetForm(); setIsCreateModalOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{templates.length}</p>
            <p className="text-xs text-slate-500">Total Templates</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {templates.reduce((sum, t) => sum + (t.usageCount || 0), 0)}
            </p>
            <p className="text-xs text-slate-500">Total Uses</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Grid3X3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {new Set(templates.map(t => t.category).filter(Boolean)).size}
            </p>
            <p className="text-xs text-slate-500">Categories</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Copy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {templates.filter(t => t.isPublic).length}
            </p>
            <p className="text-xs text-slate-500">Public</p>
          </div>
        </CardContent></Card>
      </div>

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
            {DEFAULT_CATEGORIES.map((cat) => (
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

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
          <span className="text-slate-500">Loading templates...</span>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <motion.div key={template.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
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
                    {template.isPublic && (
                      <Badge variant="secondary" size="sm" className="ml-2 shrink-0">Public</Badge>
                    )}
                  </div>

                  <div
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-4 cursor-pointer"
                    onClick={() => { setSelectedTemplate(template); setIsPreviewModalOpen(true) }}
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4 whitespace-pre-wrap">
                      {template.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {(template.platforms || []).map((platform) => (
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
                      {(template.category || 'general').replace('-', ' ')}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleUseTemplate(template)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedTemplate(template); setIsPreviewModalOpen(true) }}>
                            <Type className="w-4 h-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(template)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTemplate(template.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">Used {template.usageCount || 0} times</span>
                    <span className="text-xs text-slate-500">{(template.tags || []).length} tags</span>
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
                {templates.map((template) => (
                  <tr key={template.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{template.name}</p>
                        <p className="text-xs text-slate-500">{template.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="capitalize">
                        {(template.category || 'general').replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {(template.platforms || []).map((platform) => (
                          <div key={platform} className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${getPlatformColor(platform)}20`, color: getPlatformColor(platform) }}>
                            {getPlatformIcon(platform)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{template.usageCount || 0} times</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleUseTemplate(template)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(template)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteTemplate(template.id)}>
                          <Trash2 className="w-4 h-4" />
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

      {!loading && templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No templates found</h3>
          <p className="text-slate-500 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Create your first template to get started'}
          </p>
          {!searchQuery && (
            <Button className="mt-4" onClick={() => { resetForm(); setIsCreateModalOpen(true) }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      )}

      {/* Create / Edit Template Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => { setIsCreateModalOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Template' : 'Create New Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Template Name *</label>
              <Input value={newTemplate.name} onChange={(e) => setNewTemplate((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Product Launch Announcement" className="mt-1.5" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <Input value={newTemplate.description} onChange={(e) => setNewTemplate((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="A brief description of when to use this template" className="mt-1.5" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Template Content *</label>
              <Textarea value={newTemplate.content} onChange={(e) => setNewTemplate((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your template content. Use placeholders like [Product Name] for variable content."
                className="mt-1.5 min-h-50" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <Select value={newTemplate.category} onValueChange={(v) => setNewTemplate((prev) => ({ ...prev, category: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Platforms</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {PLATFORMS.map((platform) => (
                  <button key={platform.id} onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                      newTemplate.platforms.includes(platform.id)
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    )}>
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags (comma-separated)</label>
              <Input value={newTemplate.tags} onChange={(e) => setNewTemplate((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g., product, launch, announcement" className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTemplate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              {isEditMode ? 'Save Changes' : 'Create Template'}
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
                {(selectedTemplate.platforms || []).map((platform) => (
                  <div key={platform} className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${getPlatformColor(platform)}20`, color: getPlatformColor(platform) }}>
                    {getPlatformIcon(platform)}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(selectedTemplate.tags || []).map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              {selectedTemplate.createdBy && (
                <p className="text-xs text-slate-400">Created by {selectedTemplate.createdBy.name}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>Close</Button>
            <Button onClick={() => { if (selectedTemplate) handleUseTemplate(selectedTemplate); setIsPreviewModalOpen(false) }}>
              <Copy className="w-4 h-4 mr-2" />
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
