import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  Image,
  Video,
  FileText,
  Upload,
  Search,
  Grid3X3,
  List,
  Filter,
  Trash2,
  Download,
  Copy,
  MoreVertical,
  Folder,
  Plus,
  X,
  Check,
  Play,
  Loader2,
  ImageIcon,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
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
import { cn, formatFileSize, formatDate } from '../lib/utils'
import { mediaApi } from '../services/api'
import { useWorkspaceStore } from '../store'
import toast from 'react-hot-toast'

interface MediaFile {
  id: string
  name: string
  url: string
  thumbnailUrl: string
  type: 'image' | 'video' | 'document'
  mimeType: string
  size: number
  width?: number
  height?: number
  duration?: number
  createdAt: string
  folder?: string
  tags: string[]
}

interface Folder {
  id: string
  name: string
  color: string
  itemCount: number
}

const MOCK_FOLDERS: Folder[] = [
  { id: '1', name: 'Products', color: '#6366F1', itemCount: 24 },
  { id: '2', name: 'Team', color: '#8B5CF6', itemCount: 12 },
  { id: '3', name: 'Videos', color: '#EC4899', itemCount: 8 },
  { id: '4', name: 'Campaigns', color: '#F59E0B', itemCount: 36 },
  { id: '5', name: 'Branding', color: '#10B981', itemCount: 15 },
]

