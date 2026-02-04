import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import * as fabric from 'fabric'
import { v4 as uuidv4 } from 'uuid'
import {
  Type,
  Square,
  Circle,
  Triangle,
  Image as ImageIcon,
  Layers,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  MoveUp,
  MoveDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Bold,
  Italic,
  Underline,
  Palette,
  Minus,
  Plus,
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Star,
  Heart,
  Hexagon,
  Pentagon,
  Octagon,
  MousePointer2,
  PenTool,
  Sparkles,
  Save,
  FolderOpen,
  FileJson,
  Grid3X3,
  Maximize2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Upload,
  FileImage,
  LayoutTemplate,
  Send,
  Calendar,
  Wand2,
  Loader2,
  AlertCircle,
  Sticker,
  MessageSquare,
  Award,
  ArrowRight,
  ArrowLeft,
  // New imports for enhanced features
  Crop,
  SunMedium,
  Contrast,
  Droplets,
  ImageOff,
  FileText,
  Shapes,
  Maximize,
  RefreshCw,
  Filter,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  Info,
  Palette as PaletteIcon,
  // New professional tools imports
  Lasso,
  CircleDot,
  SquareDashed,
  Eraser,
  Stamp,
  Paintbrush,
  PaintBucket,
  Pencil,
  Pipette,
  Ruler,
  Target,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../components/ui/Tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/Dialog'
import { Switch } from '../components/ui/Switch'
import { postsApi, socialAccountsApi } from '../services/api'
import { generateText } from '../services/ai'
import toast from 'react-hot-toast'

// ============ Types ============
interface CanvasTemplate {
  id: string
  name: string
  width: number
  height: number
  category: string
  thumbnail?: string
}

interface LayerItem {
  id: string
  name: string
  type: string
  visible: boolean
  locked: boolean
  object: fabric.FabricObject
}

interface HistoryState {
  json: string
  timestamp: number
}

interface SocialAccount {
  id: string
  platform: string
  accountName: string
  profileImageUrl?: string
}

// ============ Constants ============
const CANVAS_TEMPLATES: CanvasTemplate[] = [
  { id: '1', name: 'Instagram Post', width: 1080, height: 1080, category: 'Social Media' },
  { id: '2', name: 'Instagram Story', width: 1080, height: 1920, category: 'Social Media' },
  { id: '3', name: 'Facebook Post', width: 1200, height: 630, category: 'Social Media' },
  { id: '4', name: 'Facebook Cover', width: 820, height: 312, category: 'Social Media' },
  { id: '5', name: 'Twitter Post', width: 1200, height: 675, category: 'Social Media' },
  { id: '6', name: 'Twitter Header', width: 1500, height: 500, category: 'Social Media' },
  { id: '7', name: 'LinkedIn Post', width: 1200, height: 627, category: 'Social Media' },
  { id: '8', name: 'LinkedIn Banner', width: 1584, height: 396, category: 'Social Media' },
  { id: '9', name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Video' },
  { id: '10', name: 'Pinterest Pin', width: 1000, height: 1500, category: 'Social Media' },
  { id: '11', name: 'A4 Document', width: 2480, height: 3508, category: 'Print' },
  { id: '12', name: 'Presentation 16:9', width: 1920, height: 1080, category: 'Presentation' },
  { id: '13', name: 'Business Card', width: 1050, height: 600, category: 'Print' },
  { id: '14', name: 'Flyer', width: 1275, height: 1875, category: 'Print' },
  { id: '15', name: 'Custom', width: 800, height: 600, category: 'Custom' },
]

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Arial Black',
  'Palatino',
  'Garamond',
  'Bookman',
  'Tahoma',
  'Lucida Console',
]

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#008000', '#000080', '#800000', '#008080', '#808080', '#C0C0C0',
  '#FFD700', '#FF69B4', '#4B0082', '#7FFF00', '#DC143C', '#00CED1', '#9400D3', '#FF4500',
  '#2E8B57', '#4169E1', '#8B4513', '#DDA0DD', '#F0E68C', '#E6E6FA', '#FFF0F5', '#F5F5DC',
]

const GRADIENTS = [
  { name: 'Sunset', colors: ['#FF512F', '#DD2476'] },
  { name: 'Ocean', colors: ['#2193b0', '#6dd5ed'] },
  { name: 'Purple', colors: ['#7F00FF', '#E100FF'] },
  { name: 'Peach', colors: ['#FFECD2', '#FCB69F'] },
  { name: 'Cool', colors: ['#2193b0', '#6dd5ed'] },
  { name: 'Warm', colors: ['#F2994A', '#F2C94C'] },
  { name: 'Nature', colors: ['#11998e', '#38ef7d'] },
  { name: 'Royal', colors: ['#141E30', '#243B55'] },
]

const STICKERS = [
  { id: 'emoji-smile', icon: '😊', category: 'Emoji' },
  { id: 'emoji-heart', icon: '❤️', category: 'Emoji' },
  { id: 'emoji-fire', icon: '🔥', category: 'Emoji' },
  { id: 'emoji-star', icon: '⭐', category: 'Emoji' },
  { id: 'emoji-rocket', icon: '🚀', category: 'Emoji' },
  { id: 'emoji-party', icon: '🎉', category: 'Emoji' },
  { id: 'emoji-thumbs', icon: '👍', category: 'Emoji' },
  { id: 'emoji-clap', icon: '👏', category: 'Emoji' },
  { id: 'emoji-100', icon: '💯', category: 'Emoji' },
  { id: 'emoji-sparkle', icon: '✨', category: 'Emoji' },
  { id: 'emoji-crown', icon: '👑', category: 'Emoji' },
  { id: 'emoji-money', icon: '💰', category: 'Emoji' },
  { id: 'emoji-camera', icon: '📸', category: 'Emoji' },
  { id: 'emoji-coffee', icon: '☕', category: 'Emoji' },
  { id: 'emoji-sun', icon: '☀️', category: 'Emoji' },
  { id: 'emoji-moon', icon: '🌙', category: 'Emoji' },
  { id: 'emoji-rainbow', icon: '🌈', category: 'Emoji' },
  { id: 'emoji-gift', icon: '🎁', category: 'Emoji' },
  { id: 'emoji-trophy', icon: '🏆', category: 'Emoji' },
  { id: 'emoji-target', icon: '🎯', category: 'Emoji' },
  { id: 'arrow-right', icon: '→', category: 'Arrows' },
  { id: 'arrow-left', icon: '←', category: 'Arrows' },
  { id: 'arrow-up', icon: '↑', category: 'Arrows' },
  { id: 'arrow-down', icon: '↓', category: 'Arrows' },
  { id: 'check', icon: '✓', category: 'Symbols' },
  { id: 'cross', icon: '✗', category: 'Symbols' },
  { id: 'plus', icon: '+', category: 'Symbols' },
  { id: 'bullet', icon: '•', category: 'Symbols' },
  { id: 'star-symbol', icon: '★', category: 'Symbols' },
  { id: 'heart-symbol', icon: '♥', category: 'Symbols' },
]

// ============ Photo Filters ============
const PHOTO_FILTERS = [
  { id: 'none', name: 'None', filter: null },
  { id: 'grayscale', name: 'Grayscale', filter: new fabric.filters.Grayscale() },
  { id: 'sepia', name: 'Sepia', filter: new fabric.filters.Sepia() },
  { id: 'invert', name: 'Invert', filter: new fabric.filters.Invert() },
  { id: 'blur', name: 'Blur', filter: new fabric.filters.Blur({ blur: 0.5 }) },
  { id: 'sharpen', name: 'Sharpen', filter: new fabric.filters.Convolute({ matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0] }) },
  { id: 'emboss', name: 'Emboss', filter: new fabric.filters.Convolute({ matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1] }) },
  { id: 'vintage', name: 'Vintage', filter: new fabric.filters.Sepia() },
]

// ============ Design Templates ============
const DESIGN_TEMPLATES = [
  { 
    id: 'social-quote', 
    name: 'Quote Post', 
    category: 'Social Media',
    thumbnail: '💬',
    elements: [
      { type: 'rect', props: { fill: '#6366f1', width: 1080, height: 1080, left: 0, top: 0 } },
      { type: 'text', props: { text: '"Your quote here"', fontSize: 48, fontFamily: 'Georgia', fill: '#ffffff', left: 100, top: 400, textAlign: 'center' } },
      { type: 'text', props: { text: '- Author Name', fontSize: 24, fontFamily: 'Arial', fill: '#e0e7ff', left: 100, top: 550 } },
    ]
  },
  { 
    id: 'promo-sale', 
    name: 'Sale Banner', 
    category: 'Marketing',
    thumbnail: '🏷️',
    elements: [
      { type: 'rect', props: { fill: '#ef4444', width: 1200, height: 630, left: 0, top: 0 } },
      { type: 'text', props: { text: 'SALE', fontSize: 120, fontFamily: 'Impact', fill: '#ffffff', left: 450, top: 200 } },
      { type: 'text', props: { text: '50% OFF', fontSize: 60, fontFamily: 'Arial Black', fill: '#fef08a', left: 420, top: 350 } },
      { type: 'text', props: { text: 'Limited Time Offer', fontSize: 28, fontFamily: 'Arial', fill: '#ffffff', left: 450, top: 450 } },
    ]
  },
  { 
    id: 'story-gradient', 
    name: 'Gradient Story', 
    category: 'Social Media',
    thumbnail: '🌈',
    elements: [
      { type: 'gradient', props: { colors: ['#7c3aed', '#db2777'], width: 1080, height: 1920 } },
      { type: 'text', props: { text: 'Your Story', fontSize: 72, fontFamily: 'Arial Black', fill: '#ffffff', left: 200, top: 800 } },
    ]
  },
  { 
    id: 'minimalist', 
    name: 'Minimalist', 
    category: 'Business',
    thumbnail: '⬜',
    elements: [
      { type: 'rect', props: { fill: '#ffffff', width: 1080, height: 1080, left: 0, top: 0 } },
      { type: 'line', props: { stroke: '#000000', strokeWidth: 2, x1: 100, y1: 540, x2: 980, y2: 540 } },
      { type: 'text', props: { text: 'MINIMALIST', fontSize: 48, fontFamily: 'Helvetica', fill: '#000000', left: 340, top: 480 } },
    ]
  },
  { 
    id: 'announcement', 
    name: 'Announcement', 
    category: 'Business',
    thumbnail: '📢',
    elements: [
      { type: 'rect', props: { fill: '#1e293b', width: 1200, height: 627, left: 0, top: 0 } },
      { type: 'text', props: { text: '🎉 BIG NEWS!', fontSize: 64, fontFamily: 'Arial Black', fill: '#ffffff', left: 350, top: 200 } },
      { type: 'text', props: { text: 'We have something exciting to share', fontSize: 28, fontFamily: 'Arial', fill: '#94a3b8', left: 300, top: 320 } },
    ]
  },
]

// ============ Brand Kit Interface ============
interface BrandKit {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fonts: string[]
  logo?: string
}

// ============ Professional Tools ============
const SELECTION_TOOLS = [
  { id: 'select', name: 'Select', icon: MousePointer2, description: 'Select and move objects' },
  { id: 'lasso', name: 'Lasso', icon: Lasso, description: 'Freehand selection' },
  { id: 'marquee-rect', name: 'Rectangle Marquee', icon: SquareDashed, description: 'Rectangular selection' },
  { id: 'marquee-ellipse', name: 'Ellipse Marquee', icon: CircleDot, description: 'Elliptical selection' },
  { id: 'magic-wand', name: 'Magic Wand', icon: Wand2, description: 'Select by color' },
  { id: 'quick-select', name: 'Quick Selection', icon: Target, description: 'Smart selection brush' },
]

const RETOUCHING_TOOLS = [
  { id: 'healing-brush', name: 'Healing Brush', icon: Eraser, description: 'Blend imperfections' },
  { id: 'spot-healing', name: 'Spot Healing', icon: CircleDot, description: 'Quick spot removal' },
  { id: 'clone-stamp', name: 'Clone Stamp', icon: Stamp, description: 'Copy pixels from one area' },
  { id: 'brush', name: 'Brush', icon: Paintbrush, description: 'Paint with brush strokes' },
  { id: 'pencil', name: 'Pencil', icon: Pencil, description: 'Draw precise lines' },
  { id: 'eraser', name: 'Eraser', icon: Eraser, description: 'Erase pixels' },
]

const FILL_TOOLS = [
  { id: 'paint-bucket', name: 'Paint Bucket', icon: PaintBucket, description: 'Fill with solid color' },
  { id: 'gradient', name: 'Gradient Fill', icon: Palette, description: 'Fill with gradient' },
]

const MEASUREMENT_TOOLS = [
  { id: 'eyedropper', name: 'Eyedropper', icon: Pipette, description: 'Sample colors' },
  { id: 'ruler', name: 'Ruler', icon: Ruler, description: 'Measure distances' },
]