export function MediaLibrary() {
  const { currentWorkspace } = useWorkspaceStore()
  const [media, setMedia] = useState<MediaFile[]>([])
  const [folders] = useState<Folder[]>(MOCK_FOLDERS)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'document' | 'ai-generated'>('all')
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)

  const mapMediaFile = (item: any): MediaFile => {
    const mimeType = item.mimeType || 'application/octet-stream'
    const type = mimeType.startsWith('image/')
      ? 'image'
      : mimeType.startsWith('video/')
        ? 'video'
        : 'document'

    return {
      id: item.id,
      name: item.originalName || item.filename || 'Untitled',
      url: item.url,
      thumbnailUrl: item.thumbnailUrl || item.url,
      type,
      mimeType,
      size: item.size || 0,
      width: item.width,
      height: item.height,
      duration: item.duration,
      createdAt: item.createdAt,
      folder: item.folder?.name,
      tags: item.tags || [],
    }
  }

  const loadMedia = useCallback(async () => {
    if (!currentWorkspace?.id) {
      return
    }

    setIsLoadingMedia(true)
    try {
      const response = await mediaApi.getAll(currentWorkspace.id, {
        type: typeFilter === 'all' ? undefined : typeFilter,
        search: searchQuery || undefined,
        folderId: selectedFolder || undefined,
        page: 1,
        limit: 200,
      })

      const items = Array.isArray(response.data) ? response.data.map(mapMediaFile) : []
      setMedia(items)
    } catch (error) {
      toast.error('Failed to load media library')
    } finally {
      setIsLoadingMedia(false)
    }
  }, [currentWorkspace?.id, searchQuery, selectedFolder, typeFilter])

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  const filteredMedia = media.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    // Handle AI-generated filter specially
    let matchesType: boolean
    if (typeFilter === 'ai-generated') {
      matchesType = item.tags.includes('ai-generated')
    } else {
      matchesType = typeFilter === 'all' || item.type === typeFilter
    }
    
    const matchesFolder = !selectedFolder || item.folder === selectedFolder
    return matchesSearch && matchesType && matchesFolder
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          setIsUploadModalOpen(false)
          toast.success(`${acceptedFiles.length} file(s) uploaded successfully!`)
          loadMedia()
          return 0
        }
        return prev + 10
      })
    }, 200)
  }, [loadMedia])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    },
  })

  const toggleSelectMedia = (id: string) => {
    const newSelected = new Set(selectedMedia)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedMedia(newSelected)
  }

  const selectAll = () => {
    if (selectedMedia.size === filteredMedia.length) {
      setSelectedMedia(new Set())
    } else {
      setSelectedMedia(new Set(filteredMedia.map((m) => m.id)))
    }
  }

  const deleteSelected = () => {
    setMedia((prev) => prev.filter((m) => !selectedMedia.has(m.id)))
    toast.success(`${selectedMedia.size} item(s) deleted`)
    setSelectedMedia(new Set())
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            Media Library
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Manage all your images, videos, and files
          </p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="w-full sm:w-auto">
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Folders Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Folders</CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <button
              onClick={() => setSelectedFolder(null)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                !selectedFolder
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Folder className="w-4 h-4" />
              <span className="text-sm font-medium">All Files</span>
              <span className="ml-auto text-xs text-slate-500">{media.length}</span>
            </button>
            <Button variant="outline" size="sm" onClick={loadMedia} disabled={isLoadingMedia}>
              {isLoadingMedia ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.name)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                  selectedFolder === folder.name
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <Folder className="w-4 h-4" style={{ color: folder.color }} />
                <span className="text-sm font-medium">{folder.name}</span>
                <span className="ml-auto text-xs text-slate-500">{folder.itemCount}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-4 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="w-full sm:w-37.5">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="ai-generated">AI Generated</SelectItem>
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

          {/* Selection Actions */}
          {selectedMedia.size > 0 && (
            <div className="flex items-center gap-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedMedia.size === filteredMedia.length ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Select All
                  </>
                )}
              </Button>
              <span className="text-sm text-indigo-600 dark:text-indigo-400">
                {selectedMedia.size} selected
              </span>
              <div className="flex-1" />
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={deleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}

          {/* Media Grid */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all',
                    selectedMedia.has(item.id)
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                  onClick={() => setPreviewMedia(item)}
                >
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Selection Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSelectMedia(item.id)
                    }}
                    className={cn(
                      'absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      selectedMedia.has(item.id)
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'bg-white/80 border-white opacity-0 group-hover:opacity-100'
                    )}
                  >
                    {selectedMedia.has(item.id) && <Check className="w-4 h-4 text-white" />}
                  </button>

                  {/* Type Badge */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {item.tags.includes('ai-generated') && (
                      <Badge
                        variant="secondary"
                        className="bg-purple-500/80 text-white border-0"
                      >
                        <Sparkles className="w-3 h-3" />
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="bg-black/50 text-white border-0"
                    >
                      {item.type === 'video' ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                    </Badge>
                  </div>

                  {/* Play Button for Videos */}
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-slate-900 ml-1" />
                      </div>
                    </div>
                  )}

                  {/* File Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-slate-300">{formatFileSize(item.size)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-4 text-sm font-medium text-slate-500">
                        <button onClick={selectAll}>
                          <div
                            className={cn(
                              'w-5 h-5 rounded border-2 flex items-center justify-center',
                              selectedMedia.size === filteredMedia.length
                                ? 'bg-indigo-500 border-indigo-500'
                                : 'border-slate-300'
                            )}
                          >
                            {selectedMedia.size === filteredMedia.length && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </button>
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">Name</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">Type</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">Size</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">Date</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedia.map((item) => (
                      <tr
                        key={item.id}
                        className={cn(
                          'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer',
                          selectedMedia.has(item.id) && 'bg-indigo-50 dark:bg-indigo-900/20'
                        )}
                        onClick={() => setPreviewMedia(item)}
                      >
                        <td className="p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelectMedia(item.id)
                            }}
                          >
                            <div
                              className={cn(
                                'w-5 h-5 rounded border-2 flex items-center justify-center',
                                selectedMedia.has(item.id)
                                  ? 'bg-indigo-500 border-indigo-500'
                                  : 'border-slate-300'
                              )}
                            >
                              {selectedMedia.has(item.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.thumbnailUrl}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className="capitalize">
                            {getTypeIcon(item.type)}
                            <span className="ml-1">{item.type}</span>
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-slate-500">{formatFileSize(item.size)}</td>
                        <td className="p-4 text-sm text-slate-500">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                copyUrl(item.url)
                              }}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy URL
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {filteredMedia.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No media found</h3>
              <p className="text-slate-500 mt-1">
                {searchQuery ? 'Try adjusting your search' : 'Upload some files to get started'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-500 mx-auto animate-spin" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Uploading...
                  </p>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{uploadProgress}% complete</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-xs text-slate-500 mt-1">or click to browse</p>
                <p className="text-xs text-slate-400 mt-4">
                  Supports: JPG, PNG, GIF, WEBP, MP4, MOV, AVI, WEBM
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewMedia?.name}</DialogTitle>
          </DialogHeader>
          {previewMedia && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                {previewMedia.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-16 h-16 text-slate-400" />
                  </div>
                ) : (
                  <img
                    src={previewMedia.url}
                    alt={previewMedia.name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Size</p>
                  <p className="text-sm font-medium">{formatFileSize(previewMedia.size)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Dimensions</p>
                  <p className="text-sm font-medium">
                    {previewMedia.width} × {previewMedia.height}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="text-sm font-medium">{previewMedia.mimeType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Uploaded</p>
                  <p className="text-sm font-medium">{formatDate(previewMedia.createdAt)}</p>
                </div>
              </div>
              {previewMedia.tags.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {previewMedia.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => copyUrl(previewMedia?.url || '')}>
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