// ============ Elements Library ============
const ELEMENTS_LIBRARY = {
  lines: [
    { id: 'line-solid', name: 'Solid Line', path: 'M 0 0 L 100 0' },
    { id: 'line-dashed', name: 'Dashed Line', path: 'M 0 0 L 100 0', strokeDashArray: [10, 5] },
    { id: 'line-dotted', name: 'Dotted Line', path: 'M 0 0 L 100 0', strokeDashArray: [2, 5] },
    { id: 'line-arrow', name: 'Arrow Line', path: 'M 0 10 L 90 10 L 85 5 M 90 10 L 85 15' },
    { id: 'line-double', name: 'Double Line', path: 'M 0 0 L 100 0 M 0 5 L 100 5' },
    { id: 'line-wavy', name: 'Wavy Line', path: 'M 0 10 Q 10 0 20 10 T 40 10 T 60 10 T 80 10 T 100 10' },
    { id: 'line-zigzag', name: 'Zigzag Line', path: 'M 0 10 L 10 0 L 20 10 L 30 0 L 40 10 L 50 0 L 60 10 L 70 0 L 80 10 L 90 0 L 100 10' },
  ],
  frames: [
    { id: 'frame-square', name: 'Square Frame', type: 'rect', props: { fill: 'transparent', stroke: '#000', strokeWidth: 3, width: 200, height: 200 } },
    { id: 'frame-circle', name: 'Circle Frame', type: 'circle', props: { fill: 'transparent', stroke: '#000', strokeWidth: 3, radius: 100 } },
    { id: 'frame-rounded', name: 'Rounded Frame', type: 'rect', props: { fill: 'transparent', stroke: '#000', strokeWidth: 3, width: 200, height: 200, rx: 20, ry: 20 } },
    { id: 'frame-double', name: 'Double Frame', type: 'rect', props: { fill: 'transparent', stroke: '#000', strokeWidth: 6, width: 200, height: 200 } },
    { id: 'frame-oval', name: 'Oval Frame', type: 'ellipse', props: { fill: 'transparent', stroke: '#000', strokeWidth: 3, rx: 120, ry: 80 } },
    { id: 'frame-hexagon', name: 'Hexagon Frame', type: 'polygon', points: 6, props: { fill: 'transparent', stroke: '#000', strokeWidth: 3, radius: 100 } },
    { id: 'frame-octagon', name: 'Octagon Frame', type: 'polygon', points: 8, props: { fill: 'transparent', stroke: '#000', strokeWidth: 3, radius: 100 } },
    { id: 'frame-star', name: 'Star Frame', type: 'star', points: 5, props: { fill: 'transparent', stroke: '#000', strokeWidth: 3, radius: 100 } },
    { id: 'frame-heart', name: 'Heart Frame', type: 'path', path: 'M 50 30 C 20 0 0 30 50 80 C 100 30 80 0 50 30', props: { fill: 'transparent', stroke: '#000', strokeWidth: 3, scaleX: 2, scaleY: 2 } },
    { id: 'frame-cloud', name: 'Cloud Frame', type: 'path', path: 'M 25 60 Q 10 60 10 45 Q 10 30 25 30 Q 25 15 45 15 Q 65 15 70 30 Q 85 25 90 40 Q 95 55 80 60 Z', props: { fill: 'transparent', stroke: '#000', strokeWidth: 3, scaleX: 2.5, scaleY: 2.5 } },
    { id: 'frame-polaroid', name: 'Polaroid Frame', type: 'rect', props: { fill: '#ffffff', stroke: '#ddd', strokeWidth: 1, width: 200, height: 240, shadow: true } },
    { id: 'frame-vintage', name: 'Vintage Frame', type: 'rect', props: { fill: 'transparent', stroke: '#8B4513', strokeWidth: 8, width: 200, height: 200 } },
  ],
  icons: [
    { id: 'icon-check', name: 'Checkmark', svg: '✓' },
    { id: 'icon-x', name: 'X Mark', svg: '✗' },
    { id: 'icon-star', name: 'Star', svg: '★' },
    { id: 'icon-star-outline', name: 'Star Outline', svg: '☆' },
    { id: 'icon-heart', name: 'Heart', svg: '♥' },
    { id: 'icon-heart-outline', name: 'Heart Outline', svg: '♡' },
    { id: 'icon-arrow-r', name: 'Arrow Right', svg: '→' },
    { id: 'icon-arrow-l', name: 'Arrow Left', svg: '←' },
    { id: 'icon-arrow-u', name: 'Arrow Up', svg: '↑' },
    { id: 'icon-arrow-d', name: 'Arrow Down', svg: '↓' },
    { id: 'icon-bullet', name: 'Bullet', svg: '•' },
    { id: 'icon-diamond', name: 'Diamond', svg: '◆' },
    { id: 'icon-circle', name: 'Circle', svg: '●' },
    { id: 'icon-circle-outline', name: 'Circle Outline', svg: '○' },
    { id: 'icon-square', name: 'Square', svg: '■' },
    { id: 'icon-triangle', name: 'Triangle', svg: '▲' },
    { id: 'icon-music', name: 'Music Note', svg: '♪' },
    { id: 'icon-sun', name: 'Sun', svg: '☀' },
    { id: 'icon-moon', name: 'Moon', svg: '☽' },
    { id: 'icon-cloud', name: 'Cloud', svg: '☁' },
    { id: 'icon-lightning', name: 'Lightning', svg: '⚡' },
    { id: 'icon-fire', name: 'Fire', svg: '🔥' },
    { id: 'icon-sparkle', name: 'Sparkle', svg: '✨' },
    { id: 'icon-crown', name: 'Crown', svg: '👑' },
  ],
  decorations: [
    { id: 'deco-wave', name: 'Wave', path: 'M 0 50 Q 25 0, 50 50 T 100 50' },
    { id: 'deco-zigzag', name: 'Zigzag', path: 'M 0 50 L 25 0 L 50 50 L 75 0 L 100 50' },
    { id: 'deco-spiral', name: 'Spiral', path: 'M 50 50 m -40 0 a 40 40 0 1 1 80 0 a 30 30 0 1 1 -60 0 a 20 20 0 1 1 40 0' },
    { id: 'deco-swirl', name: 'Swirl', path: 'M 10 80 Q 30 10, 50 50 T 90 20' },
    { id: 'deco-ribbon', name: 'Ribbon', path: 'M 0 30 L 20 30 L 30 50 L 40 30 L 100 30 L 90 50 L 100 70 L 40 70 L 30 50 L 20 70 L 0 70 L 10 50 Z' },
    { id: 'deco-banner', name: 'Banner', path: 'M 10 20 L 90 20 L 90 60 L 50 80 L 10 60 Z' },
    { id: 'deco-burst', name: 'Burst', path: 'M 50 0 L 60 35 L 100 35 L 70 55 L 80 90 L 50 70 L 20 90 L 30 55 L 0 35 L 40 35 Z' },
    { id: 'deco-badge', name: 'Badge', path: 'M 50 0 L 65 35 L 100 40 L 75 65 L 85 100 L 50 80 L 15 100 L 25 65 L 0 40 L 35 35 Z' },
    { id: 'deco-divider-1', name: 'Divider 1', path: 'M 0 50 L 30 50 L 35 40 L 40 60 L 45 40 L 50 60 L 55 40 L 60 60 L 65 40 L 70 50 L 100 50' },
    { id: 'deco-corner', name: 'Corner', path: 'M 0 0 L 30 0 Q 50 0 50 20 L 50 50 Q 50 70 30 70 L 0 70' },
  ],
  arrows: [
    { id: 'arrow-simple', name: 'Simple Arrow', path: 'M 0 50 L 70 50 L 70 30 L 100 55 L 70 80 L 70 60 L 0 60 Z' },
    { id: 'arrow-curved', name: 'Curved Arrow', path: 'M 10 70 Q 10 10, 70 10 L 70 0 L 90 20 L 70 40 L 70 30 Q 30 30, 30 70 Z' },
    { id: 'arrow-double', name: 'Double Arrow', path: 'M 0 30 L 20 50 L 0 70 L 0 55 L 80 55 L 80 70 L 100 50 L 80 30 L 80 45 L 0 45 Z' },
    { id: 'arrow-block', name: 'Block Arrow', path: 'M 0 30 L 60 30 L 60 10 L 100 50 L 60 90 L 60 70 L 0 70 Z' },
    { id: 'arrow-chevron', name: 'Chevron Arrow', path: 'M 0 0 L 70 0 L 100 50 L 70 100 L 0 100 L 30 50 Z' },
  ],
  badges: [
    { id: 'badge-circle', name: 'Circle Badge', type: 'circle', props: { fill: '#6366f1', radius: 60 } },
    { id: 'badge-star', name: 'Star Badge', type: 'star', points: 5, props: { fill: '#f59e0b', radius: 60, innerRadius: 30 } },
    { id: 'badge-ribbon', name: 'Ribbon Badge', path: 'M 20 0 L 80 0 L 80 80 L 50 60 L 20 80 Z', props: { fill: '#ef4444' } },
    { id: 'badge-seal', name: 'Seal Badge', type: 'star', points: 12, props: { fill: '#10b981', radius: 60, innerRadius: 45 } },
    { id: 'badge-shield', name: 'Shield Badge', path: 'M 50 0 L 95 15 L 95 50 Q 95 90 50 100 Q 5 90 5 50 L 5 15 Z', props: { fill: '#3b82f6' } },
  ],
}

// ============ Design Studio Component ============
export function DesignStudio() {
  const navigate = useNavigate()
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // State
  const [activePanel, setActivePanel] = useState<string>('templates')
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null)
  const [layers, setLayers] = useState<LayerItem[]>([])
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 })
  const [zoom, setZoom] = useState(0.5)
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showTemplateModal, setShowTemplateModal] = useState(true)
  const [customWidth, setCustomWidth] = useState(800)
  const [customHeight, setCustomHeight] = useState(600)
  
  // Text properties
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [textColor, setTextColor] = useState('#000000')
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [textAlign, setTextAlign] = useState('left')

  // Shape/Object properties
  const [fillColor, setFillColor] = useState('#6366f1')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(0)
  const [opacity, setOpacity] = useState(100)
  const [cornerRadius, setCornerRadius] = useState(0)

  // Drawing properties
  const [brushColor, setBrushColor] = useState('#000000')
  const [brushWidth, setBrushWidth] = useState(5)

  // Post Modal State
  const [showPostModal, setShowPostModal] = useState(false)
  const [postCaption, setPostCaption] = useState('')
  const [postHashtags, setPostHashtags] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [isPosting, setIsPosting] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false)
  const [designName, setDesignName] = useState('Untitled Design')

  // ============ NEW: Professional Tools State ============
  const [activeTool, setActiveTool] = useState<string>('select')
  const [isCloning, setIsCloning] = useState(false)
  const [cloneSource, setCloneSource] = useState<{ x: number; y: number } | null>(null)
  const [sampledColor, setSampledColor] = useState<string>('#000000')
  const [measureDistance, setMeasureDistance] = useState<number | null>(null)
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null)
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null)

  // ============ NEW: Photo Editing State ============
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [saturation, setSaturation] = useState(0)
  const [blur, setBlur] = useState(0)
  const [selectedFilter, setSelectedFilter] = useState('none')
  const [isRemovingBackground, setIsRemovingBackground] = useState(false)
  const [isCropping, setIsCropping] = useState(false)
  const [cropRect, setCropRect] = useState<fabric.Rect | null>(null)

  // ============ NEW: Brand Kit State ============
  const [brandKits, setBrandKits] = useState<BrandKit[]>([
    { id: '1', name: 'Default Brand', primaryColor: '#6366f1', secondaryColor: '#818cf8', accentColor: '#c7d2fe', fonts: ['Arial', 'Helvetica'] }
  ])
  const [selectedBrandKit, setSelectedBrandKit] = useState<BrandKit | null>(null)
  const [showBrandKitModal, setShowBrandKitModal] = useState(false)
  const [newBrandKit, setNewBrandKit] = useState<Partial<BrandKit>>({
    name: '',
    primaryColor: '#6366f1',
    secondaryColor: '#818cf8',
    accentColor: '#c7d2fe',
    fonts: ['Arial'],
  })

  // ============ NEW: AI Magic Studio State ============
  const [showMagicStudioModal, setShowMagicStudioModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // ============ NEW: Elements Library State ============
  const [elementsCategory, setElementsCategory] = useState<'lines' | 'frames' | 'icons' | 'decorations' | 'arrows' | 'badges'>('lines')

  // ============ NEW: Pages State ============
  interface PageData {
    id: string
    name: string
    canvasJSON: string
    thumbnail?: string
  }
  const [pages, setPages] = useState<PageData[]>([{ id: '1', name: 'Page 1', canvasJSON: '' }])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  // ============ Fetch Social Accounts ============
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await socialAccountsApi.getAll()
        if (Array.isArray(response)) {
          setSocialAccounts(response)
        }
      } catch (error) {
        console.error('Error fetching social accounts:', error)
      }
    }
    fetchAccounts()
  }, [])

  // ============ Update Layers ============
  const updateLayers = useCallback(() => {
    if (!fabricCanvasRef.current) return

    const objects = fabricCanvasRef.current.getObjects()
    const newLayers: LayerItem[] = objects.map((obj: fabric.FabricObject, index: number) => ({
      id: (obj as any).id || uuidv4(),
      name: (obj as any).name || `${obj.type} ${index + 1}`,
      type: obj.type || 'object',
      visible: obj.visible !== false,
      locked: !obj.selectable,
      object: obj,
    })).reverse()

    setLayers(newLayers)
  }, [])

  // ============ Save to History ============
  const saveToHistory = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const json = JSON.stringify(fabricCanvasRef.current.toJSON())
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ json, timestamp: Date.now() })
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift()
    }
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  // ============ Update properties from selected object ============
  const updatePropertiesFromObject = useCallback((obj: fabric.FabricObject | undefined) => {
    if (!obj) return

    setOpacity(Math.round((obj.opacity || 1) * 100))
    
    if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
      const textObj = obj as fabric.IText
      setFontSize(textObj.fontSize || 24)
      setFontFamily(textObj.fontFamily || 'Arial')
      setTextColor((textObj.fill as string) || '#000000')
      setIsBold(textObj.fontWeight === 'bold')
      setIsItalic(textObj.fontStyle === 'italic')
      setIsUnderline(textObj.underline || false)
      setTextAlign(textObj.textAlign || 'left')
    } else {
      setFillColor((obj.fill as string) || '#6366f1')
      setStrokeColor((obj.stroke as string) || '#000000')
      setStrokeWidth(obj.strokeWidth || 0)
    }
  }, [])

  // ============ Initialize Canvas ============
  const initializeCanvas = useCallback((width: number, height: number) => {
    if (!canvasRef.current) return

    // Dispose existing canvas
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose()
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: width * zoom,
      height: height * zoom,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    })

    canvas.setZoom(zoom)

    // Set up event listeners
    canvas.on('selection:created', (e: any) => {
      setSelectedObject(e.selected?.[0] || null)
      updatePropertiesFromObject(e.selected?.[0])
    })

    canvas.on('selection:updated', (e: any) => {
      setSelectedObject(e.selected?.[0] || null)
      updatePropertiesFromObject(e.selected?.[0])
    })

    canvas.on('selection:cleared', () => {
      setSelectedObject(null)
    })

    canvas.on('object:modified', () => {
      saveToHistory()
      updateLayers()
    })

    canvas.on('object:added', () => {
      updateLayers()
    })

    canvas.on('object:removed', () => {
      updateLayers()
    })

    fabricCanvasRef.current = canvas
    setCanvasSize({ width, height })
    saveToHistory()
    setShowTemplateModal(false)
  }, [zoom, updatePropertiesFromObject, saveToHistory, updateLayers])

  // ============ History Management ============
  const undo = useCallback(() => {
    if (historyIndex <= 0 || !fabricCanvasRef.current) return
    
    const newIndex = historyIndex - 1
    fabricCanvasRef.current.loadFromJSON(JSON.parse(history[newIndex].json)).then(() => {
      fabricCanvasRef.current?.renderAll()
      updateLayers()
      setHistoryIndex(newIndex)
    })
  }, [history, historyIndex, updateLayers])

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1 || !fabricCanvasRef.current) return
    
    const newIndex = historyIndex + 1
    fabricCanvasRef.current.loadFromJSON(JSON.parse(history[newIndex].json)).then(() => {
      fabricCanvasRef.current?.renderAll()
      updateLayers()
      setHistoryIndex(newIndex)
    })
  }, [history, historyIndex, updateLayers])

  // ============ Professional Tools Functions ============
  
  // Eyedropper Tool - Sample color from canvas
  const handleEyedropper = useCallback((x: number, y: number) => {
    if (!fabricCanvasRef.current) return
    
    const dataUrl = fabricCanvasRef.current.toDataURL()
    const img = new Image()
    img.onload = () => {
      const tempCanvas = document.createElement('canvas')
      const ctx = tempCanvas.getContext('2d')
      if (!ctx) return
      
      tempCanvas.width = img.width
      tempCanvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const pixel = ctx.getImageData(x, y, 1, 1).data
      const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('')
      
      setSampledColor(hex)
      setFillColor(hex)
      toast.success(`Color sampled: ${hex}`)
    }
    img.src = dataUrl
  }, [])

  // Ruler Tool - Measure distance
  const handleRulerStart = useCallback((x: number, y: number) => {
    setMeasureStart({ x, y })
    setMeasureEnd(null)
    setMeasureDistance(null)
  }, [])

  const handleRulerMove = useCallback((x: number, y: number) => {
    if (!measureStart) return
    
    setMeasureEnd({ x, y })
    const distance = Math.sqrt(
      Math.pow(x - measureStart.x, 2) + 
      Math.pow(y - measureStart.y, 2)
    )
    setMeasureDistance(Math.round(distance))
  }, [measureStart])

  const handleRulerEnd = useCallback(() => {
    if (measureDistance !== null) {
      toast.success(`Distance: ${measureDistance}px`)
    }
  }, [measureDistance])

  // Clone Stamp Tool - Set source point
  const handleCloneSource = useCallback((x: number, y: number) => {
    setCloneSource({ x, y })
    setIsCloning(true)
    toast.success('Clone source set! Now paint to clone.')
  }, [])

  // Paint Bucket Tool - Fill shape with color
  const handlePaintBucket = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) {
      toast.error('Select a shape to fill')
      return
    }
    
    selectedObject.set('fill', fillColor)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
    toast.success('Shape filled!')
  }, [selectedObject, fillColor, saveToHistory])

  // Eraser Tool - Remove parts of drawing
  const handleEraser = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    fabricCanvasRef.current.isDrawingMode = true
    setIsDrawingMode(true)
    
    if (fabricCanvasRef.current.freeDrawingBrush) {
      // Use white color to "erase" on white background
      fabricCanvasRef.current.freeDrawingBrush.color = '#ffffff'
      fabricCanvasRef.current.freeDrawingBrush.width = brushWidth * 2
    }
    toast.success('Eraser tool activated - draw to erase')
  }, [brushWidth])

  // Canvas click handler for tools
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!fabricCanvasRef.current) return
    
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    switch (activeTool) {
      case 'eyedropper':
        handleEyedropper(x, y)
        break
      case 'ruler':
        if (!measureStart) {
          handleRulerStart(x, y)
        } else {
          handleRulerEnd()
          setMeasureStart(null)
        }
        break
      case 'clone-stamp':
        if (e.altKey) {
          handleCloneSource(x, y)
        }
        break
      case 'paint-bucket':
        handlePaintBucket()
        break
      case 'eraser':
        handleEraser()
        break
    }
  }, [activeTool, measureStart, handleEyedropper, handleRulerStart, handleRulerEnd, handleCloneSource, handlePaintBucket, handleEraser])

  // Canvas mouse move handler for tools
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'ruler' && measureStart) {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      handleRulerMove(x, y)
    }
  }, [activeTool, measureStart, handleRulerMove])

  // ============ Pages Management ============
  const saveCurrentPage = useCallback(() => {
    if (!fabricCanvasRef.current) return
    const json = JSON.stringify(fabricCanvasRef.current.toJSON())
    // Generate thumbnail
    const thumbnail = fabricCanvasRef.current.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.2 })
    
    setPages(prev => {
      const updated = [...prev]
      updated[currentPageIndex] = {
        ...updated[currentPageIndex],
        canvasJSON: json,
        thumbnail
      }
      return updated
    })
  }, [currentPageIndex])

  const addPage = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    // Save current page first
    saveCurrentPage()
    
    // Create new page
    const newPageId = uuidv4()
    const newPage = {
      id: newPageId,
      name: `Page ${pages.length + 1}`,
      canvasJSON: '',
      thumbnail: undefined
    }
    
    setPages(prev => [...prev, newPage])
    setCurrentPageIndex(pages.length)
    
    // Clear canvas for new page
    fabricCanvasRef.current.clear()
    fabricCanvasRef.current.backgroundColor = '#ffffff'
    fabricCanvasRef.current.renderAll()
    updateLayers()
    
    toast.success('New page added!')
  }, [pages.length, saveCurrentPage, updateLayers])

  const switchPage = useCallback((index: number) => {
    if (!fabricCanvasRef.current || index === currentPageIndex) return
    
    // Save current page
    saveCurrentPage()
    
    // Load the selected page
    setCurrentPageIndex(index)
    const pageToLoad = pages[index]
    
    if (pageToLoad.canvasJSON) {
      fabricCanvasRef.current.loadFromJSON(JSON.parse(pageToLoad.canvasJSON)).then(() => {
        fabricCanvasRef.current?.renderAll()
        updateLayers()
      })
    } else {
      fabricCanvasRef.current.clear()
      fabricCanvasRef.current.backgroundColor = '#ffffff'
      fabricCanvasRef.current.renderAll()
      updateLayers()
    }
  }, [currentPageIndex, pages, saveCurrentPage, updateLayers])

  const deletePage = useCallback((index: number) => {
    if (pages.length <= 1) {
      toast.error('Cannot delete the only page')
      return
    }
    
    setPages(prev => {
      const updated = prev.filter((_, i) => i !== index)
      return updated
    })
    
    // If we're deleting the current page, switch to another
    if (index === currentPageIndex) {
      const newIndex = index > 0 ? index - 1 : 0
      setCurrentPageIndex(newIndex)
      
      const pageToLoad = pages[newIndex !== index ? newIndex : newIndex + 1]
      if (pageToLoad?.canvasJSON && fabricCanvasRef.current) {
        fabricCanvasRef.current.loadFromJSON(JSON.parse(pageToLoad.canvasJSON)).then(() => {
          fabricCanvasRef.current?.renderAll()
          updateLayers()
        })
      }
    } else if (index < currentPageIndex) {
      setCurrentPageIndex(prev => prev - 1)
    }
    
    toast.success('Page deleted')
  }, [currentPageIndex, pages, updateLayers])

  const duplicatePage = useCallback((index: number) => {
    if (!fabricCanvasRef.current) return
    
    // Save current page first if it's the one being duplicated
    if (index === currentPageIndex) {
      saveCurrentPage()
    }
    
    const pageToDuplicate = pages[index]
    const newPage = {
      id: uuidv4(),
      name: `${pageToDuplicate.name} (Copy)`,
      canvasJSON: pageToDuplicate.canvasJSON,
      thumbnail: pageToDuplicate.thumbnail
    }
    
    setPages(prev => [...prev.slice(0, index + 1), newPage, ...prev.slice(index + 1)])
    toast.success('Page duplicated!')
  }, [currentPageIndex, pages, saveCurrentPage])

  const renamePage = useCallback((index: number, newName: string) => {
    setPages(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], name: newName }
      return updated
    })
  }, [])

  // ============ Add Elements ============
  const addText = useCallback(() => {
    if (!fabricCanvasRef.current) return

    const text = new fabric.IText('Double click to edit', {
      left: canvasSize.width / 2 - 100,
      top: canvasSize.height / 2 - 20,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      underline: isUnderline,
      textAlign: textAlign as any,
    })
    ;(text as any).id = uuidv4()
    ;(text as any).name = 'Text'

    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [canvasSize, fontSize, fontFamily, textColor, isBold, isItalic, isUnderline, textAlign, saveToHistory])

  const addHeading = useCallback(() => {
    if (!fabricCanvasRef.current) return

    const text = new fabric.IText('Heading', {
      left: canvasSize.width / 2 - 80,
      top: canvasSize.height / 2 - 30,
      fontSize: 48,
      fontFamily: 'Arial Black',
      fill: '#1e293b',
      fontWeight: 'bold',
    })
    ;(text as any).id = uuidv4()
    ;(text as any).name = 'Heading'

    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [canvasSize, saveToHistory])

  const addSubheading = useCallback(() => {
    if (!fabricCanvasRef.current) return

    const text = new fabric.IText('Subheading', {
      left: canvasSize.width / 2 - 60,
      top: canvasSize.height / 2 - 15,
      fontSize: 28,
      fontFamily: 'Arial',
      fill: '#475569',
    })
    ;(text as any).id = uuidv4()
    ;(text as any).name = 'Subheading'

    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [canvasSize, saveToHistory])

  const addBodyText = useCallback(() => {
    if (!fabricCanvasRef.current) return

    const text = new fabric.Textbox('Add your body text here. This is a text box that wraps automatically.', {
      left: canvasSize.width / 2 - 150,
      top: canvasSize.height / 2 - 30,
      width: 300,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#64748b',
    })
    ;(text as any).id = uuidv4()
    ;(text as any).name = 'Body Text'

    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [canvasSize, saveToHistory])

  // ============ Shape Helper Functions ============
  const createStarPoints = (spikes: number, outerRadius: number, innerRadius: number): fabric.XY[] => {
    const points: fabric.XY[] = []
    const step = Math.PI / spikes

    for (let i = 0; i < 2 * spikes; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = i * step - Math.PI / 2
      points.push({
        x: Math.cos(angle) * radius + outerRadius,
        y: Math.sin(angle) * radius + outerRadius,
      })
    }

    return points
  }

  const createPolygonPoints = (sides: number, radius: number): fabric.XY[] => {
    const points: fabric.XY[] = []
    const angle = (2 * Math.PI) / sides

    for (let i = 0; i < sides; i++) {
      points.push({
        x: Math.cos(i * angle - Math.PI / 2) * radius + radius,
        y: Math.sin(i * angle - Math.PI / 2) * radius + radius,
      })
    }

    return points
  }

  const addShape = useCallback((shapeType: string) => {
    if (!fabricCanvasRef.current) return

    let shape: fabric.FabricObject

    const baseLeft = canvasSize.width / 2 - 50
    const baseTop = canvasSize.height / 2 - 50

    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: baseLeft,
          top: baseTop,
          width: 150,
          height: 100,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
          rx: cornerRadius,
          ry: cornerRadius,
        })
        ;(shape as any).name = 'Rectangle'
        break
      case 'square':
        shape = new fabric.Rect({
          left: baseLeft,
          top: baseTop,
          width: 100,
          height: 100,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
          rx: cornerRadius,
          ry: cornerRadius,
        })
        ;(shape as any).name = 'Square'
        break
      case 'circle':
        shape = new fabric.Circle({
          left: baseLeft,
          top: baseTop,
          radius: 50,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Circle'
        break
      case 'ellipse':
        shape = new fabric.Ellipse({
          left: baseLeft,
          top: baseTop,
          rx: 75,
          ry: 50,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Ellipse'
        break
      case 'triangle':
        shape = new fabric.Triangle({
          left: baseLeft,
          top: baseTop,
          width: 100,
          height: 100,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Triangle'
        break
      case 'line':
        shape = new fabric.Line([50, 50, 200, 50], {
          left: canvasSize.width / 2 - 75,
          top: canvasSize.height / 2,
          stroke: fillColor,
          strokeWidth: 3,
        })
        ;(shape as any).name = 'Line'
        break
      case 'star':
        const starPoints = createStarPoints(5, 50, 25)
        shape = new fabric.Polygon(starPoints, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Star'
        break
      case 'heart':
        const heartPath = 'M 50 30 C 20 0 0 20 0 40 C 0 70 50 100 50 100 C 50 100 100 70 100 40 C 100 20 80 0 50 30 Z'
        shape = new fabric.Path(heartPath, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Heart'
        break
      case 'hexagon':
        const hexPoints = createPolygonPoints(6, 50)
        shape = new fabric.Polygon(hexPoints, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Hexagon'
        break
      case 'pentagon':
        const pentPoints = createPolygonPoints(5, 50)
        shape = new fabric.Polygon(pentPoints, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Pentagon'
        break
      case 'octagon':
        const octPoints = createPolygonPoints(8, 50)
        shape = new fabric.Polygon(octPoints, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Octagon'
        break
      case 'arrow':
        const arrowPoints: fabric.XY[] = [
          { x: 0, y: 20 },
          { x: 60, y: 20 },
          { x: 60, y: 0 },
          { x: 100, y: 30 },
          { x: 60, y: 60 },
          { x: 60, y: 40 },
          { x: 0, y: 40 },
        ]
        shape = new fabric.Polygon(arrowPoints, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Arrow Right'
        break
      case 'arrow-left':
        const arrowLeftPoints: fabric.XY[] = [
          { x: 100, y: 20 },
          { x: 40, y: 20 },
          { x: 40, y: 0 },
          { x: 0, y: 30 },
          { x: 40, y: 60 },
          { x: 40, y: 40 },
          { x: 100, y: 40 },
        ]
        shape = new fabric.Polygon(arrowLeftPoints, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Arrow Left'
        break
      case 'star-4':
        const star4Points = createStarPoints(4, 50, 20)
        shape = new fabric.Polygon(star4Points, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = '4-Point Star'
        break
      case 'star-6':
        const star6Points = createStarPoints(6, 50, 30)
        shape = new fabric.Polygon(star6Points, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = '6-Point Star'
        break
      case 'badge':
        const badgePoints = createStarPoints(12, 50, 40)
        shape = new fabric.Polygon(badgePoints, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Badge'
        break
      case 'speech-bubble':
        const bubblePath = 'M 10 0 L 90 0 Q 100 0 100 10 L 100 60 Q 100 70 90 70 L 40 70 L 20 90 L 25 70 L 10 70 Q 0 70 0 60 L 0 10 Q 0 0 10 0 Z'
        shape = new fabric.Path(bubblePath, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
          scaleX: 1.5,
          scaleY: 1.2,
        })
        ;(shape as any).name = 'Speech Bubble'
        break
      case 'callout':
        const calloutPath = 'M 0 0 L 100 0 L 100 60 L 60 60 L 50 80 L 40 60 L 0 60 Z'
        shape = new fabric.Path(calloutPath, {
          left: baseLeft,
          top: baseTop,
          fill: fillColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        })
        ;(shape as any).name = 'Callout'
        break
      default:
        return
    }

    ;(shape as any).id = uuidv4()
    fabricCanvasRef.current.add(shape)
    fabricCanvasRef.current.setActiveObject(shape)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [canvasSize, fillColor, strokeColor, strokeWidth, cornerRadius, saveToHistory])

  // ============ Image Handling ============
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !fabricCanvasRef.current) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imgElement = document.createElement('img')
        imgElement.src = event.target?.result as string
        imgElement.onload = () => {
          const img = new fabric.FabricImage(imgElement, {
            left: canvasSize.width / 2 - imgElement.width / 4,
            top: canvasSize.height / 2 - imgElement.height / 4,
            scaleX: 0.5,
            scaleY: 0.5,
          })
          ;(img as any).id = uuidv4()
          ;(img as any).name = file.name

          fabricCanvasRef.current?.add(img)
          fabricCanvasRef.current?.setActiveObject(img)
          fabricCanvasRef.current?.renderAll()
          saveToHistory()
        }
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    e.target.value = ''
  }, [canvasSize, saveToHistory])

  // ============ Object Manipulation ============
  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const activeObjects = fabricCanvasRef.current.getActiveObjects()
    activeObjects.forEach((obj: fabric.FabricObject) => {
      fabricCanvasRef.current?.remove(obj)
    })
    
    fabricCanvasRef.current.discardActiveObject()
    fabricCanvasRef.current.renderAll()
    setSelectedObject(null)
    saveToHistory()
  }, [saveToHistory])

  const duplicateSelected = useCallback(async () => {
    if (!fabricCanvasRef.current || !selectedObject) return

    const cloned = await selectedObject.clone()
    cloned.set({
      left: (selectedObject.left || 0) + 20,
      top: (selectedObject.top || 0) + 20,
    })
    ;(cloned as any).id = uuidv4()
    
    fabricCanvasRef.current.add(cloned)
    fabricCanvasRef.current.setActiveObject(cloned)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [selectedObject, saveToHistory])

  const copyToClipboard = useCallback(async () => {
    if (!selectedObject) return
    
    const cloned = await selectedObject.clone()
    localStorage.setItem('fabricClipboard', JSON.stringify(cloned.toJSON()))
  }, [selectedObject])

  const pasteFromClipboard = useCallback(async () => {
    if (!fabricCanvasRef.current) return

    const clipboardData = localStorage.getItem('fabricClipboard')
    if (!clipboardData) return

    try {
      const jsonData = JSON.parse(clipboardData)
      const objects = await fabric.util.enlivenObjects([jsonData])
      
      objects.forEach((obj) => {
        if (obj && typeof obj === 'object' && 'set' in obj) {
          const fabricObj = obj as fabric.FabricObject
          fabricObj.set({
            left: (fabricObj.left || 0) + 20,
            top: (fabricObj.top || 0) + 20,
          })
          ;(fabricObj as any).id = uuidv4()
          
          fabricCanvasRef.current?.add(fabricObj)
        }
      })
      
      fabricCanvasRef.current.renderAll()
      saveToHistory()
    } catch (error) {
      console.error('Error pasting:', error)
    }
  }, [saveToHistory])

  // ============ Alignment Functions ============
  const alignObject = useCallback((alignment: string) => {
    if (!fabricCanvasRef.current || !selectedObject) return

    switch (alignment) {
      case 'left':
        selectedObject.set('left', 0)
        break
      case 'center':
        selectedObject.set('left', (canvasSize.width - (selectedObject.width || 0) * (selectedObject.scaleX || 1)) / 2)
        break
      case 'right':
        selectedObject.set('left', canvasSize.width - (selectedObject.width || 0) * (selectedObject.scaleX || 1))
        break
      case 'top':
        selectedObject.set('top', 0)
        break
      case 'middle':
        selectedObject.set('top', (canvasSize.height - (selectedObject.height || 0) * (selectedObject.scaleY || 1)) / 2)
        break
      case 'bottom':
        selectedObject.set('top', canvasSize.height - (selectedObject.height || 0) * (selectedObject.scaleY || 1))
        break
    }

    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [selectedObject, canvasSize, saveToHistory])

  // ============ Layer Functions ============
  const bringForward = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return
    const objects = fabricCanvasRef.current.getObjects()
    const index = objects.indexOf(selectedObject)
    if (index < objects.length - 1) {
      fabricCanvasRef.current.moveObjectTo(selectedObject, index + 1)
      fabricCanvasRef.current.renderAll()
      saveToHistory()
    }
  }, [selectedObject, saveToHistory])

  const sendBackward = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return
    const objects = fabricCanvasRef.current.getObjects()
    const index = objects.indexOf(selectedObject)
    if (index > 0) {
      fabricCanvasRef.current.moveObjectTo(selectedObject, index - 1)
      fabricCanvasRef.current.renderAll()
      saveToHistory()
    }
  }, [selectedObject, saveToHistory])

  const bringToFront = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return
    const objects = fabricCanvasRef.current.getObjects()
    fabricCanvasRef.current.moveObjectTo(selectedObject, objects.length - 1)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [selectedObject, saveToHistory])

  const sendToBack = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return
    fabricCanvasRef.current.moveObjectTo(selectedObject, 0)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [selectedObject, saveToHistory])

  // ============ Transform Functions ============
  const rotateObject = useCallback((angle: number) => {
    if (!fabricCanvasRef.current || !selectedObject) return
    selectedObject.rotate((selectedObject.angle || 0) + angle)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [selectedObject, saveToHistory])

  const flipHorizontal = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return
    selectedObject.set('flipX', !selectedObject.flipX)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [selectedObject, saveToHistory])

  const flipVertical = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return
    selectedObject.set('flipY', !selectedObject.flipY)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [selectedObject, saveToHistory])

  // ============ Visibility & Lock ============
  const toggleVisibility = useCallback((layerId: string) => {
    const layer = layers.find((l) => l.id === layerId)
    if (!layer || !fabricCanvasRef.current) return

    layer.object.set('visible', !layer.visible)
    fabricCanvasRef.current.renderAll()
    updateLayers()
    saveToHistory()
  }, [layers, updateLayers, saveToHistory])

  const toggleLock = useCallback((layerId: string) => {
    const layer = layers.find((l) => l.id === layerId)
    if (!layer || !fabricCanvasRef.current) return

    const isLocked = !layer.locked
    layer.object.set({
      selectable: !isLocked,
      evented: !isLocked,
    })
    fabricCanvasRef.current.renderAll()
    updateLayers()
    saveToHistory()
  }, [layers, updateLayers, saveToHistory])

  // ============ Property Updates ============
  const updateTextProperty = useCallback((property: string, value: any) => {
    if (!fabricCanvasRef.current || !selectedObject) return
    if (selectedObject.type !== 'i-text' && selectedObject.type !== 'textbox' && selectedObject.type !== 'text') return

    const textObj = selectedObject as fabric.IText

    switch (property) {
      case 'fontSize':
        textObj.set('fontSize', value)
        setFontSize(value)
        break
      case 'fontFamily':
        textObj.set('fontFamily', value)
        setFontFamily(value)
        break
      case 'fill':
        textObj.set('fill', value)
        setTextColor(value)
        break
      case 'fontWeight':
        textObj.set('fontWeight', value ? 'bold' : 'normal')
        setIsBold(value)
        break
      case 'fontStyle':
        textObj.set('fontStyle', value ? 'italic' : 'normal')
        setIsItalic(value)
        break
      case 'underline':
        textObj.set('underline', value)
        setIsUnderline(value)
        break
      case 'textAlign':
        textObj.set('textAlign', value)
        setTextAlign(value)
        break
    }

    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [selectedObject, saveToHistory])

  const updateObjectProperty = useCallback((property: string, value: any) => {
    if (!fabricCanvasRef.current || !selectedObject) return

    switch (property) {
      case 'fill':
        selectedObject.set('fill', value)
        setFillColor(value)
        break
      case 'stroke':
        selectedObject.set('stroke', value)
        setStrokeColor(value)
        break
      case 'strokeWidth':
        selectedObject.set('strokeWidth', value)
        setStrokeWidth(value)
        break
      case 'opacity':
        selectedObject.set('opacity', value / 100)
        setOpacity(value)
        break
    }

    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [selectedObject, saveToHistory])

  // ============ Canvas Background ============
  const setCanvasBackground = useCallback((color: string) => {
    if (!fabricCanvasRef.current) return
    fabricCanvasRef.current.backgroundColor = color
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [saveToHistory])

  const setGradientBackground = useCallback((colors: string[]) => {
    if (!fabricCanvasRef.current) return

    const gradient = new fabric.Gradient({
      type: 'linear',
      gradientUnits: 'percentage',
      coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
      colorStops: [
        { offset: 0, color: colors[0] },
        { offset: 1, color: colors[1] },
      ],
    })

    fabricCanvasRef.current.backgroundColor = gradient as any
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [saveToHistory])

  // ============ Zoom Functions ============
  const handleZoom = useCallback((newZoom: number) => {
    if (!fabricCanvasRef.current) return
    
    const clampedZoom = Math.max(0.1, Math.min(3, newZoom))
    setZoom(clampedZoom)
    
    fabricCanvasRef.current.setZoom(clampedZoom)
    fabricCanvasRef.current.setDimensions({
      width: canvasSize.width * clampedZoom,
      height: canvasSize.height * clampedZoom,
    })
    fabricCanvasRef.current.renderAll()
  }, [canvasSize])

  const zoomIn = useCallback(() => handleZoom(zoom + 0.1), [zoom, handleZoom])
  const zoomOut = useCallback(() => handleZoom(zoom - 0.1), [zoom, handleZoom])
  const resetZoom = useCallback(() => handleZoom(1), [handleZoom])
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth - 100
    const containerHeight = containerRef.current.clientHeight - 100
    const scaleX = containerWidth / canvasSize.width
    const scaleY = containerHeight / canvasSize.height
    handleZoom(Math.min(scaleX, scaleY, 1))
  }, [canvasSize, handleZoom])

  // ============ Drawing Mode ============
  const toggleDrawingMode = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const newDrawingMode = !isDrawingMode
    setIsDrawingMode(newDrawingMode)
    fabricCanvasRef.current.isDrawingMode = newDrawingMode
    
    if (newDrawingMode && fabricCanvasRef.current.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.color = brushColor
      fabricCanvasRef.current.freeDrawingBrush.width = brushWidth
    }
  }, [isDrawingMode, brushColor, brushWidth])

  // ============ Export Functions ============
  const exportAsImage = useCallback((format: 'png' | 'jpeg' | 'svg' = 'png') => {
    if (!fabricCanvasRef.current) return

    // Reset zoom for export
    const currentZoom = fabricCanvasRef.current.getZoom()
    fabricCanvasRef.current.setZoom(1)
    fabricCanvasRef.current.setDimensions({
      width: canvasSize.width,
      height: canvasSize.height,
    })

    let dataUrl: string
    let filename: string
    const safeName = designName.replace(/[^a-zA-Z0-9]/g, '-') || 'design'

    if (format === 'svg') {
      dataUrl = fabricCanvasRef.current.toSVG()
      const blob = new Blob([dataUrl], { type: 'image/svg+xml' })
      dataUrl = URL.createObjectURL(blob)
      filename = `${safeName}-${Date.now()}.svg`
    } else {
      dataUrl = fabricCanvasRef.current.toDataURL({
        format: format,
        quality: 1,
        multiplier: 2,
      })
      filename = `${safeName}-${Date.now()}.${format}`
    }

    // Download
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()

    // Restore zoom
    fabricCanvasRef.current.setZoom(currentZoom)
    fabricCanvasRef.current.setDimensions({
      width: canvasSize.width * currentZoom,
      height: canvasSize.height * currentZoom,
    })
    fabricCanvasRef.current.renderAll()
    toast.success(`Design exported as ${format.toUpperCase()}!`)
  }, [canvasSize])

  const saveAsJSON = useCallback(() => {
    if (!fabricCanvasRef.current) return

    const json = fabricCanvasRef.current.toJSON()
    const data = {
      version: '1.0',
      canvasSize,
      canvas: json,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.download = `design-${Date.now()}.json`
    link.href = url
    link.click()
  }, [canvasSize])

  const loadFromJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricCanvasRef.current) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        
        if (data.canvasSize) {
          setCanvasSize(data.canvasSize)
          fabricCanvasRef.current?.setDimensions({
            width: data.canvasSize.width * zoom,
            height: data.canvasSize.height * zoom,
          })
        }

        await fabricCanvasRef.current?.loadFromJSON(data.canvas || data)
        fabricCanvasRef.current?.renderAll()
        updateLayers()
        saveToHistory()
      } catch (error) {
        console.error('Error loading design:', error)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [zoom, updateLayers, saveToHistory])

  // ============ Get Canvas as Data URL (for posting) ============
  const getCanvasDataUrl = useCallback(() => {
    if (!fabricCanvasRef.current) return null

    const currentZoom = fabricCanvasRef.current.getZoom()
    fabricCanvasRef.current.setZoom(1)
    fabricCanvasRef.current.setDimensions({
      width: canvasSize.width,
      height: canvasSize.height,
    })

    const dataUrl = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    })

    fabricCanvasRef.current.setZoom(currentZoom)
    fabricCanvasRef.current.setDimensions({
      width: canvasSize.width * currentZoom,
      height: canvasSize.height * currentZoom,
    })
    fabricCanvasRef.current.renderAll()

    return dataUrl
  }, [canvasSize])

  // ============ AI Caption Generator ============
  const generateCaption = useCallback(async () => {
    setIsGeneratingCaption(true)
    try {
      const captions = await generateText({
        topic: `Social media post design (${canvasSize.width}x${canvasSize.height})`,
        tone: 'casual',
        length: 'medium',
        platform: selectedPlatforms.length > 0 ? socialAccounts.find(a => a.id === selectedPlatforms[0])?.platform || 'instagram' : 'instagram',
        includeHashtags: true,
        includeEmojis: true,
      })
      
      if (Array.isArray(captions) && captions.length > 0) {
        setPostCaption(captions[0])
        toast.success('Caption generated!')
      } else {
        toast.error('Could not generate caption')
      }
    } catch (error) {
      console.error('Caption generation error:', error)
      toast.error('Failed to generate caption')
    } finally {
      setIsGeneratingCaption(false)
    }
  }, [canvasSize, selectedPlatforms, socialAccounts])

  // ============ Post to Social Media ============
  const handlePost = useCallback(async () => {
    if (!fabricCanvasRef.current || selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform')
      return
    }

    setIsPosting(true)
    try {
      const imageDataUrl = getCanvasDataUrl()
      if (!imageDataUrl) {
        throw new Error('Failed to get canvas image')
      }

      // Create post data
      const postData = {
        content: `${postCaption}\n\n${postHashtags}`.trim(),
        postType: 'IMAGE',
        platforms: selectedPlatforms.map(platformId => ({
          socialAccountId: platformId,
        })),
        scheduledAt: isScheduling && scheduleDate && scheduleTime 
          ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
          : undefined,
        // Note: In production, you'd upload the image first and get a mediaId
        // For now, we're creating the post with the caption
      }

      await postsApi.create(postData)
      
      toast.success(isScheduling ? 'Post scheduled successfully!' : 'Post created successfully!')
      setShowPostModal(false)
      
      // Navigate to scheduled or published page
      navigate(isScheduling ? '/scheduled' : '/published')
    } catch (error: any) {
      console.error('Post error:', error)
      toast.error(error.message || 'Failed to create post')
    } finally {
      setIsPosting(false)
    }
  }, [selectedPlatforms, postCaption, postHashtags, isScheduling, scheduleDate, scheduleTime, getCanvasDataUrl, navigate])

  // ============ Add Sticker ============
  const addSticker = useCallback((sticker: typeof STICKERS[0]) => {
    if (!fabricCanvasRef.current) return

    const text = new fabric.IText(sticker.icon, {
      left: canvasSize.width / 2 - 30,
      top: canvasSize.height / 2 - 30,
      fontSize: 60,
      fontFamily: 'Arial',
    })
    ;(text as any).id = uuidv4()
    ;(text as any).name = `Sticker: ${sticker.id}`

    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    fabricCanvasRef.current.renderAll()
    saveToHistory()
  }, [canvasSize, saveToHistory])

  // ============ NEW: Photo Editing Functions ============
  const applyImageFilter = useCallback((filterType: string) => {
    if (!fabricCanvasRef.current || !selectedObject) return
    if (selectedObject.type !== 'image') {
      toast.error('Please select an image to apply filters')
      return
    }

    const imgObj = selectedObject as fabric.FabricImage
    imgObj.filters = []

    // Apply brightness/contrast/saturation
    if (brightness !== 0 || contrast !== 0) {
      imgObj.filters.push(new fabric.filters.Brightness({ brightness: brightness / 100 }))
      imgObj.filters.push(new fabric.filters.Contrast({ contrast: contrast / 100 }))
    }

    if (saturation !== 0) {
      imgObj.filters.push(new fabric.filters.Saturation({ saturation: saturation / 100 }))
    }

    if (blur > 0) {
      imgObj.filters.push(new fabric.filters.Blur({ blur: blur / 100 }))
    }

    // Apply selected filter
    const filter = PHOTO_FILTERS.find(f => f.id === filterType)
    if (filter && filter.filter) {
      imgObj.filters.push(filter.filter)
    }

    imgObj.applyFilters()
    fabricCanvasRef.current.renderAll()
    setSelectedFilter(filterType)
    saveToHistory()
  }, [selectedObject, brightness, contrast, saturation, blur, saveToHistory])

  const updateImageAdjustment = useCallback((type: 'brightness' | 'contrast' | 'saturation' | 'blur', value: number) => {
    if (!fabricCanvasRef.current || !selectedObject) return
    if (selectedObject.type !== 'image') return

    switch (type) {
      case 'brightness':
        setBrightness(value)
        break
      case 'contrast':
        setContrast(value)
        break
      case 'saturation':
        setSaturation(value)
        break
      case 'blur':
        setBlur(value)
        break
    }

    // Apply filters in real-time
    const imgObj = selectedObject as fabric.FabricImage
    imgObj.filters = []

    const newBrightness = type === 'brightness' ? value : brightness
    const newContrast = type === 'contrast' ? value : contrast
    const newSaturation = type === 'saturation' ? value : saturation
    const newBlur = type === 'blur' ? value : blur

    if (newBrightness !== 0) {
      imgObj.filters.push(new fabric.filters.Brightness({ brightness: newBrightness / 100 }))
    }
    if (newContrast !== 0) {
      imgObj.filters.push(new fabric.filters.Contrast({ contrast: newContrast / 100 }))
    }
    if (newSaturation !== 0) {
      imgObj.filters.push(new fabric.filters.Saturation({ saturation: newSaturation / 100 }))
    }
    if (newBlur > 0) {
      imgObj.filters.push(new fabric.filters.Blur({ blur: newBlur / 100 }))
    }

    // Apply selected preset filter
    const filter = PHOTO_FILTERS.find(f => f.id === selectedFilter)
    if (filter && filter.filter) {
      imgObj.filters.push(filter.filter)
    }

    imgObj.applyFilters()
    fabricCanvasRef.current.renderAll()
  }, [selectedObject, brightness, contrast, saturation, blur, selectedFilter])

  const resetImageFilters = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return
    if (selectedObject.type !== 'image') return

    const imgObj = selectedObject as fabric.FabricImage
    imgObj.filters = []
    imgObj.applyFilters()
    
    setBrightness(0)
    setContrast(0)
    setSaturation(0)
    setBlur(0)
    setSelectedFilter('none')
    
    fabricCanvasRef.current.renderAll()
    saveToHistory()
    toast.success('Filters reset')
  }, [selectedObject, saveToHistory])

  // ============ NEW: Background Remover (Canvas-based) ============
  const removeBackground = useCallback(async () => {
    if (!fabricCanvasRef.current || !selectedObject) return
    if (selectedObject.type !== 'image') {
      toast.error('Please select an image to remove background')
      return
    }

    setIsRemovingBackground(true)
    const loadingToast = toast.loading('Removing background...')
    
    try {
      const imgObj = selectedObject as fabric.FabricImage
      const imgElement = imgObj.getElement() as HTMLImageElement
      
      // Create a temporary canvas to process the image
      const tempCanvas = document.createElement('canvas')
      const ctx = tempCanvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')
      
      tempCanvas.width = imgElement.naturalWidth || imgElement.width
      tempCanvas.height = imgElement.naturalHeight || imgElement.height
      
      // Draw the image
      ctx.drawImage(imgElement, 0, 0)
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const data = imageData.data
      
      // Sample background color from corners
      const sampleSize = 10
      const corners = [
        { x: 0, y: 0 },
        { x: tempCanvas.width - sampleSize, y: 0 },
        { x: 0, y: tempCanvas.height - sampleSize },
        { x: tempCanvas.width - sampleSize, y: tempCanvas.height - sampleSize }
      ]
      
      let bgR = 0, bgG = 0, bgB = 0, samples = 0
      
      corners.forEach(corner => {
        for (let y = corner.y; y < corner.y + sampleSize; y++) {
          for (let x = corner.x; x < corner.x + sampleSize; x++) {
            const idx = (y * tempCanvas.width + x) * 4
            bgR += data[idx]
            bgG += data[idx + 1]
            bgB += data[idx + 2]
            samples++
          }
        }
      })
      
      bgR = Math.round(bgR / samples)
      bgG = Math.round(bgG / samples)
      bgB = Math.round(bgB / samples)
      
      // Remove background based on color similarity
      const tolerance = 50 // Adjust this for sensitivity
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        const diff = Math.sqrt(
          Math.pow(r - bgR, 2) +
          Math.pow(g - bgG, 2) +
          Math.pow(b - bgB, 2)
        )
        
        if (diff < tolerance) {
          data[i + 3] = 0 // Make transparent
        } else if (diff < tolerance * 2) {
          // Feather edges
          data[i + 3] = Math.min(255, Math.round((diff - tolerance) / tolerance * 255))
        }
      }
      
      // Put processed image back
      ctx.putImageData(imageData, 0, 0)
      
      // Convert to data URL and create new image
      const newDataUrl = tempCanvas.toDataURL('image/png')
      
      // Replace the image
      const newImg = await fabric.FabricImage.fromURL(newDataUrl)
      newImg.set({
        left: imgObj.left,
        top: imgObj.top,
        scaleX: imgObj.scaleX,
        scaleY: imgObj.scaleY,
        angle: imgObj.angle,
      })
      ;(newImg as any).id = (imgObj as any).id
      ;(newImg as any).name = (imgObj as any).name + ' (BG Removed)'
      
      fabricCanvasRef.current.remove(imgObj)
      fabricCanvasRef.current.add(newImg)
      fabricCanvasRef.current.setActiveObject(newImg)
      fabricCanvasRef.current.renderAll()
      
      toast.success('Background removed successfully!', { id: loadingToast })
      saveToHistory()
    } catch (error) {
      console.error('Background removal error:', error)
      toast.error('Failed to remove background. Try an image with a solid background.', { id: loadingToast })
    } finally {
      setIsRemovingBackground(false)
    }
  }, [selectedObject, saveToHistory])

  // ============ NEW: Crop Image ============
  const startCrop = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return
    if (selectedObject.type !== 'image') {
      toast.error('Please select an image to crop')
      return
    }

    setIsCropping(true)
    
    // Create crop rectangle overlay
    const imgObj = selectedObject as fabric.FabricImage
    const rect = new fabric.Rect({
      left: imgObj.left,
      top: imgObj.top,
      width: (imgObj.width || 100) * (imgObj.scaleX || 1),
      height: (imgObj.height || 100) * (imgObj.scaleY || 1),
      fill: 'rgba(0,0,0,0.3)',
      stroke: '#ffffff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      hasControls: true,
    })
    ;(rect as any).isCropRect = true
    
    fabricCanvasRef.current.add(rect)
    fabricCanvasRef.current.setActiveObject(rect)
    setCropRect(rect)
    fabricCanvasRef.current.renderAll()
    
    toast.success('Adjust the crop area and click "Apply Crop"')
  }, [selectedObject])

  const applyCrop = useCallback(() => {
    if (!fabricCanvasRef.current || !cropRect || !selectedObject) return
    if (selectedObject.type !== 'image') return

    const imgObj = selectedObject as fabric.FabricImage
    
    // Calculate crop area relative to image
    const cropLeft = (cropRect.left || 0) - (imgObj.left || 0)
    const cropTop = (cropRect.top || 0) - (imgObj.top || 0)
    const cropWidth = (cropRect.width || 100) * (cropRect.scaleX || 1)
    const cropHeight = (cropRect.height || 100) * (cropRect.scaleY || 1)
    
    // Apply crop using clipPath
    const clipPath = new fabric.Rect({
      left: cropLeft / (imgObj.scaleX || 1),
      top: cropTop / (imgObj.scaleY || 1),
      width: cropWidth / (imgObj.scaleX || 1),
      height: cropHeight / (imgObj.scaleY || 1),
      absolutePositioned: true,
    })
    
    imgObj.clipPath = clipPath
    
    // Remove crop rectangle
    fabricCanvasRef.current.remove(cropRect)
    setCropRect(null)
    setIsCropping(false)
    
    fabricCanvasRef.current.renderAll()
    saveToHistory()
    toast.success('Image cropped!')
  }, [cropRect, selectedObject, saveToHistory])

  const cancelCrop = useCallback(() => {
    if (!fabricCanvasRef.current || !cropRect) return
    
    fabricCanvasRef.current.remove(cropRect)
    setCropRect(null)
    setIsCropping(false)
    fabricCanvasRef.current.renderAll()
  }, [cropRect])

  // ============ NEW: Brand Kit Functions ============
  const saveBrandKit = useCallback(() => {
    if (!newBrandKit.name) {
      toast.error('Please enter a brand kit name')
      return
    }

    const kit: BrandKit = {
      id: uuidv4(),
      name: newBrandKit.name,
      primaryColor: newBrandKit.primaryColor || '#6366f1',
      secondaryColor: newBrandKit.secondaryColor || '#818cf8',
      accentColor: newBrandKit.accentColor || '#c7d2fe',
      fonts: newBrandKit.fonts || ['Arial'],
    }

    setBrandKits(prev => [...prev, kit])
    setShowBrandKitModal(false)
    setNewBrandKit({ name: '', primaryColor: '#6366f1', secondaryColor: '#818cf8', accentColor: '#c7d2fe', fonts: ['Arial'] })
    toast.success('Brand kit saved!')
  }, [newBrandKit])

  const applyBrandKit = useCallback((kit: BrandKit) => {
    setSelectedBrandKit(kit)
    setFillColor(kit.primaryColor)
    setTextColor(kit.primaryColor)
    if (kit.fonts[0]) {
      setFontFamily(kit.fonts[0])
    }
    toast.success(`Applied ${kit.name} brand kit`)
  }, [])

  const deleteBrandKit = useCallback((kitId: string) => {
    setBrandKits(prev => prev.filter(k => k.id !== kitId))
    if (selectedBrandKit?.id === kitId) {
      setSelectedBrandKit(null)
    }
    toast.success('Brand kit deleted')
  }, [selectedBrandKit])

  // ============ NEW: Magic Studio AI Functions ============
  const generateAIImage = useCallback(async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setIsGeneratingAI(true)
    try {
      toast.loading('Generating with AI...', { id: 'ai-generate' })
      
      // In production, this would call an AI image generation API (DALL-E, Midjourney, etc.)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // For demo, we'll add a placeholder gradient
      if (fabricCanvasRef.current) {
        const rect = new fabric.Rect({
          left: canvasSize.width / 2 - 150,
          top: canvasSize.height / 2 - 150,
          width: 300,
          height: 300,
          fill: new fabric.Gradient({
            type: 'linear',
            coords: { x1: 0, y1: 0, x2: 300, y2: 300 },
            colorStops: [
              { offset: 0, color: '#7c3aed' },
              { offset: 0.5, color: '#db2777' },
              { offset: 1, color: '#f97316' },
            ],
          }),
          rx: 10,
          ry: 10,
        })
        ;(rect as any).id = uuidv4()
        ;(rect as any).name = `AI Generated: ${aiPrompt.slice(0, 20)}...`

        fabricCanvasRef.current.add(rect)
        fabricCanvasRef.current.setActiveObject(rect)
        fabricCanvasRef.current.renderAll()
        saveToHistory()
      }
      
      toast.success('AI content generated! (Demo - integrate with AI API for real generation)', { id: 'ai-generate' })
      setShowMagicStudioModal(false)
      setAiPrompt('')
    } catch (error) {
      toast.error('Failed to generate AI content', { id: 'ai-generate' })
    } finally {
      setIsGeneratingAI(false)
    }
  }, [aiPrompt, canvasSize, saveToHistory])

  const applyMagicEffect = useCallback(async (effect: string) => {
    if (!fabricCanvasRef.current || !selectedObject) return

    setIsGeneratingAI(true)
    toast.loading(`Applying ${effect}...`, { id: 'magic-effect' })

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      switch (effect) {
        case 'enhance':
          // Simulate auto-enhance
          if (selectedObject.type === 'image') {
            const imgObj = selectedObject as fabric.FabricImage
            imgObj.filters = [
              new fabric.filters.Brightness({ brightness: 0.1 }),
              new fabric.filters.Contrast({ contrast: 0.1 }),
              new fabric.filters.Saturation({ saturation: 0.1 }),
            ]
            imgObj.applyFilters()
          }
          break
        case 'animate':
          // Simulate animation effect
          toast.success('Animation applied! (Animations would be visible in export)')
          break
        case 'style-transfer':
          toast.success('Style transfer applied! (Demo - integrate with AI API)')
          break
        case 'upscale':
          toast.success('Image upscaled! (Demo - integrate with AI upscaling API)')
          break
      }

      fabricCanvasRef.current.renderAll()
      saveToHistory()
      toast.success(`${effect} effect applied!`, { id: 'magic-effect' })
    } catch (error) {
      toast.error(`Failed to apply ${effect}`, { id: 'magic-effect' })
    } finally {
      setIsGeneratingAI(false)
    }
  }, [selectedObject, saveToHistory])

  // ============ NEW: Apply Design Template ============
  const applyDesignTemplate = useCallback((template: typeof DESIGN_TEMPLATES[0]) => {
    if (!fabricCanvasRef.current) return

    // Clear current canvas
    fabricCanvasRef.current.clear()
    fabricCanvasRef.current.backgroundColor = '#ffffff'

    // Add template elements
    template.elements.forEach(element => {
      let obj: fabric.FabricObject | null = null
      const props = element.props as any

      switch (element.type) {
        case 'rect':
          obj = new fabric.Rect(props)
          break
        case 'text':
          obj = new fabric.IText(props.text || 'Text', props)
          break
        case 'gradient':
          const gradientRect = new fabric.Rect({
            left: 0,
            top: 0,
            width: props.width,
            height: props.height,
            fill: new fabric.Gradient({
              type: 'linear',
              coords: { x1: 0, y1: 0, x2: props.width, y2: props.height },
              colorStops: [
                { offset: 0, color: props.colors?.[0] || '#7c3aed' },
                { offset: 1, color: props.colors?.[1] || '#db2777' },
              ],
            }),
          })
          obj = gradientRect
          break
        case 'line':
          obj = new fabric.Line([props.x1 || 0, props.y1 || 0, props.x2 || 100, props.y2 || 100], props)
          break
      }

      if (obj) {
        (obj as any).id = uuidv4()
        fabricCanvasRef.current?.add(obj)
      }
    })

    fabricCanvasRef.current.renderAll()
    saveToHistory()
    toast.success(`Applied "${template.name}" template`)
  }, [saveToHistory])

  // ============ NEW: Add Element from Library ============
  const addElementFromLibrary = useCallback((_elementType: string, elementData: any) => {
    if (!fabricCanvasRef.current) return

    let obj: fabric.FabricObject | null = null
    const baseLeft = canvasSize.width / 2 - 50
    const baseTop = canvasSize.height / 2 - 50

    if (elementData.path) {
      obj = new fabric.Path(elementData.path, {
        left: baseLeft,
        top: baseTop,
        stroke: fillColor,
        strokeWidth: 3,
        fill: elementData.fill || 'transparent',
        ...(elementData.strokeDashArray && { strokeDashArray: elementData.strokeDashArray }),
      })
    } else if (elementData.svgString) {
      // Load SVG from string
      fabric.loadSVGFromString(elementData.svgString).then((result) => {
        if (result.objects.length > 0) {
          const group = new fabric.Group(result.objects as fabric.FabricObject[], {
            left: baseLeft,
            top: baseTop,
          })
          ;(group as any).id = uuidv4()
          ;(group as any).name = elementData.name
          fabricCanvasRef.current?.add(group)
          fabricCanvasRef.current?.setActiveObject(group)
          fabricCanvasRef.current?.renderAll()
          saveToHistory()
        }
      })
      return // Early return since SVG loading is async
    } else if (elementData.svg) {
      // For emoji/text-based elements
      obj = new fabric.IText(elementData.svg, {
        left: baseLeft,
        top: baseTop,
        fontSize: 48,
        fill: fillColor,
      })
    } else if (elementData.type === 'rect') {
      obj = new fabric.Rect({
        left: baseLeft,
        top: baseTop,
        ...elementData.props,
        stroke: fillColor,
      })
    } else if (elementData.type === 'circle') {
      obj = new fabric.Circle({
        left: baseLeft,
        top: baseTop,
        ...elementData.props,
        stroke: fillColor,
      })
    } else if (elementData.type === 'polygon') {
      // For stars, triangles, etc.
      const points = elementData.points || []
      obj = new fabric.Polygon(points, {
        left: baseLeft,
        top: baseTop,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 2,
      })
    } else if (elementData.type === 'textbox') {
      // For badges with text
      obj = new fabric.IText(elementData.text || 'Badge', {
        left: baseLeft,
        top: baseTop,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#ffffff',
        backgroundColor: fillColor,
        padding: 10,
        textAlign: 'center',
      })
    }

    if (obj) {
      (obj as any).id = uuidv4()
      ;(obj as any).name = elementData.name
      fabricCanvasRef.current.add(obj)
      fabricCanvasRef.current.setActiveObject(obj)
      fabricCanvasRef.current.renderAll()
      saveToHistory()
    }
  }, [canvasSize, fillColor, strokeColor, saveToHistory])

  // ============ NEW: Export as PDF ============
  const exportAsPDF = useCallback(async () => {
    if (!fabricCanvasRef.current) return

    toast.loading('Generating PDF...', { id: 'pdf-export' })

    try {
      // Reset zoom for export
      const currentZoom = fabricCanvasRef.current.getZoom()
      fabricCanvasRef.current.setZoom(1)
      fabricCanvasRef.current.setDimensions({
        width: canvasSize.width,
        height: canvasSize.height,
      })

      // Get canvas as data URL
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      })

      // Create a simple PDF-like download (in production, use jsPDF library)
      // For now, we'll export as PNG with PDF-like naming
      const safeName = designName.replace(/[^a-zA-Z0-9]/g, '-') || 'design'
      const link = document.createElement('a')
      link.download = `${safeName}-${Date.now()}.png`
      link.href = dataUrl
      link.click()

      // Restore zoom
      fabricCanvasRef.current.setZoom(currentZoom)
      fabricCanvasRef.current.setDimensions({
        width: canvasSize.width * currentZoom,
        height: canvasSize.height * currentZoom,
      })
      fabricCanvasRef.current.renderAll()

      toast.success('Exported! (Install jsPDF for actual PDF export)', { id: 'pdf-export' })
    } catch (error) {
      toast.error('Failed to export PDF', { id: 'pdf-export' })
    }
  }, [canvasSize, designName])

  // ============ Grid Toggle ============
  const toggleGrid = useCallback(() => {
    setShowGrid(!showGrid)
  }, [showGrid])

  // ============ Keyboard Shortcuts ============
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'y':
            e.preventDefault()
            redo()
            break
          case 'c':
            e.preventDefault()
            copyToClipboard()
            break
          case 'v':
            e.preventDefault()
            pasteFromClipboard()
            break
          case 'd':
            e.preventDefault()
            duplicateSelected()
            break
          case 's':
            e.preventDefault()
            saveAsJSON()
            break
          case '=':
          case '+':
            e.preventDefault()
            zoomIn()
            break
          case '-':
            e.preventDefault()
            zoomOut()
            break
          case '0':
            e.preventDefault()
            resetZoom()
            break
        }
      } else {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            const activeObj = fabricCanvasRef.current?.getActiveObject() as any
            if (selectedObject && !activeObj?.isEditing) {
              e.preventDefault()
              deleteSelected()
            }
            break
          case 'Escape':
            fabricCanvasRef.current?.discardActiveObject()
            fabricCanvasRef.current?.renderAll()
            setSelectedObject(null)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, copyToClipboard, pasteFromClipboard, duplicateSelected, deleteSelected, selectedObject, saveAsJSON, zoomIn, zoomOut, resetZoom])

  // ============ Template Selection ============
  const selectTemplate = (template: CanvasTemplate) => {
    if (template.id === '15') {
      // Custom size
      initializeCanvas(customWidth, customHeight)
    } else {
      initializeCanvas(template.width, template.height)
    }
  }

  // ============ Filter Templates ============
  const filteredTemplates = CANVAS_TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ============ Render ============
  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
        {/* Template Selection Modal */}
        <AnimatePresence>
          {showTemplateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Create a New Design
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Choose a template size or create a custom design
                  </p>
                  
                  {/* Search */}
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {/* Custom Size */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Custom Size
                    </h3>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600 dark:text-slate-400">W:</label>
                        <Input
                          type="number"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(Number(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm text-slate-500">px</span>
                      </div>
                      <X className="w-4 h-4 text-slate-400" />
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600 dark:text-slate-400">H:</label>
                        <Input
                          type="number"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(Number(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm text-slate-500">px</span>
                      </div>
                      <Button onClick={() => initializeCanvas(customWidth, customHeight)}>
                        Create Custom
                      </Button>
                    </div>
                  </div>

                  {/* Template Categories */}
                  {['Social Media', 'Video', 'Print', 'Presentation'].map((category) => {
                    const categoryTemplates = filteredTemplates.filter((t) => t.category === category)
                    if (categoryTemplates.length === 0) return null

                    return (
                      <div key={category} className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                          {category}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {categoryTemplates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => selectTemplate(template)}
                              className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-500 border-2 border-transparent transition-all group text-left"
                            >
                              <div
                                className="w-full aspect-video bg-white dark:bg-slate-700 rounded-lg mb-2 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow"
                                style={{
                                  aspectRatio: `${template.width}/${template.height}`,
                                  maxHeight: '80px',
                                }}
                              >
                                <span className="text-xs text-slate-400">
                                  {template.width} Ã— {template.height}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {template.name}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Toolbar */}
        <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            {/* File Operations */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplateModal(true)}
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  New
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Design</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={saveAsJSON}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Project (Ctrl+S)</TooltipContent>
            </Tooltip>

            <label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" asChild>
                    <span>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Open
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open Project</TooltipContent>
              </Tooltip>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={loadFromJSON}
              />
            </label>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

            {/* History */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>

          {/* Center - Design Name & Canvas Size */}
          <div className="flex items-center gap-4">
            <Input
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="w-48 text-center font-medium border-transparent hover:border-slate-200 focus:border-indigo-500"
              placeholder="Untitled Design"
            />
            <span className="text-sm text-slate-500">
              {canvasSize.width} Ã— {canvasSize.height} px
            </span>
          </div>

          {/* Right - Zoom & Export */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={zoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out (Ctrl+-)</TooltipContent>
            </Tooltip>

            <span className="text-sm text-slate-600 dark:text-slate-400 w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={zoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In (Ctrl++)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={fitToScreen}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fit to Screen</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

            {/* Export Dropdown */}
            <div className="relative group">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={() => exportAsImage('png')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileImage className="w-4 h-4" />
                  PNG (High Quality)
                </button>
                <button
                  onClick={() => exportAsImage('jpeg')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileImage className="w-4 h-4" />
                  JPEG (Compressed)
                </button>
                <button
                  onClick={() => exportAsImage('svg')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileJson className="w-4 h-4" />
                  SVG (Vector)
                </button>
                <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                <button
                  onClick={exportAsPDF}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  PDF Document
                </button>
                <button
                  onClick={saveAsJSON}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileJson className="w-4 h-4" />
                  Project File (JSON)
                </button>
              </div>
            </div>

            {/* Post Button */}
            <Button onClick={() => setShowPostModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-4 h-4 mr-2" />
              Post
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Tools */}
          <div className="w-16 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center py-4 gap-1 shrink-0">
            {[
              { id: 'select', icon: MousePointer2, label: 'Select' },
              { id: 'pro-tools', icon: Target, label: 'Pro Tools' },
              { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
              { id: 'pages', icon: FileImage, label: 'Pages' },
              { id: 'text', icon: Type, label: 'Text' },
              { id: 'shapes', icon: Square, label: 'Shapes' },
              { id: 'elements', icon: Shapes, label: 'Elements' },
              { id: 'stickers', icon: Sticker, label: 'Stickers' },
              { id: 'images', icon: ImageIcon, label: 'Images' },
              { id: 'photo-edit', icon: SlidersHorizontal, label: 'Photo Edit' },
              { id: 'draw', icon: PenTool, label: 'Draw' },
              { id: 'background', icon: Palette, label: 'Background' },
              { id: 'brand-kit', icon: PaletteIcon, label: 'Brand Kit' },
              { id: 'magic-studio', icon: Sparkles, label: 'Magic Studio' },
              { id: 'layers', icon: Layers, label: 'Layers' },
            ].map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (tool.id === 'draw') {
                        toggleDrawingMode()
                        setActivePanel(tool.id)
                      } else {
                        setActivePanel(tool.id)
                        if (isDrawingMode && fabricCanvasRef.current) {
                          setIsDrawingMode(false)
                          fabricCanvasRef.current.isDrawingMode = false
                        }
                      }
                    }}
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                      activePanel === tool.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <tool.icon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{tool.label}</TooltipContent>
              </Tooltip>
            ))}

            <div className="flex-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleGrid}
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                    showGrid
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Toggle Grid</TooltipContent>
            </Tooltip>
          </div>

          {/* Left Panel - Tool Options */}
          <AnimatePresence mode="wait">
            {activePanel && (
              <motion.div
                key={activePanel}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 h-full"
              >
                <div 
                  className="w-70 h-full overflow-y-auto p-4 overscroll-contain"
                  style={{ maxHeight: 'calc(100vh - 56px)' }}
                  onWheel={(e) => e.stopPropagation()}
                >
                  {/* Text Panel */}
                  {activePanel === 'text' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Text</h3>
                      
                      <div className="space-y-2">
                        <Button onClick={addHeading} variant="outline" className="w-full justify-start">
                          <Type className="w-4 h-4 mr-2" />
                          Add Heading
                        </Button>
                        <Button onClick={addSubheading} variant="outline" className="w-full justify-start">
                          <Type className="w-4 h-4 mr-2" />
                          Add Subheading
                        </Button>
                        <Button onClick={addBodyText} variant="outline" className="w-full justify-start">
                          <Type className="w-4 h-4 mr-2" />
                          Add Body Text
                        </Button>
                        <Button onClick={addText} variant="outline" className="w-full justify-start">
                          <Type className="w-4 h-4 mr-2" />
                          Add Custom Text
                        </Button>
                      </div>

                      {selectedObject && (selectedObject.type === 'i-text' || selectedObject.type === 'textbox') && (
                        <>
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                              Text Properties
                            </h4>
                            
                            {/* Font Family */}
                            <div className="mb-3">
                              <label className="text-xs text-slate-500 mb-1 block">Font</label>
                              <select
                                value={fontFamily}
                                onChange={(e) => updateTextProperty('fontFamily', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                              >
                                {FONT_FAMILIES.map((font) => (
                                  <option key={font} value={font} style={{ fontFamily: font }}>
                                    {font}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Font Size */}
                            <div className="mb-3">
                              <label className="text-xs text-slate-500 mb-1 block">Size</label>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateTextProperty('fontSize', fontSize - 2)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Input
                                  type="number"
                                  value={fontSize}
                                  onChange={(e) => updateTextProperty('fontSize', Number(e.target.value))}
                                  className="w-20 text-center"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateTextProperty('fontSize', fontSize + 2)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Text Style */}
                            <div className="mb-3">
                              <label className="text-xs text-slate-500 mb-1 block">Style</label>
                              <div className="flex gap-1">
                                <Button
                                  variant={isBold ? 'default' : 'outline'}
                                  size="icon"
                                  onClick={() => updateTextProperty('fontWeight', !isBold)}
                                >
                                  <Bold className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={isItalic ? 'default' : 'outline'}
                                  size="icon"
                                  onClick={() => updateTextProperty('fontStyle', !isItalic)}
                                >
                                  <Italic className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={isUnderline ? 'default' : 'outline'}
                                  size="icon"
                                  onClick={() => updateTextProperty('underline', !isUnderline)}
                                >
                                  <Underline className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Text Align */}
                            <div className="mb-3">
                              <label className="text-xs text-slate-500 mb-1 block">Alignment</label>
                              <div className="flex gap-1">
                                <Button
                                  variant={textAlign === 'left' ? 'default' : 'outline'}
                                  size="icon"
                                  onClick={() => updateTextProperty('textAlign', 'left')}
                                >
                                  <AlignLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={textAlign === 'center' ? 'default' : 'outline'}
                                  size="icon"
                                  onClick={() => updateTextProperty('textAlign', 'center')}
                                >
                                  <AlignCenter className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={textAlign === 'right' ? 'default' : 'outline'}
                                  size="icon"
                                  onClick={() => updateTextProperty('textAlign', 'right')}
                                >
                                  <AlignRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Text Color */}
                            <div>
                              <label className="text-xs text-slate-500 mb-1 block">Color</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={textColor}
                                  onChange={(e) => updateTextProperty('fill', e.target.value)}
                                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                                />
                                <Input
                                  value={textColor}
                                  onChange={(e) => updateTextProperty('fill', e.target.value)}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Shapes Panel */}
                  {activePanel === 'shapes' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Shapes</h3>
                      
                      {/* Basic Shapes */}
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block">Basic Shapes</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'rectangle', icon: Square, label: 'Rectangle' },
                            { id: 'square', icon: Square, label: 'Square' },
                            { id: 'circle', icon: Circle, label: 'Circle' },
                            { id: 'ellipse', icon: Circle, label: 'Ellipse' },
                            { id: 'triangle', icon: Triangle, label: 'Triangle' },
                            { id: 'line', icon: Minus, label: 'Line' },
                          ].map((shape) => (
                            <Tooltip key={shape.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => addShape(shape.id)}
                                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-500 transition-all flex items-center justify-center"
                                >
                                  <shape.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{shape.label}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>

                      {/* Polygons */}
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block">Polygons & Stars</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'pentagon', icon: Pentagon, label: 'Pentagon' },
                            { id: 'hexagon', icon: Hexagon, label: 'Hexagon' },
                            { id: 'octagon', icon: Octagon, label: 'Octagon' },
                            { id: 'star', icon: Star, label: 'Star' },
                            { id: 'star-4', icon: Star, label: '4-Point Star' },
                            { id: 'star-6', icon: Star, label: '6-Point Star' },
                            { id: 'heart', icon: Heart, label: 'Heart' },
                            { id: 'badge', icon: Award, label: 'Badge' },
                          ].map((shape) => (
                            <Tooltip key={shape.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => addShape(shape.id)}
                                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-500 transition-all flex items-center justify-center"
                                >
                                  <shape.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{shape.label}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>

                      {/* Arrows & Callouts */}
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block">Arrows & Callouts</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'arrow', icon: ArrowRight, label: 'Arrow Right' },
                            { id: 'arrow-left', icon: ArrowLeft, label: 'Arrow Left' },
                            { id: 'speech-bubble', icon: MessageSquare, label: 'Speech Bubble' },
                            { id: 'callout', icon: MessageSquare, label: 'Callout' },
                          ].map((shape) => (
                            <Tooltip key={shape.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => addShape(shape.id)}
                                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-500 transition-all flex items-center justify-center"
                                >
                                  <shape.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{shape.label}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>

                      {/* Shape Properties */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                          Shape Properties
                        </h4>
                        
                        {/* Fill Color */}
                        <div className="mb-3">
                          <label className="text-xs text-slate-500 mb-1 block">Fill Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={fillColor}
                              onChange={(e) => {
                                setFillColor(e.target.value)
                                if (selectedObject) updateObjectProperty('fill', e.target.value)
                              }}
                              className="w-10 h-10 rounded-lg cursor-pointer border-0"
                            />
                            <Input
                              value={fillColor}
                              onChange={(e) => {
                                setFillColor(e.target.value)
                                if (selectedObject) updateObjectProperty('fill', e.target.value)
                              }}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        {/* Stroke Color */}
                        <div className="mb-3">
                          <label className="text-xs text-slate-500 mb-1 block">Stroke Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={strokeColor}
                              onChange={(e) => {
                                setStrokeColor(e.target.value)
                                if (selectedObject) updateObjectProperty('stroke', e.target.value)
                              }}
                              className="w-10 h-10 rounded-lg cursor-pointer border-0"
                            />
                            <Input
                              value={strokeColor}
                              onChange={(e) => {
                                setStrokeColor(e.target.value)
                                if (selectedObject) updateObjectProperty('stroke', e.target.value)
                              }}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        {/* Stroke Width */}
                        <div className="mb-3">
                          <label className="text-xs text-slate-500 mb-1 block">Stroke Width: {strokeWidth}px</label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={strokeWidth}
                            onChange={(e) => {
                              const value = Number(e.target.value)
                              setStrokeWidth(value)
                              if (selectedObject) updateObjectProperty('strokeWidth', value)
                            }}
                            className="w-full"
                          />
                        </div>

                        {/* Corner Radius */}
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Corner Radius: {cornerRadius}px</label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={cornerRadius}
                            onChange={(e) => setCornerRadius(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Preset Colors */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="text-xs text-slate-500 mb-2 block">Quick Colors</label>
                        <div className="grid grid-cols-8 gap-1">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => {
                                setFillColor(color)
                                if (selectedObject) updateObjectProperty('fill', color)
                              }}
                              className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stickers Panel */}
                  {activePanel === 'stickers' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Stickers & Emojis</h3>
                      
                      {['Emoji', 'Arrows', 'Symbols'].map((category) => (
                        <div key={category}>
                          <label className="text-xs text-slate-500 mb-2 block">{category}</label>
                          <div className="grid grid-cols-6 gap-1">
                            {STICKERS.filter(s => s.category === category).map((sticker) => (
                              <button
                                key={sticker.id}
                                onClick={() => addSticker(sticker)}
                                className="p-2 text-2xl rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                {sticker.icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Images Panel */}
                  {activePanel === 'images' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Images</h3>
                      
                      <div className="space-y-2">
                        <label>
                          <Button variant="outline" className="w-full justify-start" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Image
                            </span>
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>

                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">
                          Upload images from your computer to add them to your design. Supported formats: PNG, JPG, SVG, GIF
                        </p>
                      </div>

                      {/* Image placeholder */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="aspect-square bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div className="aspect-square bg-linear-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Draw Panel */}
                  {activePanel === 'draw' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Drawing</h3>
                      
                      <Button
                        onClick={toggleDrawingMode}
                        variant={isDrawingMode ? 'default' : 'outline'}
                        className="w-full"
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        {isDrawingMode ? 'Stop Drawing' : 'Start Drawing'}
                      </Button>

                      {/* Brush Color */}
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Brush Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={brushColor}
                            onChange={(e) => {
                              setBrushColor(e.target.value)
                              if (fabricCanvasRef.current?.freeDrawingBrush) {
                                fabricCanvasRef.current.freeDrawingBrush.color = e.target.value
                              }
                            }}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0"
                          />
                          <Input
                            value={brushColor}
                            onChange={(e) => {
                              setBrushColor(e.target.value)
                              if (fabricCanvasRef.current?.freeDrawingBrush) {
                                fabricCanvasRef.current.freeDrawingBrush.color = e.target.value
                              }
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      {/* Brush Width */}
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Brush Size: {brushWidth}px</label>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={brushWidth}
                          onChange={(e) => {
                            const value = Number(e.target.value)
                            setBrushWidth(value)
                            if (fabricCanvasRef.current?.freeDrawingBrush) {
                              fabricCanvasRef.current.freeDrawingBrush.width = value
                            }
                          }}
                          className="w-full"
                        />
                      </div>

                      {/* Preset Colors */}
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block">Quick Colors</label>
                        <div className="grid grid-cols-8 gap-1">
                          {PRESET_COLORS.slice(0, 16).map((color) => (
                            <button
                              key={color}
                              onClick={() => {
                                setBrushColor(color)
                                if (fabricCanvasRef.current?.freeDrawingBrush) {
                                  fabricCanvasRef.current.freeDrawingBrush.color = color
                                }
                              }}
                              className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Background Panel */}
                  {activePanel === 'background' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Background</h3>
                      
                      {/* Solid Colors */}
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block">Solid Colors</label>
                        <div className="grid grid-cols-8 gap-1 mb-3">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setCanvasBackground(color)}
                              className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            onChange={(e) => setCanvasBackground(e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0"
                          />
                          <span className="text-sm text-slate-500">Custom Color</span>
                        </div>
                      </div>

                      {/* Gradients */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="text-xs text-slate-500 mb-2 block">Gradients</label>
                        <div className="grid grid-cols-4 gap-2">
                          {GRADIENTS.map((gradient) => (
                            <Tooltip key={gradient.name}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setGradientBackground(gradient.colors)}
                                  className="h-12 rounded-lg hover:scale-105 transition-transform border border-slate-200 dark:border-slate-600"
                                  style={{
                                    background: `linear-gradient(135deg, ${gradient.colors[0]}, ${gradient.colors[1]})`,
                                  }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>{gradient.name}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Layers Panel */}
                  {activePanel === 'layers' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Layers</h3>
                      
                      {layers.length === 0 ? (
                        <p className="text-sm text-slate-500">No layers yet. Add elements to see them here.</p>
                      ) : (
                        <div className="space-y-1">
                          {layers.map((layer) => (
                            <div
                              key={layer.id}
                              onClick={() => {
                                if (!layer.locked) {
                                  fabricCanvasRef.current?.setActiveObject(layer.object)
                                  fabricCanvasRef.current?.renderAll()
                                }
                              }}
                              className={cn(
                                'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                                selectedObject === layer.object
                                  ? 'bg-indigo-100 dark:bg-indigo-900/50'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                              )}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleVisibility(layer.id)
                                }}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleLock(layer.id)
                                }}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                              <span className="flex-1 text-sm truncate text-slate-700 dark:text-slate-300">
                                {layer.name}
                              </span>
                              <span className="text-xs text-slate-400 capitalize">{layer.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* NEW: Photo Editing Panel */}
                  {activePanel === 'photo-edit' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Photo Editing</h3>
                      
                      {!selectedObject || selectedObject.type !== 'image' ? (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Select an image to edit
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Crop Tools */}
                          <div className="space-y-2">
                            <label className="text-xs text-slate-500 mb-1 block">Crop & Resize</label>
                            {!isCropping ? (
                              <Button variant="outline" className="w-full" onClick={startCrop}>
                                <Crop className="w-4 h-4 mr-2" />
                                Crop Image
                              </Button>
                            ) : (
                              <div className="flex gap-2">
                                <Button variant="default" className="flex-1" onClick={applyCrop}>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Apply
                                </Button>
                                <Button variant="outline" className="flex-1" onClick={cancelCrop}>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Adjustments */}
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Adjustments</h4>
                            
                            {/* Brightness */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-slate-500 flex items-center gap-1">
                                  <SunMedium className="w-3 h-3" />
                                  Brightness
                                </label>
                                <span className="text-xs text-slate-400">{brightness}</span>
                              </div>
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                value={brightness}
                                onChange={(e) => updateImageAdjustment('brightness', Number(e.target.value))}
                                className="w-full"
                              />
                            </div>

                            {/* Contrast */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-slate-500 flex items-center gap-1">
                                  <Contrast className="w-3 h-3" />
                                  Contrast
                                </label>
                                <span className="text-xs text-slate-400">{contrast}</span>
                              </div>
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                value={contrast}
                                onChange={(e) => updateImageAdjustment('contrast', Number(e.target.value))}
                                className="w-full"
                              />
                            </div>

                            {/* Saturation */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-slate-500 flex items-center gap-1">
                                  <Droplets className="w-3 h-3" />
                                  Saturation
                                </label>
                                <span className="text-xs text-slate-400">{saturation}</span>
                              </div>
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                value={saturation}
                                onChange={(e) => updateImageAdjustment('saturation', Number(e.target.value))}
                                className="w-full"
                              />
                            </div>

                            {/* Blur */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-slate-500 flex items-center gap-1">
                                  <Filter className="w-3 h-3" />
                                  Blur
                                </label>
                                <span className="text-xs text-slate-400">{blur}</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={blur}
                                onChange={(e) => updateImageAdjustment('blur', Number(e.target.value))}
                                className="w-full"
                              />
                            </div>

                            <Button variant="outline" size="sm" onClick={resetImageFilters} className="w-full mt-2">
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Reset All
                            </Button>
                          </div>

                          {/* Filters */}
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Filters</h4>
                            <div className="grid grid-cols-4 gap-2">
                              {PHOTO_FILTERS.map((filter) => (
                                <button
                                  key={filter.id}
                                  onClick={() => applyImageFilter(filter.id)}
                                  className={cn(
                                    'p-2 text-xs rounded-lg border transition-all text-center',
                                    selectedFilter === filter.id
                                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700'
                                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                  )}
                                >
                                  {filter.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Background Remover */}
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">AI Tools</h4>
                            <Button 
                              variant="outline" 
                              className="w-full" 
                              onClick={removeBackground}
                              disabled={isRemovingBackground}
                            >
                              {isRemovingBackground ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <ImageOff className="w-4 h-4 mr-2" />
                              )}
                              Remove Background
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* NEW: Elements Panel */}
                  {activePanel === 'elements' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Elements Library</h3>
                      
                      {/* Category Tabs - Row 1 */}
                      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {(['lines', 'frames', 'icons'] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setElementsCategory(cat)}
                            className={cn(
                              'flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                              elementsCategory === cat
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      
                      {/* Category Tabs - Row 2 */}
                      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {(['decorations', 'arrows', 'badges'] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setElementsCategory(cat)}
                            className={cn(
                              'flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                              elementsCategory === cat
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Elements Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {ELEMENTS_LIBRARY[elementsCategory]?.map((element) => (
                          <Tooltip key={element.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => addElementFromLibrary(elementsCategory, element)}
                                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-500 transition-all flex items-center justify-center aspect-square"
                              >
                                {(element as any).svg || <Minus className="w-5 h-5 text-slate-600" />}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{element.name}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                      
                      {/* Quick Shapes */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Quick Shapes</h4>
                        <div className="grid grid-cols-4 gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => addShape('rect')}
                                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-500 transition-all"
                              >
                                <Square className="w-5 h-5 text-slate-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Rectangle</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => addShape('circle')}
                                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-500 transition-all"
                              >
                                <Circle className="w-5 h-5 text-slate-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Circle</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => addShape('triangle')}
                                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-500 transition-all"
                              >
                                <Triangle className="w-5 h-5 text-slate-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Triangle</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => addShape('star')}
                                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-500 transition-all"
                              >
                                <Star className="w-5 h-5 text-slate-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Star</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NEW: Brand Kit Panel */}
                  {activePanel === 'brand-kit' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Brand Kits</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowBrandKitModal(true)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {brandKits.length === 0 ? (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                          <PaletteIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                          <p className="text-sm text-slate-500">No brand kits yet</p>
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowBrandKitModal(true)}>
                            Create Brand Kit
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {brandKits.map((kit) => (
                            <div
                              key={kit.id}
                              className={cn(
                                'p-3 rounded-lg border transition-all cursor-pointer',
                                selectedBrandKit?.id === kit.id
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                              )}
                              onClick={() => applyBrandKit(kit)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{kit.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteBrandKit(kit.id)
                                  }}
                                  className="text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <div className="w-6 h-6 rounded" style={{ backgroundColor: kit.primaryColor }} />
                                <div className="w-6 h-6 rounded" style={{ backgroundColor: kit.secondaryColor }} />
                                <div className="w-6 h-6 rounded" style={{ backgroundColor: kit.accentColor }} />
                              </div>
                              <div className="mt-2 text-xs text-slate-400">
                                {kit.fonts.join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* NEW: Magic Studio Panel */}
                  {activePanel === 'magic-studio' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Magic Studio âœ¨</h3>
                      
                      {/* AI Generation */}
                      <div className="p-4 bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                          <Wand2 className="w-4 h-4" />
                          AI Text-to-Image
                        </h4>
                        <Textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="Describe what you want to create..."
                          rows={3}
                          className="resize-none mb-2"
                        />
                        <Button 
                          onClick={generateAIImage} 
                          className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                          disabled={isGeneratingAI}
                        >
                          {isGeneratingAI ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Magic Effects */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Magic Effects</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => applyMagicEffect('enhance')}
                            disabled={!selectedObject || isGeneratingAI}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Auto Enhance
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => applyMagicEffect('animate')}
                            disabled={!selectedObject || isGeneratingAI}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Magic Animate
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => applyMagicEffect('style-transfer')}
                            disabled={!selectedObject || selectedObject.type !== 'image' || isGeneratingAI}
                          >
                            <PaletteIcon className="w-3 h-3 mr-1" />
                            Style Transfer
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => applyMagicEffect('upscale')}
                            disabled={!selectedObject || selectedObject.type !== 'image' || isGeneratingAI}
                          >
                            <Maximize className="w-3 h-3 mr-1" />
                            AI Upscale
                          </Button>
                        </div>
                      </div>

                      {/* AI Caption */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">AI Caption</h4>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={generateCaption}
                          disabled={isGeneratingCaption}
                        >
                          {isGeneratingCaption ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Type className="w-4 h-4 mr-2" />
                              Generate Caption for Post
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* NEW: Templates Panel (Design Templates) */}
                  {activePanel === 'templates' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Design Templates</h3>
                      <Button onClick={() => setShowTemplateModal(true)} variant="outline" className="w-full">
                        <LayoutTemplate className="w-4 h-4 mr-2" />
                        New Canvas Size
                      </Button>

                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Quick Templates</h4>
                        <div className="space-y-2">
                          {DESIGN_TEMPLATES.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => applyDesignTemplate(template)}
                              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left flex items-center gap-3"
                            >
                              <span className="text-2xl">{template.thumbnail}</span>
                              <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{template.name}</p>
                                <p className="text-xs text-slate-400">{template.category}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pages Panel */}
                  {activePanel === 'pages' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Pages</h3>
                        <Button onClick={addPage} size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Page
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {pages.map((page, index) => (
                          <div
                            key={page.id}
                            className={cn(
                              'p-3 rounded-lg border-2 transition-all cursor-pointer group',
                              index === currentPageIndex
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                            )}
                            onClick={() => switchPage(index)}
                          >
                            <div className="flex items-center gap-3">
                              {/* Page Thumbnail */}
                              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                {page.thumbnail ? (
                                  <img src={page.thumbnail} alt={page.name} className="w-full h-full object-cover" />
                                ) : (
                                  <FileImage className="w-6 h-6 text-slate-400" />
                                )}
                              </div>
                              
                              {/* Page Info */}
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={page.name}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    renamePage(index, e.target.value)
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                  {index === currentPageIndex ? 'Current' : `Page ${index + 1}`}
                                </p>
                              </div>
                              
                              {/* Page Actions */}
                              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    duplicatePage(index)
                                  }}
                                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                  title="Duplicate Page"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deletePage(index)
                                  }}
                                  className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                                  title="Delete Page"
                                  disabled={pages.length <= 1}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Page Navigation */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <button
                            onClick={() => switchPage(Math.max(0, currentPageIndex - 1))}
                            disabled={currentPageIndex === 0}
                            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <span>Page {currentPageIndex + 1} of {pages.length}</span>
                          <button
                            onClick={() => switchPage(Math.min(pages.length - 1, currentPageIndex + 1))}
                            disabled={currentPageIndex === pages.length - 1}
                            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Professional Tools Panel */}
                  {activePanel === 'pro-tools' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Professional Tools</h3>
                      
                      {/* Selection Tools */}
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Selection</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {SELECTION_TOOLS.map((tool) => (
                            <Tooltip key={tool.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    setActiveTool(tool.id)
                                    if (fabricCanvasRef.current) {
                                      fabricCanvasRef.current.isDrawingMode = false
                                      setIsDrawingMode(false)
                                    }
                                    toast.success(`${tool.name} tool activated`)
                                  }}
                                  className={cn(
                                    'p-2.5 rounded-lg border transition-all flex flex-col items-center gap-1',
                                    activeTool === tool.id
                                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-600'
                                  )}
                                >
                                  <tool.icon className="w-4 h-4" />
                                  <span className="text-[10px]">{tool.name}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{tool.description}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>

                      {/* Retouching Tools */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Retouching</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {RETOUCHING_TOOLS.map((tool) => (
                            <Tooltip key={tool.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    setActiveTool(tool.id)
                                    if (tool.id === 'brush' || tool.id === 'pencil') {
                                      if (fabricCanvasRef.current) {
                                        fabricCanvasRef.current.isDrawingMode = true
                                        setIsDrawingMode(true)
                                        if (fabricCanvasRef.current.freeDrawingBrush) {
                                          fabricCanvasRef.current.freeDrawingBrush.color = brushColor
                                          fabricCanvasRef.current.freeDrawingBrush.width = tool.id === 'pencil' ? 2 : brushWidth
                                        }
                                      }
                                    } else {
                                      if (fabricCanvasRef.current) {
                                        fabricCanvasRef.current.isDrawingMode = false
                                        setIsDrawingMode(false)
                                      }
                                    }
                                    toast.success(`${tool.name} tool activated`)
                                  }}
                                  className={cn(
                                    'p-2.5 rounded-lg border transition-all flex flex-col items-center gap-1',
                                    activeTool === tool.id
                                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-600'
                                  )}
                                >
                                  <tool.icon className="w-4 h-4" />
                                  <span className="text-[10px]">{tool.name}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{tool.description}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>

                      {/* Fill & Measurement Tools */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Fill & Measure</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {[...FILL_TOOLS, ...MEASUREMENT_TOOLS].map((tool) => (
                            <Tooltip key={tool.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    setActiveTool(tool.id)
                                    if (fabricCanvasRef.current) {
                                      fabricCanvasRef.current.isDrawingMode = false
                                      setIsDrawingMode(false)
                                    }
                                    toast.success(`${tool.name} tool activated`)
                                  }}
                                  className={cn(
                                    'p-2.5 rounded-lg border transition-all flex flex-col items-center gap-1',
                                    activeTool === tool.id
                                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-600'
                                  )}
                                >
                                  <tool.icon className="w-4 h-4" />
                                  <span className="text-[10px]">{tool.name}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{tool.description}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>

                      {/* Tool Settings */}
                      {(activeTool === 'eyedropper') && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                          <h4 className="text-xs font-medium text-slate-500 mb-2">Eyedropper Tool</h4>
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 mb-3">
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">
                              Click anywhere on the canvas to sample a color
                            </p>
                          </div>
                          {sampledColor && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-600"
                                style={{ backgroundColor: sampledColor }}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300">{sampledColor}</p>
                                <Button size="sm" variant="default" className="mt-1 w-full" onClick={() => setFillColor(sampledColor)}>
                                  Use as Fill Color
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTool === 'ruler' && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                          <h4 className="text-xs font-medium text-slate-500 mb-2">Ruler Tool</h4>
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 mb-3">
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">
                              Click to set start point, click again to measure
                            </p>
                          </div>
                          {measureDistance !== null && (
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                              <p className="text-2xl font-bold text-indigo-600">{measureDistance}px</p>
                              <p className="text-xs text-slate-500 mt-1">Distance measured</p>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTool === 'clone-stamp' && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                          <h4 className="text-xs font-medium text-slate-500 mb-2">Clone Stamp</h4>
                          <div className={cn(
                            "p-3 rounded-lg border",
                            isCloning 
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                              : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                          )}>
                            <p className={cn(
                              "text-sm",
                              isCloning ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"
                            )}>
                              {isCloning ? '✓ Source set! Paint to clone.' : 'Hold Alt and click to set source point'}
                            </p>
                          </div>
                          {cloneSource && (
                            <p className="text-xs text-slate-500 mt-2">
                              Source: ({cloneSource.x}, {cloneSource.y})
                            </p>
                          )}
                        </div>
                      )}

                      {activeTool === 'paint-bucket' && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                          <h4 className="text-xs font-medium text-slate-500 mb-2">Paint Bucket</h4>
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 mb-3">
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">
                              Select a shape and click to fill it with current color
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-slate-500">Fill Color:</div>
                            <input
                              type="color"
                              value={fillColor}
                              onChange={(e) => setFillColor(e.target.value)}
                              className="w-8 h-8 rounded cursor-pointer border-0"
                            />
                            <span className="text-xs font-mono">{fillColor}</span>
                          </div>
                          <Button 
                            className="w-full mt-2" 
                            onClick={handlePaintBucket}
                            disabled={!selectedObject}
                          >
                            <PaintBucket className="w-4 h-4 mr-2" />
                            Fill Selected Shape
                          </Button>
                        </div>
                      )}

                      {(activeTool === 'brush' || activeTool === 'pencil') && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                          <h4 className="text-xs font-medium text-slate-500 mb-2">
                            {activeTool === 'brush' ? 'Brush' : 'Pencil'} Settings
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-slate-500 mb-1 block">Color</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={brushColor}
                                  onChange={(e) => {
                                    setBrushColor(e.target.value)
                                    if (fabricCanvasRef.current?.freeDrawingBrush) {
                                      fabricCanvasRef.current.freeDrawingBrush.color = e.target.value
                                    }
                                  }}
                                  className="w-10 h-10 rounded cursor-pointer border-0"
                                />
                                <span className="text-xs font-mono">{brushColor}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 mb-1 block">Size: {brushWidth}px</label>
                              <input
                                type="range"
                                min="1"
                                max="50"
                                value={brushWidth}
                                onChange={(e) => {
                                  const value = Number(e.target.value)
                                  setBrushWidth(value)
                                  if (fabricCanvasRef.current?.freeDrawingBrush) {
                                    fabricCanvasRef.current.freeDrawingBrush.width = value
                                  }
                                }}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTool === 'eraser' && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                          <h4 className="text-xs font-medium text-slate-500 mb-2">Eraser Tool</h4>
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 mb-3">
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">
                              Draw to erase parts of the canvas
                            </p>
                          </div>
                          <Button className="w-full" onClick={handleEraser}>
                            <Eraser className="w-4 h-4 mr-2" />
                            Start Erasing
                          </Button>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Quick Actions</h4>
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start" 
                            onClick={() => { setActiveTool('select'); toast.success('Select tool activated') }}
                          >
                            <MousePointer2 className="w-4 h-4 mr-2" />
                            Reset to Select Tool
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start" 
                            onClick={() => { setMeasureDistance(null); setMeasureStart(null); setMeasureEnd(null) }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Clear Measurements
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Select Panel - Object Properties */}
                  {activePanel === 'select' && selectedObject && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Object Properties</h3>
                      
                      {/* Opacity */}
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Opacity: {opacity}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={opacity}
                          onChange={(e) => updateObjectProperty('opacity', Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Actions</h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" onClick={duplicateSelected}>
                            <Copy className="w-4 h-4 mr-1" /> Duplicate
                          </Button>
                          <Button variant="outline" size="sm" onClick={deleteSelected} className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>

                      {/* Position */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Alignment</h4>
                        <div className="grid grid-cols-3 gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => alignObject('left')}>
                                <AlignLeft className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Left</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => alignObject('center')}>
                                <AlignHorizontalJustifyCenter className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Center Horizontally</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => alignObject('right')}>
                                <AlignRight className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Right</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => alignObject('top')}>
                                <ArrowUpToLine className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Top</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => alignObject('middle')}>
                                <AlignVerticalJustifyCenter className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Center Vertically</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => alignObject('bottom')}>
                                <ArrowDownToLine className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Bottom</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Layer Order */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Layer Order</h4>
                        <div className="grid grid-cols-4 gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={bringToFront}>
                                <ArrowUpToLine className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Bring to Front</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={bringForward}>
                                <MoveUp className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Bring Forward</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={sendBackward}>
                                <MoveDown className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Send Backward</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={sendToBack}>
                                <ArrowDownToLine className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Send to Back</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Transform */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Transform</h4>
                        <div className="grid grid-cols-4 gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => rotateObject(-15)}>
                                <RotateCw className="w-4 h-4 scale-x-[-1]" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rotate Left 15Â°</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => rotateObject(15)}>
                                <RotateCw className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rotate Right 15Â°</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={flipHorizontal}>
                                <FlipHorizontal2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Flip Horizontal</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={flipVertical}>
                                <FlipVertical2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Flip Vertical</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePanel === 'select' && !selectedObject && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Select Tool</h3>
                      <p className="text-sm text-slate-500">
                        Click on any element to select it and edit its properties.
                      </p>
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Keyboard Shortcuts</h4>
                        <ul className="text-sm text-slate-500 space-y-1">
                          <li><kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+Z</kbd> Undo</li>
                          <li><kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+Y</kbd> Redo</li>
                          <li><kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+C</kbd> Copy</li>
                          <li><kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+V</kbd> Paste</li>
                          <li><kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+D</kbd> Duplicate</li>
                          <li><kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Delete</kbd> Remove</li>
                          <li><kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Esc</kbd> Deselect</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activePanel === 'templates' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Templates</h3>
                      <Button onClick={() => setShowTemplateModal(true)} className="w-full">
                        <LayoutTemplate className="w-4 h-4 mr-2" />
                        Choose Template
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              ref={containerRef}
              className={cn(
                'flex-1 overflow-auto flex items-center justify-center p-8',
                showGrid && 'bg-size-[20px_20px] bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)]',
                activeTool === 'eyedropper' && 'cursor-crosshair',
                activeTool === 'ruler' && 'cursor-crosshair',
                activeTool === 'paint-bucket' && 'cursor-cell'
              )}
              style={{ backgroundColor: '#f1f5f9' }}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
            >
              <div className="shadow-2xl rounded-lg overflow-hidden relative" style={{ backgroundColor: '#fff' }}>
                <canvas ref={canvasRef} />
                {/* Ruler measurement overlay */}
                {activeTool === 'ruler' && measureStart && measureEnd && (
                  <svg 
                    className="absolute inset-0 pointer-events-none" 
                    style={{ width: '100%', height: '100%' }}
                  >
                    <line 
                      x1={measureStart.x} 
                      y1={measureStart.y} 
                      x2={measureEnd.x} 
                      y2={measureEnd.y} 
                      stroke="#6366f1" 
                      strokeWidth="2" 
                      strokeDasharray="5,5"
                    />
                    <circle cx={measureStart.x} cy={measureStart.y} r="4" fill="#6366f1" />
                    <circle cx={measureEnd.x} cy={measureEnd.y} r="4" fill="#6366f1" />
                    {measureDistance && (
                      <text 
                        x={(measureStart.x + measureEnd.x) / 2} 
                        y={(measureStart.y + measureEnd.y) / 2 - 10} 
                        fill="#6366f1" 
                        fontSize="12" 
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {measureDistance}px
                      </text>
                    )}
                  </svg>
                )}
              </div>
            </div>
            
            {/* Page Navigation Bar - Canva Style */}
            <div className="h-20 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-700 flex items-center justify-center px-6 gap-4">
              {/* Page Thumbnails */}
              <div className="flex items-center gap-3 overflow-x-auto py-2">
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    className="relative group"
                  >
                    <button
                      onClick={() => switchPage(index)}
                      className={cn(
                        'w-16 h-12 rounded-lg border-2 flex items-center justify-center transition-all overflow-hidden bg-white dark:bg-slate-800',
                        index === currentPageIndex
                          ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900'
                          : 'border-slate-200 dark:border-slate-600 hover:border-indigo-400'
                      )}
                    >
                      {page.thumbnail ? (
                        <img 
                          src={page.thumbnail} 
                          alt={page.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-slate-400">{index + 1}</span>
                      )}
                    </button>
                    {/* Page number badge */}
                    <span className={cn(
                      'absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium px-1.5 py-0.5 rounded',
                      index === currentPageIndex
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    )}>
                      {index + 1}
                    </span>
                    {/* Delete button on hover */}
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePage(index)
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                
                {/* Add Page Button - Canva Style */}
                <button
                  onClick={addPage}
                  className="w-16 h-12 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-0.5 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                >
                  <Plus className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                  <span className="text-[9px] text-slate-400 group-hover:text-indigo-500">Add page</span>
                </button>
              </div>

              {/* Page Info & Navigation */}
              <div className="flex items-center gap-2 ml-4 border-l border-slate-300 dark:border-slate-700 pl-4">
                <button
                  onClick={() => switchPage(Math.max(0, currentPageIndex - 1))}
                  disabled={currentPageIndex === 0}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-500 min-w-[60px] text-center">
                  {currentPageIndex + 1} / {pages.length}
                </span>
                <button
                  onClick={() => switchPage(Math.min(pages.length - 1, currentPageIndex + 1))}
                  disabled={currentPageIndex === pages.length - 1}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Post Modal */}
        <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                Share Your Design
              </DialogTitle>
              <DialogDescription>
                Post your design directly to your social media accounts
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Preview */}
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                {fabricCanvasRef.current && (
                  <img
                    src={getCanvasDataUrl() || ''}
                    alt="Design preview"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Caption</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateCaption}
                    disabled={isGeneratingCaption}
                  >
                    {isGeneratingCaption ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-1" />
                    )}
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Write a caption for your post..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Hashtags</label>
                <Input
                  value={postHashtags}
                  onChange={(e) => setPostHashtags(e.target.value)}
                  placeholder="#design #socialmedia #creative"
                />
              </div>

              {/* Platform Selection */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">Select Platforms</label>
                {socialAccounts.length === 0 ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      No social accounts connected. Go to Social Accounts to connect your accounts.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate('/social-accounts')}
                    >
                      Connect Accounts
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {socialAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => {
                          setSelectedPlatforms(prev =>
                            prev.includes(account.id)
                              ? prev.filter(id => id !== account.id)
                              : [...prev, account.id]
                          )
                        }}
                        className={cn(
                          'px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2',
                          selectedPlatforms.includes(account.id)
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        )}
                      >
                        <span className="text-sm font-medium">{account.accountName}</span>
                        <Badge variant="secondary" className="text-xs">{account.platform}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Schedule for later</p>
                    <p className="text-xs text-slate-500">Choose when to publish your post</p>
                  </div>
                </div>
                <Switch checked={isScheduling} onCheckedChange={setIsScheduling} />
              </div>

              {/* Schedule Date/Time */}
              {isScheduling && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Date</label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Time</label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowPostModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePost} 
                disabled={isPosting || selectedPlatforms.length === 0}
                className="min-w-30"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isScheduling ? 'Scheduling...' : 'Posting...'}
                  </>
                ) : (
                  <>
                    {isScheduling ? <Calendar className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {isScheduling ? 'Schedule Post' : 'Post Now'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Brand Kit Modal */}
        <Dialog open={showBrandKitModal} onOpenChange={setShowBrandKitModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PaletteIcon className="w-5 h-5 text-indigo-600" />
                Create Brand Kit
              </DialogTitle>
              <DialogDescription>
                Save your brand colors and fonts for consistent designs
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Brand Name */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Brand Name</label>
                <Input
                  value={newBrandKit.name || ''}
                  onChange={(e) => setNewBrandKit(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Brand"
                />
              </div>

              {/* Colors */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Brand Colors</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Primary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newBrandKit.primaryColor || '#6366f1'}
                        onChange={(e) => setNewBrandKit(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Secondary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newBrandKit.secondaryColor || '#818cf8'}
                        onChange={(e) => setNewBrandKit(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Accent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newBrandKit.accentColor || '#c7d2fe'}
                        onChange={(e) => setNewBrandKit(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fonts */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Primary Font</label>
                <select
                  value={newBrandKit.fonts?.[0] || 'Arial'}
                  onChange={(e) => setNewBrandKit(prev => ({ ...prev, fonts: [e.target.value] }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  {FONT_FAMILIES.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowBrandKitModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveBrandKit}>
                <Save className="w-4 h-4 mr-2" />
                Save Brand Kit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Magic Studio Modal */}
        <Dialog open={showMagicStudioModal} onOpenChange={setShowMagicStudioModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Magic Studio
              </DialogTitle>
              <DialogDescription>
                AI-powered tools to enhance your designs
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowMagicStudioModal(false)
                    setActivePanel('magic-studio')
                  }}
                  className="p-4 bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:scale-105 transition-transform text-left"
                >
                  <Wand2 className="w-6 h-6 text-indigo-600 mb-2" />
                  <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">Text to Image</h4>
                  <p className="text-xs text-slate-500">Generate images from text</p>
                </button>
                <button
                  onClick={() => {
                    setShowMagicStudioModal(false)
                    if (selectedObject) applyMagicEffect('enhance')
                  }}
                  className="p-4 bg-linear-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:scale-105 transition-transform text-left"
                >
                  <Sparkles className="w-6 h-6 text-cyan-600 mb-2" />
                  <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">Auto Enhance</h4>
                  <p className="text-xs text-slate-500">Improve image quality</p>
                </button>
                <button
                  onClick={removeBackground}
                  className="p-4 bg-linear-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg border border-pink-200 dark:border-pink-800 hover:scale-105 transition-transform text-left"
                >
                  <ImageOff className="w-6 h-6 text-pink-600 mb-2" />
                  <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">Remove Background</h4>
                  <p className="text-xs text-slate-500">One-click background removal</p>
                </button>
                <button
                  onClick={() => {
                    setShowMagicStudioModal(false)
                    if (selectedObject) applyMagicEffect('upscale')
                  }}
                  className="p-4 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800 hover:scale-105 transition-transform text-left"
                >
                  <Maximize className="w-6 h-6 text-amber-600 mb-2" />
                  <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">AI Upscale</h4>
                  <p className="text-xs text-slate-500">Increase image resolution</p>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default DesignStudio
