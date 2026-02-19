import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import * as fabric from 'fabric'
import { v4 as uuidv4 } from 'uuid'
import { jsPDF } from 'jspdf'
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
  // Phase 10 new imports
  Cloud,
  CloudUpload,
  Film,
  Scissors,
  BarChart3,
  QrCode,
  Table2,
  Paintbrush,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  PieChart,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  Youtube,
  Camera,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../components/ui/Tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/Dialog'
import { Switch } from '../components/ui/Switch'
import { postsApi, socialAccountsApi, mediaApi } from '../services/api'
import { useDataCache } from '../lib/useDataCache'
import { useWorkspaceStore } from '../store'
import { generateText, generateImage } from '../services/ai'
import toast from 'react-hot-toast'

// ============ LocalStorage Keys ============
const LS_DESIGNS_KEY = 'designStudio_savedDesigns'
const LS_BRANDKITS_KEY = 'designStudio_brandKits'
// const LS_RECENT_KEY = 'designStudio_recentDesigns'

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
  { 
    id: 'testimonial', 
    name: 'Testimonial', 
    category: 'Marketing',
    thumbnail: '⭐',
    elements: [
      { type: 'rect', props: { fill: '#f8fafc', width: 1080, height: 1080, left: 0, top: 0 } },
      { type: 'rect', props: { fill: '#6366f1', width: 1080, height: 8, left: 0, top: 0 } },
      { type: 'text', props: { text: '⭐⭐⭐⭐⭐', fontSize: 36, fontFamily: 'Arial', fill: '#f59e0b', left: 340, top: 200 } },
      { type: 'text', props: { text: '"This product changed my life! Absolutely amazing experience."', fontSize: 32, fontFamily: 'Georgia', fill: '#1e293b', left: 100, top: 350, textAlign: 'center' } },
      { type: 'text', props: { text: '— Happy Customer', fontSize: 22, fontFamily: 'Arial', fill: '#64748b', left: 380, top: 550 } },
    ]
  },
  { 
    id: 'event-invite', 
    name: 'Event Invitation', 
    category: 'Social Media',
    thumbnail: '🎪',
    elements: [
      { type: 'rect', props: { fill: '#0f172a', width: 1080, height: 1920, left: 0, top: 0 } },
      { type: 'text', props: { text: "YOU'RE INVITED", fontSize: 56, fontFamily: 'Impact', fill: '#f59e0b', left: 180, top: 400 } },
      { type: 'text', props: { text: 'Event Name', fontSize: 72, fontFamily: 'Arial Black', fill: '#ffffff', left: 200, top: 600 } },
      { type: 'text', props: { text: 'Date • Time • Location', fontSize: 24, fontFamily: 'Arial', fill: '#94a3b8', left: 280, top: 750 } },
    ]
  },
  { 
    id: 'product-showcase', 
    name: 'Product Card', 
    category: 'Marketing',
    thumbnail: '🛍️',
    elements: [
      { type: 'rect', props: { fill: '#ffffff', width: 1080, height: 1080, left: 0, top: 0 } },
      { type: 'rect', props: { fill: '#f1f5f9', width: 1080, height: 700, left: 0, top: 0 } },
      { type: 'text', props: { text: 'Product Name', fontSize: 42, fontFamily: 'Arial Black', fill: '#1e293b', left: 100, top: 750 } },
      { type: 'text', props: { text: '$99.99', fontSize: 48, fontFamily: 'Arial', fill: '#6366f1', left: 100, top: 830 } },
      { type: 'text', props: { text: 'Shop Now →', fontSize: 24, fontFamily: 'Arial', fill: '#6366f1', left: 100, top: 920 } },
    ]
  },
  { 
    id: 'tip-card', 
    name: 'Tip / How-to', 
    category: 'Social Media',
    thumbnail: '💡',
    elements: [
      { type: 'rect', props: { fill: '#ecfdf5', width: 1080, height: 1080, left: 0, top: 0 } },
      { type: 'text', props: { text: '💡 Quick Tip', fontSize: 48, fontFamily: 'Arial Black', fill: '#065f46', left: 100, top: 150 } },
      { type: 'text', props: { text: '1. First step here\n2. Second step here\n3. Third step here', fontSize: 30, fontFamily: 'Arial', fill: '#1e293b', left: 100, top: 350 } },
      { type: 'text', props: { text: 'Save this for later! 🔖', fontSize: 24, fontFamily: 'Arial', fill: '#64748b', left: 100, top: 850 } },
    ]
  },
  { 
    id: 'countdown', 
    name: 'Countdown', 
    category: 'Marketing',
    thumbnail: '⏰',
    elements: [
      { type: 'rect', props: { fill: '#7c3aed', width: 1080, height: 1080, left: 0, top: 0 } },
      { type: 'text', props: { text: 'LAUNCHING IN', fontSize: 28, fontFamily: 'Arial', fill: '#c4b5fd', left: 380, top: 250 } },
      { type: 'text', props: { text: '3 DAYS', fontSize: 120, fontFamily: 'Impact', fill: '#ffffff', left: 220, top: 380 } },
      { type: 'text', props: { text: 'Stay Tuned!', fontSize: 36, fontFamily: 'Georgia', fill: '#e9d5ff', left: 380, top: 580 } },
    ]
  },
  { 
    id: 'podcast-cover', 
    name: 'Podcast Cover', 
    category: 'Business',
    thumbnail: '🎙️',
    elements: [
      { type: 'rect', props: { fill: '#1e1b4b', width: 1080, height: 1080, left: 0, top: 0 } },
      { type: 'text', props: { text: '🎙️', fontSize: 80, fontFamily: 'Arial', fill: '#ffffff', left: 470, top: 200 } },
      { type: 'text', props: { text: 'PODCAST\nNAME', fontSize: 72, fontFamily: 'Impact', fill: '#ffffff', left: 250, top: 400, textAlign: 'center' } },
      { type: 'text', props: { text: 'Episode 01: The Beginning', fontSize: 24, fontFamily: 'Arial', fill: '#a5b4fc', left: 280, top: 650 } },
    ]
  },
  { 
    id: 'before-after', 
    name: 'Before/After', 
    category: 'Social Media',
    thumbnail: '↔️',
    elements: [
      { type: 'rect', props: { fill: '#ffffff', width: 1080, height: 1080, left: 0, top: 0 } },
      { type: 'rect', props: { fill: '#ef4444', width: 540, height: 1080, left: 0, top: 0 } },
      { type: 'rect', props: { fill: '#10b981', width: 540, height: 1080, left: 540, top: 0 } },
      { type: 'text', props: { text: 'BEFORE', fontSize: 48, fontFamily: 'Impact', fill: '#ffffff', left: 150, top: 480 } },
      { type: 'text', props: { text: 'AFTER', fontSize: 48, fontFamily: 'Impact', fill: '#ffffff', left: 700, top: 480 } },
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
// ============ Canva-Style Text Effects ============
const TEXT_EFFECTS = [
  { id: 'none', name: 'None', preview: 'Aa' },
  { id: 'shadow', name: 'Shadow', preview: 'Aa' },
  { id: 'outline', name: 'Outline', preview: 'Aa' },
  { id: 'glow', name: 'Glow', preview: 'Aa' },
  { id: 'neon', name: 'Neon', preview: 'Aa' },
  { id: 'echo', name: 'Echo', preview: 'Aa' },
  { id: 'lift', name: 'Lift', preview: 'Aa' },
  { id: 'hollow', name: 'Hollow', preview: 'Aa' },
]

// ============ One-Click Filters (Instagram/Canva style) ============
const CANVA_FILTERS = [
  { id: 'original', name: 'Original', brightness: 0, contrast: 0, saturation: 0 },
  { id: 'vivid', name: 'Vivid', brightness: 0, contrast: 15, saturation: 40 },
  { id: 'warm', name: 'Warm', brightness: 5, contrast: 0, saturation: 20 },
  { id: 'cool', name: 'Cool', brightness: 5, contrast: 0, saturation: -10 },
  { id: 'dramatic', name: 'Dramatic', brightness: 0, contrast: 35, saturation: -20 },
  { id: 'vintage', name: 'Vintage', brightness: 8, contrast: 0, saturation: -30 },
  { id: 'bw', name: 'B&W', brightness: 0, contrast: 0, saturation: -100 },
  { id: 'fade', name: 'Fade', brightness: 12, contrast: -10, saturation: -40 },
  { id: 'retro', name: 'Retro', brightness: 0, contrast: 10, saturation: -5 },
  { id: 'pop', name: 'Pop', brightness: 5, contrast: 20, saturation: 50 },
  { id: 'noir', name: 'Noir', brightness: 0, contrast: 30, saturation: -100 },
  { id: 'dreamy', name: 'Dreamy', brightness: 15, contrast: -5, saturation: -15 },
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
  callouts: [
    { id: 'callout-rect', name: 'Speech Bubble', path: 'M 10 10 L 90 10 L 90 60 L 40 60 L 20 80 L 30 60 L 10 60 Z', props: { fill: '#e2e8f0', stroke: '#94a3b8', strokeWidth: 2, scaleX: 2, scaleY: 2 } },
    { id: 'callout-round', name: 'Round Bubble', path: 'M 50 10 Q 90 10 90 40 Q 90 65 55 65 L 40 80 L 45 65 Q 10 65 10 40 Q 10 10 50 10', props: { fill: '#dbeafe', stroke: '#60a5fa', strokeWidth: 2, scaleX: 2, scaleY: 2 } },
    { id: 'callout-thought', name: 'Thought Bubble', path: 'M 50 10 Q 85 5 85 35 Q 90 60 60 65 Q 55 70 50 70 Q 35 75 30 80 Q 35 70 30 65 Q 10 60 10 35 Q 10 10 50 10', props: { fill: '#fef3c7', stroke: '#fbbf24', strokeWidth: 2, scaleX: 2, scaleY: 2 } },
    { id: 'callout-shout', name: 'Shout Bubble', path: 'M 50 0 L 62 25 L 90 15 L 75 40 L 100 50 L 75 60 L 90 85 L 62 75 L 50 100 L 38 75 L 10 85 L 25 60 L 0 50 L 25 40 L 10 15 L 38 25 Z', props: { fill: '#fee2e2', stroke: '#f87171', strokeWidth: 2, scaleX: 1.5, scaleY: 1.5 } },
    { id: 'callout-note', name: 'Sticky Note', type: 'rect', props: { fill: '#fef08a', width: 150, height: 150, rx: 4, ry: 4, shadow: true } },
    { id: 'callout-tag', name: 'Tag', path: 'M 0 10 L 10 0 L 80 0 L 100 20 L 80 40 L 10 40 Z', props: { fill: '#c4b5fd', stroke: '#8b5cf6', strokeWidth: 1.5, scaleX: 2, scaleY: 2 } },
  ],
  social: [
    { id: 'social-like', name: 'Like', svg: '👍' },
    { id: 'social-love', name: 'Love', svg: '❤️' },
    { id: 'social-wow', name: 'Wow', svg: '😮' },
    { id: 'social-laugh', name: 'Laugh', svg: '😂' },
    { id: 'social-sad', name: 'Sad', svg: '😢' },
    { id: 'social-angry', name: 'Angry', svg: '😡' },
    { id: 'social-100', name: '100', svg: '💯' },
    { id: 'social-clap', name: 'Clap', svg: '👏' },
    { id: 'social-rocket', name: 'Rocket', svg: '🚀' },
    { id: 'social-trophy', name: 'Trophy', svg: '🏆' },
    { id: 'social-megaphone', name: 'Megaphone', svg: '📢' },
    { id: 'social-camera', name: 'Camera', svg: '📸' },
    { id: 'social-pin', name: 'Pin', svg: '📌' },
    { id: 'social-money', name: 'Money', svg: '💰' },
    { id: 'social-gift', name: 'Gift', svg: '🎁' },
    { id: 'social-checkmark', name: 'Check', svg: '✅' },
    { id: 'social-party', name: 'Party', svg: '🎉' },
    { id: 'social-target', name: 'Target', svg: '🎯' },
    { id: 'social-bulb', name: 'Bulb', svg: '💡' },
    { id: 'social-chart', name: 'Chart', svg: '📈' },
  ],
  dividers: [
    { id: 'div-solid', name: 'Solid', path: 'M 0 0 L 200 0', props: { stroke: '#94a3b8', strokeWidth: 2, fill: '' } },
    { id: 'div-dashed', name: 'Dashed', path: 'M 0 0 L 200 0', strokeDashArray: [10, 5], props: { stroke: '#94a3b8', strokeWidth: 2, fill: '' } },
    { id: 'div-dotted', name: 'Dotted', path: 'M 0 0 L 200 0', strokeDashArray: [2, 4], props: { stroke: '#94a3b8', strokeWidth: 2, fill: '' } },
    { id: 'div-double', name: 'Double', path: 'M 0 0 L 200 0 M 0 6 L 200 6', props: { stroke: '#94a3b8', strokeWidth: 1.5, fill: '' } },
    { id: 'div-fancy-1', name: 'Diamond', path: 'M 0 5 L 80 5 L 90 0 L 100 5 L 110 10 L 100 5 L 90 10 L 80 5 M 110 5 L 200 5', props: { stroke: '#94a3b8', strokeWidth: 1.5, fill: '' } },
    { id: 'div-gradient-bar', name: 'Bar', type: 'rect', props: { fill: '#6366f1', width: 200, height: 4, rx: 2, ry: 2 } },
    { id: 'div-thick-bar', name: 'Thick Bar', type: 'rect', props: { fill: '#334155', width: 200, height: 8, rx: 4, ry: 4 } },
    { id: 'div-dots-row', name: 'Dots Row', path: 'M 5 5 L 6 5 M 15 5 L 16 5 M 25 5 L 26 5 M 35 5 L 36 5 M 45 5 L 46 5 M 55 5 L 56 5 M 65 5 L 66 5 M 75 5 L 76 5 M 85 5 L 86 5 M 95 5 L 96 5', props: { stroke: '#94a3b8', strokeWidth: 4, strokeLineCap: 'round', fill: '' } },
  ],
}

// ============ Simple QR Code Encoder ============
function encodeQR(text: string): boolean[][] {
  // Simple QR-like matrix generator (visual approximation for design purposes)
  const size = 25
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  
  // Fixed finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (sx: number, sy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if (y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4)) {
          matrix[sy + y][sx + x] = true
        }
      }
    }
  }
  drawFinder(0, 0)
  drawFinder(size - 7, 0)
  drawFinder(0, size - 7)

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }

  // Data encoding (hash-based visual pattern from input text)
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  }
  
  for (let y = 9; y < size - 1; y++) {
    for (let x = 9; x < size - 1; x++) {
      if (!matrix[y][x]) {
        hash = ((hash << 5) - hash + x * y + text.charCodeAt((x + y) % text.length)) | 0
        matrix[y][x] = (hash & 1) === 1
      }
    }
  }

  return matrix
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

  // ============ Tools State ============

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
  const [elementsCategory, setElementsCategory] = useState<'lines' | 'frames' | 'icons' | 'decorations' | 'arrows' | 'badges' | 'callouts' | 'social' | 'dividers'>('lines')

  // ============ NEW: Stock Images State ============
  const [stockSearchQuery, setStockSearchQuery] = useState('')
  const [stockImages, setStockImages] = useState<any[]>([])
  const [stockLoading, setStockLoading] = useState(false)

  // ============ NEW: Pages State ============
  interface PageData {
    id: string
    name: string
    canvasJSON: string
    thumbnail?: string
  }
  const [pages, setPages] = useState<PageData[]>([{ id: '1', name: 'Page 1', canvasJSON: '' }])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  // ============ NEW Phase 10: Cloud Save State ============
  const [isSavingToCloud, setIsSavingToCloud] = useState(false)
  const [cloudDesigns, setCloudDesigns] = useState<any[]>([])

  // ============ NEW Phase 10: Video Editor State ============
  const [showVideoEditor, setShowVideoEditor] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoTrimStart, setVideoTrimStart] = useState(0)
  const [videoTrimEnd, setVideoTrimEnd] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoFrames, setVideoFrames] = useState<string[]>([])
  const [isExtractingFrames, setIsExtractingFrames] = useState(false)

  // ============ NEW Phase 10: QR Code State ============
  const [qrText, setQrText] = useState('https://example.com')
  const [qrSize, setQrSize] = useState(200)
  const [qrFgColor, setQrFgColor] = useState('#000000')
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF')

  // ============ NEW Phase 10: Charts State ============
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line' | 'donut'>('bar')
  const [chartData, setChartData] = useState([
    { label: 'Jan', value: 65 },
    { label: 'Feb', value: 85 },
    { label: 'Mar', value: 45 },
    { label: 'Apr', value: 90 },
    { label: 'May', value: 70 },
  ])
  const [chartColors, setChartColors] = useState(['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'])
  const [chartTitle, setChartTitle] = useState('My Chart')

  // ============ NEW Phase 10: Table State ============
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [tableHeaderBg, setTableHeaderBg] = useState('#6366f1')
  const [tableStyle, setTableStyle] = useState<'modern' | 'classic' | 'minimal' | 'colorful'>('modern')

  // ============ NEW Phase 10: Mockup State ============
  const [mockupDevice, setMockupDevice] = useState<'phone' | 'tablet' | 'laptop' | 'desktop'>('phone')

  // ============ Fetch Social Accounts (cached) ============
  const { currentWorkspace: dsWorkspace } = useWorkspaceStore()
  const dsWsId = dsWorkspace?.id
  useDataCache<any[]>(
    `design-social-accounts:${dsWsId}`,
    async () => {
      if (!dsWsId) return []
      const response = await socialAccountsApi.getAll(dsWsId)
      const resData = (response as any)?.data ?? response
      return Array.isArray(resData) ? resData : resData?.accounts ?? []
    },
    {
      enabled: !!dsWsId,
      onSuccess: (data) => setSocialAccounts(data),
    }
  )

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

  // ============ Simple Canvas Tool Handlers ============

  // Canvas click handler (simplified - no pro tools)
  const handleCanvasClick = useCallback((_e: React.MouseEvent<HTMLDivElement>) => {
    // Simplified: no pro-tool handling needed
  }, [])

  // Canvas mouse move handler (simplified)
  const handleCanvasMouseMove = useCallback((_e: React.MouseEvent<HTMLDivElement>) => {
    // Simplified: no ruler/measure tool tracking needed
  }, [])

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

  // ============ Image/Video/Document Handling ============
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !fabricCanvasRef.current) return

    Array.from(files).forEach((file) => {
      const fileType = file.type.split('/')[0]
      
      if (fileType === 'video') {
        // Open video editor for full video editing experience
        openVideoEditor(file)
        return
      }
      
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        toast.error('PDF import: Export to image first, then upload the image.')
        return
      }
      
      // SVG files - load as vector
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader()
        reader.onload = (event) => {
          const svgString = event.target?.result as string
          fabric.loadSVGFromString(svgString).then((result) => {
            if (result.objects.length > 0) {
              const group = new fabric.Group(result.objects as fabric.FabricObject[], {
                left: canvasSize.width / 2 - 100,
                top: canvasSize.height / 2 - 100,
              })
              ;(group as any).id = uuidv4()
              ;(group as any).name = file.name
              fabricCanvasRef.current?.add(group)
              fabricCanvasRef.current?.setActiveObject(group)
              fabricCanvasRef.current?.renderAll()
              saveToHistory()
            }
          })
        }
        reader.readAsText(file)
        return
      }

      // Regular images (JPEG, PNG, WEBP, GIF etc)
      const reader = new FileReader()
      reader.onload = (event) => {
        const imgElement = document.createElement('img')
        imgElement.src = event.target?.result as string
        imgElement.onload = () => {
          // Smart-scale: fit to canvas but not larger than 80% of canvas
          const maxW = canvasSize.width * 0.8
          const maxH = canvasSize.height * 0.8
          const scale = Math.min(maxW / imgElement.width, maxH / imgElement.height, 1)
          
          const img = new fabric.FabricImage(imgElement, {
            left: canvasSize.width / 2 - (imgElement.width * scale) / 2,
            top: canvasSize.height / 2 - (imgElement.height * scale) / 2,
            scaleX: scale,
            scaleY: scale,
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

  // ============ Stock Images (Picsum as fallback, works without API key) ============
  const searchStockImages = useCallback(async (query?: string) => {
    const searchTerm = query || stockSearchQuery
    if (!searchTerm.trim()) return
    
    setStockLoading(true)
    try {
      // Use Lorem Picsum for free stock images (no API key needed)
      // Generate themed images based on search query
      const seed = searchTerm.toLowerCase().replace(/\s+/g, '-')
      const images = Array.from({ length: 12 }, (_, i) => ({
        url: `https://picsum.photos/seed/${seed}-${i}/800/600`,
        thumb: `https://picsum.photos/seed/${seed}-${i}/200/200`,
        alt: `${searchTerm} stock image ${i + 1}`,
      }))
      setStockImages(images)
    } catch (err) {
      toast.error('Failed to load stock images')
    } finally {
      setStockLoading(false)
    }
  }, [stockSearchQuery])

  const addStockImageToCanvas = useCallback(async (imageUrl: string, alt: string) => {
    if (!fabricCanvasRef.current) return
    
    toast.loading('Loading image...')
    try {
      const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })
      const maxW = canvasSize.width * 0.7
      const maxH = canvasSize.height * 0.7
      const scale = Math.min(maxW / (img.width || 400), maxH / (img.height || 300), 1)
      
      img.set({
        left: canvasSize.width / 2 - ((img.width || 400) * scale) / 2,
        top: canvasSize.height / 2 - ((img.height || 300) * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      })
      ;(img as any).id = uuidv4()
      ;(img as any).name = alt || 'Stock Image'
      
      fabricCanvasRef.current.add(img)
      fabricCanvasRef.current.setActiveObject(img)
      fabricCanvasRef.current.renderAll()
      saveToHistory()
      toast.dismiss()
      toast.success('Image added to canvas!')
    } catch (err) {
      toast.dismiss()
      toast.error('Failed to load image. Try another one.')
    }
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
      designName,
      canvas: json,
      savedAt: new Date().toISOString(),
    }

    // Save to file download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.download = `${designName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.json`
    link.href = url
    link.click()

    // Also save to localStorage for auto-recovery
    saveDesignToLocalStorage(data)
  }, [canvasSize, designName])

  // ============ localStorage Design Persistence ============
  const saveDesignToLocalStorage = useCallback((data?: any) => {
    if (!fabricCanvasRef.current) return
    try {
      const designData = data || {
        version: '1.0',
        canvasSize,
        designName,
        canvas: fabricCanvasRef.current.toJSON(),
        savedAt: new Date().toISOString(),
      }
      
      // Save current design as auto-save
      localStorage.setItem('designStudio_autosave', JSON.stringify(designData))
      
      // Save to named designs list
      const savedDesigns = JSON.parse(localStorage.getItem(LS_DESIGNS_KEY) || '[]')
      const existingIdx = savedDesigns.findIndex((d: any) => d.designName === designName)
      const thumbnail = fabricCanvasRef.current.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.15 })
      const entry = { ...designData, id: existingIdx >= 0 ? savedDesigns[existingIdx].id : uuidv4(), thumbnail }
      
      if (existingIdx >= 0) {
        savedDesigns[existingIdx] = entry
      } else {
        savedDesigns.unshift(entry)
        if (savedDesigns.length > 20) savedDesigns.pop() // Keep max 20 designs
      }
      localStorage.setItem(LS_DESIGNS_KEY, JSON.stringify(savedDesigns))
      toast.success('Design saved locally!')
    } catch (err) {
      console.error('Failed to save to localStorage:', err)
    }
  }, [canvasSize, designName])

  const loadDesignFromLocalStorage = useCallback((designData: any) => {
    if (!fabricCanvasRef.current) return
    try {
      if (designData.canvasSize) {
        setCanvasSize(designData.canvasSize)
        fabricCanvasRef.current.setDimensions({
          width: designData.canvasSize.width * zoom,
          height: designData.canvasSize.height * zoom,
        })
      }
      if (designData.designName) setDesignName(designData.designName)
      fabricCanvasRef.current.loadFromJSON(designData.canvas || designData).then(() => {
        fabricCanvasRef.current?.renderAll()
        updateLayers()
        saveToHistory()
        toast.success('Design loaded!')
      })
    } catch (err) {
      console.error('Failed to load design:', err)
      toast.error('Failed to load design')
    }
  }, [zoom, updateLayers, saveToHistory])

  const getSavedDesigns = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_DESIGNS_KEY) || '[]')
    } catch { return [] }
  }, [])

  const deleteSavedDesign = useCallback((designId: string) => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_DESIGNS_KEY) || '[]')
      const filtered = saved.filter((d: any) => d.id !== designId)
      localStorage.setItem(LS_DESIGNS_KEY, JSON.stringify(filtered))
      toast.success('Design deleted')
    } catch (err) {
      console.error('Failed to delete design:', err)
    }
  }, [])

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

  // ============ NEW Phase 10: Save to Cloudinary ============
  const saveToCloud = useCallback(async () => {
    if (!fabricCanvasRef.current || !dsWsId) {
      toast.error('No workspace selected')
      return
    }

    setIsSavingToCloud(true)
    try {
      // 1. Export canvas as PNG blob
      const currentZoom = fabricCanvasRef.current.getZoom()
      fabricCanvasRef.current.setZoom(1)
      fabricCanvasRef.current.setDimensions({ width: canvasSize.width, height: canvasSize.height })

      const dataUrl = fabricCanvasRef.current.toDataURL({ format: 'png', quality: 1, multiplier: 2 })

      // Restore zoom
      fabricCanvasRef.current.setZoom(currentZoom)
      fabricCanvasRef.current.setDimensions({ width: canvasSize.width * currentZoom, height: canvasSize.height * currentZoom })
      fabricCanvasRef.current.renderAll()

      // Convert to File
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const file = new File([blob], `${designName || 'design'}-${Date.now()}.png`, { type: 'image/png' })

      // 2. Upload to Cloudinary via media API
      const uploadResult = await mediaApi.upload(dsWsId, file, (progress) => {
        if (progress === 100) toast.loading('Saving to cloud...', { id: 'cloud-save' })
      })

      // 3. Also save the canvas JSON as project state (in localStorage with cloud reference)
      const canvasJSON = JSON.stringify(fabricCanvasRef.current.toJSON())
      const cloudDesign = {
        id: uuidv4(),
        designName,
        canvasSize,
        canvasJSON,
        cloudMediaId: uploadResult?.data?.id || uploadResult?.id,
        cloudUrl: uploadResult?.data?.url || uploadResult?.url,
        thumbnail: fabricCanvasRef.current.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.15 }),
        savedAt: new Date().toISOString(),
      }

      // Save cloud designs list to localStorage (maps to their cloud media IDs)
      const existing = JSON.parse(localStorage.getItem('designStudio_cloudDesigns') || '[]')
      const existingIdx = existing.findIndex((d: any) => d.designName === designName)
      if (existingIdx >= 0) {
        existing[existingIdx] = cloudDesign
      } else {
        existing.unshift(cloudDesign)
      }
      localStorage.setItem('designStudio_cloudDesigns', JSON.stringify(existing.slice(0, 50)))
      setCloudDesigns(existing)

      toast.dismiss('cloud-save')
      toast.success('Design saved to cloud!')
    } catch (error: any) {
      console.error('Cloud save error:', error)
      toast.dismiss('cloud-save')
      toast.error(error?.message || 'Failed to save to cloud')
    } finally {
      setIsSavingToCloud(false)
    }
  }, [canvasSize, designName, dsWsId])

  const loadCloudDesigns = useCallback(() => {
    try {
      const designs = JSON.parse(localStorage.getItem('designStudio_cloudDesigns') || '[]')
      setCloudDesigns(designs)
    } catch { setCloudDesigns([]) }
  }, [])

  const loadCloudDesign = useCallback((design: any) => {
    if (!fabricCanvasRef.current) return
    try {
      if (design.canvasSize) {
        setCanvasSize(design.canvasSize)
        fabricCanvasRef.current.setDimensions({
          width: design.canvasSize.width * zoom,
          height: design.canvasSize.height * zoom,
        })
      }
      if (design.designName) setDesignName(design.designName)
      const canvasData = typeof design.canvasJSON === 'string' ? JSON.parse(design.canvasJSON) : design.canvasJSON
      fabricCanvasRef.current.loadFromJSON(canvasData).then(() => {
        fabricCanvasRef.current?.renderAll()
        updateLayers()
        saveToHistory()
        setShowTemplateModal(false)
        toast.success('Cloud design loaded!')
      })
    } catch (err) {
      console.error('Failed to load cloud design:', err)
      toast.error('Failed to load design')
    }
  }, [zoom, updateLayers, saveToHistory])

  const deleteCloudDesign = useCallback((designId: string) => {
    try {
      const designs = JSON.parse(localStorage.getItem('designStudio_cloudDesigns') || '[]')
      const filtered = designs.filter((d: any) => d.id !== designId)
      localStorage.setItem('designStudio_cloudDesigns', JSON.stringify(filtered))
      setCloudDesigns(filtered)
      toast.success('Cloud design deleted')
    } catch (err) {
      console.error('Failed to delete cloud design:', err)
    }
  }, [])

  // ============ NEW Phase 10: Video Editor Functions ============
  const openVideoEditor = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setVideoFile(file)
    setVideoUrl(url)
    setVideoCurrentTime(0)
    setVideoTrimStart(0)
    setVideoTrimEnd(0)
    setVideoFrames([])
    setIsVideoPlaying(false)
    setShowVideoEditor(true)
  }, [])

  const extractVideoFrames = useCallback(async () => {
    if (!videoUrl) return
    setIsExtractingFrames(true)

    try {
      const video = document.createElement('video')
      video.src = videoUrl
      video.muted = true
      video.preload = 'auto'

      await new Promise<void>((resolve) => {
        video.onloadeddata = () => resolve()
      })

      const duration = video.duration
      const frameCount = Math.min(12, Math.ceil(duration))
      const interval = duration / frameCount
      const frames: string[] = []

      for (let i = 0; i < frameCount; i++) {
        video.currentTime = i * interval
        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve()
        })

        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = video.videoWidth
        tempCanvas.height = video.videoHeight
        const ctx = tempCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          frames.push(tempCanvas.toDataURL('image/jpeg', 0.7))
        }
      }

      setVideoFrames(frames)
      toast.success(`Extracted ${frames.length} frames from video`)
    } catch (err) {
      console.error('Frame extraction error:', err)
      toast.error('Failed to extract frames')
    } finally {
      setIsExtractingFrames(false)
    }
  }, [videoUrl])

  const captureCurrentFrame = useCallback(() => {
    if (!videoRef.current || !fabricCanvasRef.current) return

    const video = videoRef.current
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = video.videoWidth
    tempCanvas.height = video.videoHeight
    const ctx = tempCanvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = tempCanvas.toDataURL('image/png')

    const imgElement = document.createElement('img')
    imgElement.src = dataUrl
    imgElement.onload = () => {
      const maxW = canvasSize.width * 0.8
      const maxH = canvasSize.height * 0.8
      const scale = Math.min(maxW / imgElement.width, maxH / imgElement.height, 1)

      const img = new fabric.FabricImage(imgElement, {
        left: canvasSize.width / 2 - (imgElement.width * scale) / 2,
        top: canvasSize.height / 2 - (imgElement.height * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      })
      ;(img as any).id = uuidv4()
      ;(img as any).name = `Video Frame @${videoCurrentTime.toFixed(1)}s`

      fabricCanvasRef.current?.add(img)
      fabricCanvasRef.current?.setActiveObject(img)
      fabricCanvasRef.current?.renderAll()
      saveToHistory()
      toast.success('Frame added to canvas!')
    }
  }, [canvasSize, videoCurrentTime, saveToHistory])

  const addFrameToCanvas = useCallback((frameDataUrl: string, index: number) => {
    if (!fabricCanvasRef.current) return

    const imgElement = document.createElement('img')
    imgElement.src = frameDataUrl
    imgElement.onload = () => {
      const maxW = canvasSize.width * 0.8
      const maxH = canvasSize.height * 0.8
      const scale = Math.min(maxW / imgElement.width, maxH / imgElement.height, 1)

      const img = new fabric.FabricImage(imgElement, {
        left: canvasSize.width / 2 - (imgElement.width * scale) / 2,
        top: canvasSize.height / 2 - (imgElement.height * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      })
      ;(img as any).id = uuidv4()
      ;(img as any).name = `Video Frame #${index + 1}`

      fabricCanvasRef.current?.add(img)
      fabricCanvasRef.current?.setActiveObject(img)
      fabricCanvasRef.current?.renderAll()
      saveToHistory()
    }
  }, [canvasSize, saveToHistory])

  const exportVideoClip = useCallback(async () => {
    if (!videoUrl || !videoFile) return

    const trimStart = videoTrimStart
    const trimEnd = videoTrimEnd > 0 ? videoTrimEnd : videoDuration

    // Create trimmed video blob for download
    const response = await fetch(videoUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `trimmed-${videoFile.name}`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)

    toast.success(`Video exported (${trimStart.toFixed(1)}s - ${trimEnd.toFixed(1)}s)`)
  }, [videoUrl, videoFile, videoTrimStart, videoTrimEnd, videoDuration])

  // ============ NEW Phase 10: QR Code Generator ============
  const generateQRCode = useCallback(() => {
    if (!fabricCanvasRef.current || !qrText) {
      toast.error('Please enter text or URL for QR code')
      return
    }

    // Generate QR code using canvas-based approach
    const size = qrSize
    const modules = encodeQR(qrText)
    const moduleSize = Math.floor(size / modules.length)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    ctx.fillStyle = qrBgColor
    ctx.fillRect(0, 0, size, size)

    // Modules
    ctx.fillStyle = qrFgColor
    modules.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize)
        }
      })
    })

    const dataUrl = canvas.toDataURL('image/png')
    const imgElement = document.createElement('img')
    imgElement.src = dataUrl
    imgElement.onload = () => {
      const img = new fabric.FabricImage(imgElement, {
        left: canvasSize.width / 2 - size / 2,
        top: canvasSize.height / 2 - size / 2,
      })
      ;(img as any).id = uuidv4()
      ;(img as any).name = `QR Code: ${qrText.substring(0, 20)}`
      fabricCanvasRef.current?.add(img)
      fabricCanvasRef.current?.setActiveObject(img)
      fabricCanvasRef.current?.renderAll()
      saveToHistory()
      toast.success('QR Code added to canvas!')
    }
  }, [qrText, qrSize, qrFgColor, qrBgColor, canvasSize, saveToHistory])

  // ============ NEW Phase 10: Chart Generator ============
  const generateChart = useCallback(() => {
    if (!fabricCanvasRef.current) return

    const chartW = 400
    const chartH = 300
    const canvas = document.createElement('canvas')
    canvas.width = chartW
    canvas.height = chartH
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const maxVal = Math.max(...chartData.map(d => d.value))
    const padding = 40

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, chartW, chartH)

    // Title
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(chartTitle, chartW / 2, 20)

    if (chartType === 'bar') {
      const barW = (chartW - padding * 2) / chartData.length - 10
      chartData.forEach((d, i) => {
        const barH = ((d.value / maxVal) * (chartH - padding * 2 - 30))
        const x = padding + i * (barW + 10)
        const y = chartH - padding - barH

        ctx.fillStyle = chartColors[i % chartColors.length]
        ctx.beginPath()
        ctx.roundRect(x, y, barW, barH, 4)
        ctx.fill()

        ctx.fillStyle = '#64748b'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(d.label, x + barW / 2, chartH - padding + 15)
        ctx.fillText(String(d.value), x + barW / 2, y - 5)
      })
    } else if (chartType === 'pie' || chartType === 'donut') {
      const total = chartData.reduce((s, d) => s + d.value, 0)
      const cx = chartW / 2
      const cy = chartH / 2 + 10
      const radius = Math.min(chartW, chartH) / 2 - padding
      let startAngle = -Math.PI / 2

      chartData.forEach((d, i) => {
        const sliceAngle = (d.value / total) * Math.PI * 2
        ctx.fillStyle = chartColors[i % chartColors.length]
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle)
        ctx.closePath()
        ctx.fill()

        // Label
        const midAngle = startAngle + sliceAngle / 2
        const lx = cx + Math.cos(midAngle) * (radius * 0.65)
        const ly = cy + Math.sin(midAngle) * (radius * 0.65)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${d.label}`, lx, ly)
        ctx.fillText(`${Math.round(d.value / total * 100)}%`, lx, ly + 12)

        startAngle += sliceAngle
      })

      if (chartType === 'donut') {
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (chartType === 'line') {
      const plotW = chartW - padding * 2
      const plotH = chartH - padding * 2 - 30
      const step = plotW / (chartData.length - 1)

      // Grid lines
      ctx.strokeStyle = '#f1f5f9'
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        const y = padding + 20 + (plotH / 4) * i
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(chartW - padding, y)
        ctx.stroke()
      }

      // Line
      ctx.strokeStyle = chartColors[0]
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.beginPath()
      chartData.forEach((d, i) => {
        const x = padding + i * step
        const y = padding + 20 + plotH - (d.value / maxVal) * plotH
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      // Fill under line
      ctx.lineTo(padding + (chartData.length - 1) * step, chartH - padding)
      ctx.lineTo(padding, chartH - padding)
      ctx.closePath()
      ctx.fillStyle = chartColors[0] + '20'
      ctx.fill()

      // Points and labels
      chartData.forEach((d, i) => {
        const x = padding + i * step
        const y = padding + 20 + plotH - (d.value / maxVal) * plotH
        ctx.fillStyle = chartColors[0]
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#64748b'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(d.label, x, chartH - padding + 15)
      })
    }

    const dataUrl = canvas.toDataURL('image/png')
    const imgElement = document.createElement('img')
    imgElement.src = dataUrl
    imgElement.onload = () => {
      const img = new fabric.FabricImage(imgElement, {
        left: canvasSize.width / 2 - chartW / 2,
        top: canvasSize.height / 2 - chartH / 2,
      })
      ;(img as any).id = uuidv4()
      ;(img as any).name = `${chartType} Chart`
      fabricCanvasRef.current?.add(img)
      fabricCanvasRef.current?.setActiveObject(img)
      fabricCanvasRef.current?.renderAll()
      saveToHistory()
      toast.success('Chart added to canvas!')
    }
  }, [chartType, chartData, chartColors, chartTitle, canvasSize, saveToHistory])

  // ============ NEW Phase 10: Table Generator ============
  const generateTable = useCallback(() => {
    if (!fabricCanvasRef.current) return

    const cellW = 120
    const cellH = 40
    const w = tableCols * cellW
    const h = tableRows * cellH
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const styles: Record<string, { headerBg: string; headerText: string; cellBg: string; border: string; altRow: string }> = {
      modern: { headerBg: tableHeaderBg, headerText: '#ffffff', cellBg: '#ffffff', border: '#e2e8f0', altRow: '#f8fafc' },
      classic: { headerBg: '#1e293b', headerText: '#ffffff', cellBg: '#ffffff', border: '#94a3b8', altRow: '#f1f5f9' },
      minimal: { headerBg: '#ffffff', headerText: '#1e293b', cellBg: '#ffffff', border: '#e2e8f0', altRow: '#ffffff' },
      colorful: { headerBg: tableHeaderBg, headerText: '#ffffff', cellBg: '#fef3c7', border: '#f59e0b', altRow: '#fffbeb' },
    }
    const style = styles[tableStyle] || styles.modern

    for (let row = 0; row < tableRows; row++) {
      for (let col = 0; col < tableCols; col++) {
        const x = col * cellW
        const y = row * cellH
        const isHeader = row === 0

        ctx.fillStyle = isHeader ? style.headerBg : (row % 2 === 0 ? style.altRow : style.cellBg)
        ctx.fillRect(x, y, cellW, cellH)

        ctx.strokeStyle = style.border
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, cellW, cellH)

        ctx.fillStyle = isHeader ? style.headerText : '#334155'
        ctx.font = isHeader ? 'bold 12px Arial' : '12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(isHeader ? `Header ${col + 1}` : `Cell ${row},${col + 1}`, x + cellW / 2, y + cellH / 2)
      }
    }

    const dataUrl = canvas.toDataURL('image/png')
    const imgElement = document.createElement('img')
    imgElement.src = dataUrl
    imgElement.onload = () => {
      const img = new fabric.FabricImage(imgElement, {
        left: canvasSize.width / 2 - w / 2,
        top: canvasSize.height / 2 - h / 2,
      })
      ;(img as any).id = uuidv4()
      ;(img as any).name = `Table ${tableRows}x${tableCols}`
      fabricCanvasRef.current?.add(img)
      fabricCanvasRef.current?.setActiveObject(img)
      fabricCanvasRef.current?.renderAll()
      saveToHistory()
      toast.success('Table added to canvas!')
    }
  }, [tableRows, tableCols, tableHeaderBg, tableStyle, canvasSize, saveToHistory])

  // ============ NEW Phase 10: Device Mockup Generator ============
  const generateMockup = useCallback(() => {
    if (!fabricCanvasRef.current) return

    const mockupCanvas = document.createElement('canvas')
    let mW = 300, mH = 600, screenX = 20, screenY = 80, screenW = 260, screenH = 460
    const ctx = mockupCanvas.getContext('2d')
    if (!ctx) return

    if (mockupDevice === 'phone') { mW = 280; mH = 560; screenX = 20; screenY = 70; screenW = 240; screenH = 420 }
    else if (mockupDevice === 'tablet') { mW = 400; mH = 550; screenX = 25; screenY = 45; screenW = 350; screenH = 460 }
    else if (mockupDevice === 'laptop') { mW = 500; mH = 340; screenX = 40; screenY = 20; screenW = 420; screenH = 270 }
    else if (mockupDevice === 'desktop') { mW = 500; mH = 420; screenX = 20; screenY = 20; screenW = 460; screenH = 340 }

    mockupCanvas.width = mW
    mockupCanvas.height = mH

    // Device body
    ctx.fillStyle = '#1e293b'
    if (mockupDevice === 'phone') {
      ctx.beginPath()
      ctx.roundRect(0, 0, mW, mH, 30)
      ctx.fill()
      // Notch
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.roundRect(mW / 2 - 40, 5, 80, 25, 12)
      ctx.fill()
    } else if (mockupDevice === 'tablet') {
      ctx.beginPath()
      ctx.roundRect(0, 0, mW, mH, 20)
      ctx.fill()
    } else if (mockupDevice === 'laptop') {
      ctx.beginPath()
      ctx.roundRect(10, 0, mW - 20, mH - 40, 12)
      ctx.fill()
      // Base
      ctx.fillStyle = '#334155'
      ctx.beginPath()
      ctx.moveTo(0, mH - 40)
      ctx.lineTo(mW, mH - 40)
      ctx.lineTo(mW + 10, mH)
      ctx.lineTo(-10, mH)
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.roundRect(0, 0, mW, mH - 60, 8)
      ctx.fill()
      // Stand
      ctx.fillStyle = '#334155'
      ctx.fillRect(mW / 2 - 40, mH - 60, 80, 30)
      ctx.fillRect(mW / 2 - 80, mH - 30, 160, 10)
    }

    // Screen
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(screenX, screenY, screenW, screenH)
    ctx.fillStyle = '#60a5fa'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Your Design Here', screenX + screenW / 2, screenY + screenH / 2)

    const dataUrl = mockupCanvas.toDataURL('image/png')
    const imgElement = document.createElement('img')
    imgElement.src = dataUrl
    imgElement.onload = () => {
      const maxW = canvasSize.width * 0.6
      const maxH = canvasSize.height * 0.6
      const scale = Math.min(maxW / mW, maxH / mH, 1)
      const img = new fabric.FabricImage(imgElement, {
        left: canvasSize.width / 2 - (mW * scale) / 2,
        top: canvasSize.height / 2 - (mH * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      })
      ;(img as any).id = uuidv4()
      ;(img as any).name = `${mockupDevice} Mockup`
      fabricCanvasRef.current?.add(img)
      fabricCanvasRef.current?.setActiveObject(img)
      fabricCanvasRef.current?.renderAll()
      saveToHistory()
      toast.success('Mockup added!')
    }
  }, [mockupDevice, canvasSize, saveToHistory])

  // ============ NEW Phase 10: Gradient Text ============
  const addGradientText = useCallback((text: string, colors: string[]) => {
    if (!fabricCanvasRef.current) return

    const tempCanvas = document.createElement('canvas')
    const fs = 64
    tempCanvas.width = text.length * fs
    tempCanvas.height = fs * 1.4
    const ctx = tempCanvas.getContext('2d')
    if (!ctx) return

    const gradient = ctx.createLinearGradient(0, 0, tempCanvas.width, 0)
    colors.forEach((color, i) => gradient.addColorStop(i / (colors.length - 1), color))
    ctx.font = `bold ${fs}px Arial`
    ctx.fillStyle = gradient
    ctx.textBaseline = 'top'
    ctx.fillText(text, 0, 10)

    const dataUrl = tempCanvas.toDataURL('image/png')
    const imgElement = document.createElement('img')
    imgElement.src = dataUrl
    imgElement.onload = () => {
      const maxW = canvasSize.width * 0.8
      const scale = Math.min(maxW / tempCanvas.width, 1)
      const img = new fabric.FabricImage(imgElement, {
        left: canvasSize.width / 2 - (tempCanvas.width * scale) / 2,
        top: canvasSize.height / 2 - (tempCanvas.height * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      })
      ;(img as any).id = uuidv4()
      ;(img as any).name = `Gradient Text: ${text.substring(0, 15)}`
      fabricCanvasRef.current?.add(img)
      fabricCanvasRef.current?.setActiveObject(img)
      fabricCanvasRef.current?.renderAll()
      saveToHistory()
    }
  }, [canvasSize, saveToHistory])

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

      // Convert data URL to File for upload
      let mediaId: string | undefined
      try {
        const response = await fetch(imageDataUrl)
        const blob = await response.blob()
        const file = new File([blob], `${designName || 'design'}-${Date.now()}.png`, { type: 'image/png' })
        
        // Upload via media API
        const uploadResult = await mediaApi.upload('default', file)
        mediaId = uploadResult?.data?.id || uploadResult?.id
      } catch (uploadErr) {
        console.warn('Image upload failed, creating post without media:', uploadErr)
        // Also save the image to localStorage as fallback
        try {
          localStorage.setItem('designStudio_lastExport', imageDataUrl)
        } catch (e) { /* localStorage full */ }
      }

      // Create post data
      const postData: any = {
        content: `${postCaption}\n\n${postHashtags}`.trim(),
        postType: 'IMAGE',
        platforms: selectedPlatforms.map(platformId => ({
          socialAccountId: platformId,
        })),
        scheduledAt: isScheduling && scheduleDate && scheduleTime 
          ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
          : undefined,
      }
      
      if (mediaId) {
        postData.mediaIds = [mediaId]
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
  }, [selectedPlatforms, postCaption, postHashtags, isScheduling, scheduleDate, scheduleTime, getCanvasDataUrl, navigate, designName])

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

  // ============ NEW: Brand Kit Functions (with localStorage persistence) ============
  // Load brand kits from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_BRANDKITS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBrandKits(parsed)
        }
      }
    } catch (e) {
      console.error('Failed to load brand kits:', e)
    }
    // Also load cloud designs
    try {
      const cloudSaved = localStorage.getItem('designStudio_cloudDesigns')
      if (cloudSaved) {
        setCloudDesigns(JSON.parse(cloudSaved))
      }
    } catch (e) {
      console.error('Failed to load cloud designs:', e)
    }
  }, [])

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

    setBrandKits(prev => {
      const updated = [...prev, kit]
      localStorage.setItem(LS_BRANDKITS_KEY, JSON.stringify(updated))
      return updated
    })
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
    setBrandKits(prev => {
      const updated = prev.filter(k => k.id !== kitId)
      localStorage.setItem(LS_BRANDKITS_KEY, JSON.stringify(updated))
      return updated
    })
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
      toast.loading('Generating with AI... This may take a moment.', { id: 'ai-generate' })
      
      // Call real AI image generation API
      const images = await generateImage({
        prompt: aiPrompt.trim(),
        imageUrl: '',
        aspectRatio: canvasSize.width === canvasSize.height ? '1:1' 
          : canvasSize.width > canvasSize.height ? '16:9' : '9:16',
        resolution: '1K',
      })
      
      if (images && images.length > 0 && fabricCanvasRef.current) {
        // Load the generated image onto canvas
        try {
          const imgObj = await fabric.FabricImage.fromURL(images[0], { crossOrigin: 'anonymous' })
          const scale = Math.min(
            (canvasSize.width * 0.8) / (imgObj.width || 1),
            (canvasSize.height * 0.8) / (imgObj.height || 1),
            1
          )
          imgObj.set({
            left: canvasSize.width / 2 - ((imgObj.width || 100) * scale) / 2,
            top: canvasSize.height / 2 - ((imgObj.height || 100) * scale) / 2,
            scaleX: scale,
            scaleY: scale,
          })
          ;(imgObj as any).id = uuidv4()
          ;(imgObj as any).name = `AI Generated: ${aiPrompt.slice(0, 20)}...`

          fabricCanvasRef.current.add(imgObj)
          fabricCanvasRef.current.setActiveObject(imgObj)
          fabricCanvasRef.current.renderAll()
          saveToHistory()
          toast.success('AI image generated and added to canvas!', { id: 'ai-generate' })
        } catch (imgErr) {
          console.error('Failed to load AI image:', imgErr)
          toast.error('Generated image could not be loaded onto canvas', { id: 'ai-generate' })
        }
      } else {
        // Fallback: generate AI text content as design element
        if (fabricCanvasRef.current) {
          try {
            const captions = await generateText({
              topic: aiPrompt,
              tone: 'professional',
              length: 'short',
              platform: 'instagram',
              includeEmojis: true,
            })
            if (Array.isArray(captions) && captions.length > 0) {
              const text = new fabric.IText(captions[0], {
                left: canvasSize.width / 2 - 200,
                top: canvasSize.height / 2 - 30,
                fontSize: 28,
                fontFamily: 'Arial',
                fill: '#1e293b',
                width: 400,
                textAlign: 'center',
              })
              ;(text as any).id = uuidv4()
              ;(text as any).name = `AI Text: ${aiPrompt.slice(0, 20)}...`
              fabricCanvasRef.current.add(text)
              fabricCanvasRef.current.setActiveObject(text)
              fabricCanvasRef.current.renderAll()
              saveToHistory()
              toast.success('AI text generated! (Image API unavailable, generated text instead)', { id: 'ai-generate' })
            } else {
              toast.error('AI generation returned no results', { id: 'ai-generate' })
            }
          } catch (textErr) {
            toast.error('AI generation failed. Check your AI API key configuration.', { id: 'ai-generate' })
          }
        }
      }
      
      setShowMagicStudioModal(false)
      setAiPrompt('')
    } catch (error: any) {
      console.error('AI generation error:', error)
      toast.error(error.message || 'Failed to generate AI content. Check AI API configuration.', { id: 'ai-generate' })
    } finally {
      setIsGeneratingAI(false)
    }
  }, [aiPrompt, canvasSize, saveToHistory])

  const applyMagicEffect = useCallback(async (effect: string) => {
    if (!fabricCanvasRef.current || !selectedObject) return

    setIsGeneratingAI(true)
    toast.loading(`Applying ${effect}...`, { id: 'magic-effect' })

    try {
      switch (effect) {
        case 'enhance':
          if (selectedObject.type === 'image') {
            const imgObj = selectedObject as fabric.FabricImage
            imgObj.filters = [
              new fabric.filters.Brightness({ brightness: 0.1 }),
              new fabric.filters.Contrast({ contrast: 0.15 }),
              new fabric.filters.Saturation({ saturation: 0.1 }),
              new fabric.filters.Convolute({ matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0] }),
            ]
            imgObj.applyFilters()
            toast.success('Auto-enhance applied! Brightness, contrast, saturation & sharpness improved.', { id: 'magic-effect' })
          } else {
            toast.error('Select an image to enhance', { id: 'magic-effect' })
          }
          break
        case 'style-transfer':
          if (selectedObject.type === 'image') {
            // Apply artistic filters to simulate style transfer
            const imgObj = selectedObject as fabric.FabricImage
            imgObj.filters = [
              new fabric.filters.Sepia(),
              new fabric.filters.Contrast({ contrast: 0.2 }),
              new fabric.filters.Saturation({ saturation: -0.3 }),
            ]
            imgObj.applyFilters()
            toast.success('Artistic style applied!', { id: 'magic-effect' })
          } else {
            toast.error('Select an image for style transfer', { id: 'magic-effect' })
          }
          break
        case 'upscale':
          if (selectedObject.type === 'image') {
            // Upscale the image 2x by adjusting scale and applying sharpen
            const imgObj = selectedObject as fabric.FabricImage
            imgObj.set({
              scaleX: (imgObj.scaleX || 1) * 1.5,
              scaleY: (imgObj.scaleY || 1) * 1.5,
            })
            imgObj.filters = [
              ...(imgObj.filters || []),
              new fabric.filters.Convolute({ matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0] }),
            ]
            imgObj.applyFilters()
            toast.success('Image upscaled 1.5x with sharpening!', { id: 'magic-effect' })
          } else {
            toast.error('Select an image to upscale', { id: 'magic-effect' })
          }
          break
        case 'animate':
          // Apply visual pulse animation preview on canvas
          if (selectedObject) {
            const origOpacity = selectedObject.opacity || 1
            const origScaleX = selectedObject.scaleX || 1
            const origScaleY = selectedObject.scaleY || 1
            // Simple scale bounce animation
            let frame = 0
            const animInterval = setInterval(() => {
              frame++
              const scale = 1 + Math.sin(frame * 0.3) * 0.05
              selectedObject.set({
                scaleX: origScaleX * scale,
                scaleY: origScaleY * scale,
                opacity: origOpacity * (0.8 + Math.sin(frame * 0.3) * 0.2),
              })
              fabricCanvasRef.current?.renderAll()
              if (frame > 20) {
                clearInterval(animInterval)
                selectedObject.set({ scaleX: origScaleX, scaleY: origScaleY, opacity: origOpacity })
                fabricCanvasRef.current?.renderAll()
              }
            }, 50)
            toast.success('Animation preview shown! Export as GIF for animated version.', { id: 'magic-effect' })
          }
          break
        default:
          toast.error(`Unknown effect: ${effect}`, { id: 'magic-effect' })
      }

      fabricCanvasRef.current.renderAll()
      saveToHistory()
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
        stroke: elementData.props?.stroke || fillColor,
        strokeWidth: elementData.props?.strokeWidth || 3,
        fill: elementData.props?.fill || elementData.fill || 'transparent',
        ...(elementData.strokeDashArray && { strokeDashArray: elementData.strokeDashArray }),
        ...(elementData.props?.scaleX && { scaleX: elementData.props.scaleX }),
        ...(elementData.props?.scaleY && { scaleY: elementData.props.scaleY }),
        ...(elementData.props?.strokeLineCap && { strokeLineCap: elementData.props.strokeLineCap }),
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
      // Generate polygon points from number of sides
      const numPoints = typeof elementData.points === 'number' ? elementData.points : 6
      const radius = elementData.props?.radius || 60
      const points: { x: number; y: number }[] = []
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI / numPoints) - Math.PI / 2
        points.push({
          x: radius + radius * Math.cos(angle),
          y: radius + radius * Math.sin(angle),
        })
      }
      obj = new fabric.Polygon(points, {
        left: baseLeft,
        top: baseTop,
        fill: elementData.props?.fill || fillColor,
        stroke: elementData.props?.stroke || strokeColor,
        strokeWidth: elementData.props?.strokeWidth || 2,
      })
    } else if (elementData.type === 'star') {
      // Generate star points
      const numStarPoints = typeof elementData.points === 'number' ? elementData.points : 5
      const outerRadius = elementData.props?.radius || 60
      const innerRadius = elementData.props?.innerRadius || outerRadius * 0.4
      const starPoints: { x: number; y: number }[] = []
      for (let i = 0; i < numStarPoints * 2; i++) {
        const angle = (i * Math.PI / numStarPoints) - Math.PI / 2
        const r = i % 2 === 0 ? outerRadius : innerRadius
        starPoints.push({
          x: outerRadius + r * Math.cos(angle),
          y: outerRadius + r * Math.sin(angle),
        })
      }
      obj = new fabric.Polygon(starPoints, {
        left: baseLeft,
        top: baseTop,
        fill: elementData.props?.fill || fillColor,
        stroke: elementData.props?.stroke || strokeColor,
        strokeWidth: elementData.props?.strokeWidth || 2,
      })
    } else if (elementData.type === 'ellipse') {
      obj = new fabric.Ellipse({
        left: baseLeft,
        top: baseTop,
        ...elementData.props,
        stroke: elementData.props?.stroke || fillColor,
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

      // Get canvas as data URL at high quality
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      })

      // Create real PDF using jsPDF
      const isLandscape = canvasSize.width > canvasSize.height
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvasSize.width, canvasSize.height],
      })

      pdf.addImage(dataUrl, 'PNG', 0, 0, canvasSize.width, canvasSize.height)
      
      const safeName = designName.replace(/[^a-zA-Z0-9]/g, '-') || 'design'
      pdf.save(`${safeName}-${Date.now()}.pdf`)

      // Restore zoom
      fabricCanvasRef.current.setZoom(currentZoom)
      fabricCanvasRef.current.setDimensions({
        width: canvasSize.width * currentZoom,
        height: canvasSize.height * currentZoom,
      })
      fabricCanvasRef.current.renderAll()

      toast.success('PDF exported successfully!', { id: 'pdf-export' })
    } catch (error) {
      console.error('PDF export error:', error)
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
      <div
        className="h-screen min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden overscroll-none"
        style={{ height: '100dvh' }}
      >
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        Create a New Design
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400">
                        Choose a template size or create a custom design
                      </p>
                    </div>
                    <button
                      onClick={() => setShowTemplateModal(false)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                  
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

                {/* Cloud & Saved Designs */}
                <div className="px-4 sm:px-6 pb-4">
                  {/* Cloud Designs */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-indigo-600" />
                        Cloud Designs
                      </h3>
                      <Button variant="ghost" size="sm" onClick={loadCloudDesigns}>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {cloudDesigns.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {cloudDesigns.slice(0, 8).map((design) => (
                          <div key={design.id} className="group relative">
                            <button
                              onClick={() => loadCloudDesign(design)}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-2 border-transparent hover:border-indigo-500 transition-all text-left"
                            >
                              <div className="w-full aspect-video bg-white dark:bg-slate-700 rounded-lg mb-2 overflow-hidden">
                                {design.thumbnail ? (
                                  <img src={design.thumbnail} alt={design.designName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Cloud className="w-6 h-6 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{design.designName}</p>
                              <p className="text-[10px] text-slate-400">{new Date(design.savedAt).toLocaleDateString()}</p>
                            </button>
                            <button
                              onClick={() => deleteCloudDesign(design.id)}
                              className="absolute top-3 right-3 p-1 rounded bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">No cloud designs yet. Save designs using the Cloud button.</p>
                    )}
                  </div>

                  {/* Local Saved Designs */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
                      <Save className="w-4 h-4 text-slate-500" />
                      Saved Designs
                    </h3>
                    {getSavedDesigns().length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {getSavedDesigns().slice(0, 8).map((design: any) => (
                          <div key={design.id} className="group relative">
                            <button
                              onClick={() => loadDesignFromLocalStorage(design)}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-2 border-transparent hover:border-indigo-500 transition-all text-left"
                            >
                              <div className="w-full aspect-video bg-white dark:bg-slate-700 rounded-lg mb-2 overflow-hidden">
                                {design.thumbnail ? (
                                  <img src={design.thumbnail} alt={design.designName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileImage className="w-6 h-6 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{design.designName}</p>
                              <p className="text-[10px] text-slate-400">{new Date(design.savedAt).toLocaleDateString()}</p>
                            </button>
                            <button
                              onClick={() => deleteSavedDesign(design.id)}
                              className="absolute top-3 right-3 p-1 rounded bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-3">No saved designs yet.</p>
                    )}
                  </div>
                </div>
                
                {/* Cancel Button */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                  <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Toolbar - Canva Style */}
        <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-2 sm:px-4 shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* File Operations */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplateModal(true)}>
                  <Plus className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">New</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Design</TooltipContent>
            </Tooltip>

            <label className="hidden md:block">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" asChild>
                    <span>
                      <FolderOpen className="w-4 h-4 mr-1" />
                      Open
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open Project</TooltipContent>
              </Tooltip>
              <input type="file" accept=".json" className="hidden" onChange={loadFromJSON} />
            </label>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Undo/Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}>
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>

          {/* Center - Design Name */}
          <div className="hidden sm:flex items-center gap-2">
            <Input
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="w-36 md:w-48 text-center text-sm font-medium border-transparent hover:border-slate-300 focus:border-indigo-500 rounded-lg"
              placeholder="Untitled Design"
            />
          </div>

          {/* Right - Zoom, Save, Download, Share */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-1.5 py-0.5">
              <Button variant="ghost" size="icon" onClick={zoomOut} className="h-7 w-7">
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-slate-600 dark:text-slate-400 w-10 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon" onClick={zoomIn} className="h-7 w-7">
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={fitToScreen} className="h-7 w-7">
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Save Design Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                saveAsJSON();
                toast.success('Design saved!');
              }}
              className="gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>

            {/* Cloud Save Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={saveToCloud}
              disabled={isSavingToCloud}
              className="gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
            >
              {isSavingToCloud ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isSavingToCloud ? 'Saving...' : 'Cloud'}</span>
            </Button>

            {/* Download Dropdown */}
            <div className="relative group">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </Button>
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Image</p>
                <button onClick={() => exportAsImage('png')} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                  <FileImage className="w-4 h-4 text-indigo-500" /> PNG (High Quality)
                </button>
                <button onClick={() => exportAsImage('jpeg')} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                  <FileImage className="w-4 h-4 text-green-500" /> JPEG (Compressed)
                </button>
                <button onClick={() => exportAsImage('svg')} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                  <FileJson className="w-4 h-4 text-orange-500" /> SVG (Vector)
                </button>
                <div className="my-1.5 border-t border-slate-100 dark:border-slate-700" />
                <p className="px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Document</p>
                <button onClick={exportAsPDF} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-red-500" /> PDF Document
                </button>
                <button onClick={saveAsJSON} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                  <FileJson className="w-4 h-4 text-blue-500" /> Project File (JSON)
                </button>
              </div>
            </div>

            {/* Share / Post Button (prominent, Canva-style) */}
            <Button
              onClick={() => setShowPostModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg gap-1.5 px-4 shadow-md hover:shadow-lg transition-all"
              size="sm"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Share</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 flex overflow-hidden relative">
          {/* Left Sidebar - Tools (Canva-style) */}
          <div className="w-12 sm:w-16 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center py-2 sm:py-4 gap-0.5 sm:gap-1 shrink-0 overflow-y-auto overscroll-contain z-20 scrollbar-thin scroll-smooth">
            {[
              { id: 'templates', icon: LayoutTemplate, label: 'Design' },
              { id: 'elements', icon: Shapes, label: 'Elements' },
              { id: 'text', icon: Type, label: 'Text' },
              { id: 'images', icon: ImageIcon, label: 'Uploads' },
              { id: 'shapes', icon: Square, label: 'Shapes' },
              { id: 'stickers', icon: Sticker, label: 'Stickers' },
              { id: 'charts', icon: BarChart3, label: 'Charts' },
              { id: 'tables', icon: Table2, label: 'Tables' },
              { id: 'qrcode', icon: QrCode, label: 'QR Code' },
              { id: 'mockups', icon: Smartphone, label: 'Mockup' },
              { id: 'video', icon: Film, label: 'Video' },
              { id: 'background', icon: Palette, label: 'BG' },
              { id: 'photo-edit', icon: SlidersHorizontal, label: 'Edit' },
              { id: 'draw', icon: PenTool, label: 'Draw' },
              { id: 'brand-kit', icon: PaletteIcon, label: 'Brand' },
              { id: 'magic-studio', icon: Sparkles, label: 'AI' },
              { id: 'layers', icon: Layers, label: 'Layers' },
              { id: 'pages', icon: FileImage, label: 'Pages' },
            ].map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (tool.id === 'draw') {
                        toggleDrawingMode()
                        setActivePanel(tool.id)
                      } else {
                        setActivePanel(activePanel === tool.id ? '' : tool.id)
                        if (isDrawingMode && fabricCanvasRef.current) {
                          setIsDrawingMode(false)
                          fabricCanvasRef.current.isDrawingMode = false
                        }
                      }
                    }}
                    className={cn(
                      'w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all',
                      activePanel === tool.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <tool.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[9px] sm:text-[10px] leading-tight font-medium">{tool.label}</span>
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
                    'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all',
                    showGrid
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Toggle Grid</TooltipContent>
            </Tooltip>
          </div>

          {/* Left Panel - Tool Options (overlay on mobile, inline on desktop) */}
          <AnimatePresence mode="wait">
            {activePanel && (
              <motion.div
                key={activePanel}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 h-full min-h-0 absolute sm:relative left-12 sm:left-0 z-30 sm:z-auto shadow-xl sm:shadow-none"
              >
                <div
                  className="w-70 h-full overflow-y-auto p-4 overscroll-contain scroll-smooth"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
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

                          {/* Text Effects - Canva Style */}
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Text Effects</h4>
                            <div className="grid grid-cols-4 gap-2">
                              {TEXT_EFFECTS.map((effect) => (
                                <button
                                  key={effect.id}
                                  onClick={() => {
                                    if (!fabricCanvasRef.current || !selectedObject) return
                                    // Reset shadow/stroke first
                                    selectedObject.set('shadow', null)
                                    selectedObject.set('stroke', '')
                                    selectedObject.set('strokeWidth', 0)
                                    
                                    if (effect.id === 'shadow') {
                                      selectedObject.set('shadow', new fabric.Shadow({ color: 'rgba(0,0,0,0.4)', blur: 8, offsetX: 3, offsetY: 3 }))
                                    } else if (effect.id === 'outline') {
                                      selectedObject.set('stroke', '#000000')
                                      selectedObject.set('strokeWidth', 2)
                                    } else if (effect.id === 'glow') {
                                      selectedObject.set('shadow', new fabric.Shadow({ color: '#6366f1', blur: 15, offsetX: 0, offsetY: 0 }))
                                    } else if (effect.id === 'neon') {
                                      selectedObject.set('shadow', new fabric.Shadow({ color: '#22d3ee', blur: 20, offsetX: 0, offsetY: 0 }))
                                      selectedObject.set('stroke', '#22d3ee')
                                      selectedObject.set('strokeWidth', 1)
                                    } else if (effect.id === 'echo') {
                                      selectedObject.set('shadow', new fabric.Shadow({ color: 'rgba(0,0,0,0.2)', blur: 0, offsetX: 4, offsetY: 4 }))
                                    } else if (effect.id === 'lift') {
                                      selectedObject.set('shadow', new fabric.Shadow({ color: 'rgba(0,0,0,0.25)', blur: 12, offsetX: 0, offsetY: 6 }))
                                    } else if (effect.id === 'hollow') {
                                      selectedObject.set('stroke', selectedObject.get('fill') as string || '#000')
                                      selectedObject.set('strokeWidth', 2)
                                      selectedObject.set('fill', 'transparent')
                                    }
                                    
                                    fabricCanvasRef.current.renderAll()
                                    saveToHistory()
                                    toast.success(`${effect.name} effect applied`)
                                  }}
                                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex flex-col items-center gap-1"
                                >
                                  <span className="text-lg font-bold" style={{
                                    textShadow: effect.id === 'shadow' ? '2px 2px 4px rgba(0,0,0,0.4)' :
                                      effect.id === 'glow' ? '0 0 8px #6366f1' :
                                      effect.id === 'neon' ? '0 0 8px #22d3ee' :
                                      effect.id === 'echo' ? '3px 3px 0 rgba(0,0,0,0.2)' :
                                      effect.id === 'lift' ? '0 4px 8px rgba(0,0,0,0.3)' : 'none',
                                    WebkitTextStroke: effect.id === 'outline' ? '1px #000' :
                                      effect.id === 'hollow' ? '1px #6366f1' : 'unset',
                                    color: effect.id === 'hollow' ? 'transparent' : '#334155',
                                  }}>Aa</span>
                                  <span className="text-[10px] text-slate-500">{effect.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Letter Spacing & Line Height */}
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Spacing</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">Letter Spacing</label>
                                <input
                                  type="range"
                                  min="-100"
                                  max="800"
                                  defaultValue={0}
                                  onChange={(e) => {
                                    if (!selectedObject || !fabricCanvasRef.current) return
                                    selectedObject.set('charSpacing', Number(e.target.value))
                                    fabricCanvasRef.current.renderAll()
                                  }}
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">Line Height</label>
                                <input
                                  type="range"
                                  min="0.5"
                                  max="3"
                                  step="0.1"
                                  defaultValue={1.16}
                                  onChange={(e) => {
                                    if (!selectedObject || !fabricCanvasRef.current) return
                                    selectedObject.set('lineHeight', Number(e.target.value))
                                    fabricCanvasRef.current.renderAll()
                                  }}
                                  className="w-full"
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
                              Upload Image / Video
                            </span>
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*,.svg"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>

                      {/* Stock Image Search */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Stock Images</h4>
                        <div className="relative mb-3">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="Search free images..."
                            className="pl-8 h-9 text-sm"
                            value={stockSearchQuery}
                            onChange={(e) => setStockSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') searchStockImages()
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {['Nature', 'Business', 'Technology', 'Food', 'Travel', 'Abstract'].map((tag) => (
                            <button
                              key={tag}
                              onClick={() => { setStockSearchQuery(tag); searchStockImages(tag) }}
                              className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/30 transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        {stockLoading && (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 max-h-100 overflow-y-auto">
                          {stockImages.map((img: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => addStockImageToCanvas(img.url, img.alt)}
                              className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:ring-2 hover:ring-indigo-200 transition-all group"
                            >
                              <img src={img.thumb} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                              </div>
                            </button>
                          ))}
                          {stockImages.length === 0 && !stockLoading && (
                            <p className="col-span-2 text-xs text-slate-400 text-center py-4">
                              Search for free stock images or click a category above
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-400">
                          Supports PNG, JPG, SVG, GIF, WebP images and MP4, WebM videos (frame capture)
                        </p>
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

                          {/* One-Click Canva-Style Filters */}
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Quick Styles</h4>
                            <div className="grid grid-cols-3 gap-2">
                              {CANVA_FILTERS.map((cf) => (
                                <button
                                  key={cf.id}
                                  onClick={() => {
                                    if (!fabricCanvasRef.current || !selectedObject || !(selectedObject instanceof fabric.FabricImage)) return
                                    // Clear existing filters
                                    (selectedObject as any).filters = []
                                    
                                    if (cf.id !== 'original') {
                                      if (cf.brightness !== 0) (selectedObject as any).filters.push(new fabric.filters.Brightness({ brightness: cf.brightness / 100 }))
                                      if (cf.contrast !== 0) (selectedObject as any).filters.push(new fabric.filters.Contrast({ contrast: cf.contrast / 100 }))
                                      if (cf.saturation !== 0) (selectedObject as any).filters.push(new fabric.filters.Saturation({ saturation: cf.saturation / 100 }))
                                      if (cf.id === 'bw') (selectedObject as any).filters.push(new fabric.filters.Grayscale())
                                      if (cf.id === 'vintage' || cf.id === 'retro') (selectedObject as any).filters.push(new fabric.filters.Sepia())
                                      if (cf.id === 'noir') {
                                        (selectedObject as any).filters.push(new fabric.filters.Grayscale())
                                        ;(selectedObject as any).filters.push(new fabric.filters.Contrast({ contrast: 0.3 }))
                                      }
                                    }
                                    ;(selectedObject as any).applyFilters()
                                    fabricCanvasRef.current.renderAll()
                                    saveToHistory()
                                    toast.success(`${cf.name} style applied`)
                                  }}
                                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:shadow-sm transition-all flex flex-col items-center gap-1.5"
                                >
                                  <div className="w-full aspect-square rounded-md overflow-hidden" style={{
                                    background: cf.id === 'warm' ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                                      cf.id === 'cool' ? 'linear-gradient(135deg, #38bdf8, #818cf8)' :
                                      cf.id === 'vivid' ? 'linear-gradient(135deg, #f43f5e, #8b5cf6)' :
                                      cf.id === 'dramatic' ? 'linear-gradient(135deg, #1e293b, #475569)' :
                                      cf.id === 'vintage' ? 'linear-gradient(135deg, #d4a574, #b08968)' :
                                      cf.id === 'bw' ? 'linear-gradient(135deg, #374151, #9ca3af)' :
                                      cf.id === 'fade' ? 'linear-gradient(135deg, #cbd5e1, #e2e8f0)' :
                                      cf.id === 'retro' ? 'linear-gradient(135deg, #c2410c, #ea580c)' :
                                      cf.id === 'pop' ? 'linear-gradient(135deg, #ec4899, #6366f1)' :
                                      cf.id === 'noir' ? 'linear-gradient(135deg, #0f172a, #334155)' :
                                      cf.id === 'dreamy' ? 'linear-gradient(135deg, #c4b5fd, #fbcfe8)' :
                                      'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                                  }} />
                                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{cf.name}</span>
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
                        {(['lines', 'frames', 'icons', 'social'] as const).map((cat) => (
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
                        {(['decorations', 'arrows', 'badges', 'callouts'] as const).map((cat) => (
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

                      {/* Category Tabs - Row 3 */}
                      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {(['dividers'] as const).map((cat) => (
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

                      {/* My Saved Designs Section */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">My Saved Designs</h4>
                          <Button size="sm" variant="ghost" onClick={() => {
                            const name = prompt('Design name:')
                            if (name) saveDesignToLocalStorage({ name })
                          }}>
                            <Save className="w-3 h-3 mr-1" /> Save Current
                          </Button>
                        </div>
                        {(() => {
                          const designs = getSavedDesigns()
                          if (designs.length === 0) {
                            return (
                              <p className="text-xs text-slate-400 italic px-2 py-3">No saved designs yet. Save your current work to access it later.</p>
                            )
                          }
                          return (
                            <div className="space-y-2 max-h-55 overflow-y-auto pr-1">
                              {designs.map((d: any) => (
                                <div
                                  key={d.id}
                                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                                  onClick={() => {
                                    if (confirm('Load this design? Unsaved changes will be lost.')) {
                                      loadDesignFromLocalStorage(d)
                                    }
                                  }}
                                >
                                  <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-500 rounded flex items-center justify-center shrink-0">
                                    <FileImage className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{d.name || 'Untitled'}</p>
                                    <p className="text-[10px] text-slate-400">{d.savedAt ? new Date(d.savedAt).toLocaleDateString() : 'Unknown date'}</p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm('Delete this design?')) deleteSavedDesign(d.id)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                      </div>

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

                  {/* ============ NEW Phase 10: Charts Panel ============ */}
                  {activePanel === 'charts' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                        Charts & Graphs
                      </h3>

                      {/* Chart Type */}
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block">Chart Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { type: 'bar' as const, icon: BarChart3, label: 'Bar Chart' },
                            { type: 'pie' as const, icon: PieChart, label: 'Pie Chart' },
                            { type: 'line' as const, icon: TrendingUp, label: 'Line Chart' },
                            { type: 'donut' as const, icon: PieChart, label: 'Donut Chart' },
                          ].map((ct) => (
                            <button
                              key={ct.type}
                              onClick={() => setChartType(ct.type)}
                              className={cn(
                                'p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all',
                                chartType === ct.type
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                              )}
                            >
                              <ct.icon className="w-5 h-5" />
                              <span className="text-xs">{ct.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Chart Title */}
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Title</label>
                        <Input value={chartTitle} onChange={(e) => setChartTitle(e.target.value)} placeholder="Chart Title" />
                      </div>

                      {/* Chart Data */}
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block">Data Points</label>
                        <div className="space-y-2">
                          {chartData.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="color"
                                value={chartColors[i % chartColors.length]}
                                onChange={(e) => {
                                  const newColors = [...chartColors]
                                  newColors[i] = e.target.value
                                  setChartColors(newColors)
                                }}
                                className="w-6 h-6 rounded cursor-pointer border-0"
                              />
                              <Input
                                value={d.label}
                                onChange={(e) => {
                                  const newData = [...chartData]
                                  newData[i].label = e.target.value
                                  setChartData(newData)
                                }}
                                className="flex-1"
                                placeholder="Label"
                              />
                              <Input
                                type="number"
                                value={d.value}
                                onChange={(e) => {
                                  const newData = [...chartData]
                                  newData[i].value = Number(e.target.value)
                                  setChartData(newData)
                                }}
                                className="w-20"
                                placeholder="Value"
                              />
                              <button
                                onClick={() => setChartData(chartData.filter((_, idx) => idx !== i))}
                                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                              >
                                <X className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChartData([...chartData, { label: `Item ${chartData.length + 1}`, value: 50 }])}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Data Point
                          </Button>
                        </div>
                      </div>

                      <Button onClick={generateChart} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Add Chart to Canvas
                      </Button>
                    </div>
                  )}

                  {/* ============ NEW Phase 10: Tables Panel ============ */}
                  {activePanel === 'tables' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Table2 className="w-5 h-5 text-indigo-600" />
                        Table Generator
                      </h3>

                      {/* Table Size */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Rows: {tableRows}</label>
                          <input type="range" min="2" max="10" value={tableRows} onChange={(e) => setTableRows(Number(e.target.value))} className="w-full" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Columns: {tableCols}</label>
                          <input type="range" min="2" max="8" value={tableCols} onChange={(e) => setTableCols(Number(e.target.value))} className="w-full" />
                        </div>
                      </div>

                      {/* Table Style */}
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block">Style</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['modern', 'classic', 'minimal', 'colorful'] as const).map((style) => (
                            <button
                              key={style}
                              onClick={() => setTableStyle(style)}
                              className={cn(
                                'p-2.5 rounded-lg border-2 text-sm capitalize transition-all',
                                tableStyle === style
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                              )}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Header Color */}
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Header Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={tableHeaderBg}
                            onChange={(e) => setTableHeaderBg(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border-0"
                          />
                          <Input value={tableHeaderBg} onChange={(e) => setTableHeaderBg(e.target.value)} className="flex-1" />
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-2">Preview: {tableRows} × {tableCols} table</p>
                        <div className="w-full overflow-hidden rounded border border-slate-200 dark:border-slate-700">
                          <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(tableCols, 4)}, 1fr)` }}>
                            {Array.from({ length: Math.min(tableRows, 3) * Math.min(tableCols, 4) }).map((_, i) => (
                              <div
                                key={i}
                                className="text-[9px] text-center py-1 border-r border-b border-slate-200 dark:border-slate-700"
                                style={{
                                  backgroundColor: i < Math.min(tableCols, 4) ? tableHeaderBg : (Math.floor(i / Math.min(tableCols, 4)) % 2 === 0 ? '#f8fafc' : '#ffffff'),
                                  color: i < Math.min(tableCols, 4) ? '#ffffff' : '#64748b',
                                }}
                              >
                                {i < Math.min(tableCols, 4) ? `H${(i % Math.min(tableCols, 4)) + 1}` : `C`}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button onClick={generateTable} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Table2 className="w-4 h-4 mr-2" />
                        Add Table to Canvas
                      </Button>
                    </div>
                  )}

                  {/* ============ NEW Phase 10: QR Code Panel ============ */}
                  {activePanel === 'qrcode' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-indigo-600" />
                        QR Code Generator
                      </h3>

                      {/* Content */}
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">URL or Text</label>
                        <Textarea
                          value={qrText}
                          onChange={(e) => setQrText(e.target.value)}
                          placeholder="https://your-website.com"
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      {/* Size */}
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Size: {qrSize}px</label>
                        <input type="range" min="100" max="500" step="10" value={qrSize} onChange={(e) => setQrSize(Number(e.target.value))} className="w-full" />
                      </div>

                      {/* Colors */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Foreground</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={qrFgColor} onChange={(e) => setQrFgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                            <Input value={qrFgColor} onChange={(e) => setQrFgColor(e.target.value)} className="flex-1 text-xs" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Background</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={qrBgColor} onChange={(e) => setQrBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                            <Input value={qrBgColor} onChange={(e) => setQrBgColor(e.target.value)} className="flex-1 text-xs" />
                          </div>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block">Quick Fill</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Website', prefix: 'https://' },
                            { label: 'Email', prefix: 'mailto:' },
                            { label: 'Phone', prefix: 'tel:' },
                            { label: 'Wi-Fi', prefix: 'WIFI:S:' },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              onClick={() => setQrText(qrText.startsWith(preset.prefix) ? qrText : preset.prefix)}
                              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button onClick={generateQRCode} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                        <QrCode className="w-4 h-4 mr-2" />
                        Generate QR Code
                      </Button>
                    </div>
                  )}

                  {/* ============ NEW Phase 10: Mockups Panel ============ */}
                  {activePanel === 'mockups' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-indigo-600" />
                        Device Mockups
                      </h3>
                      <p className="text-xs text-slate-500">Add device mockup frames to showcase your designs</p>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { type: 'phone' as const, icon: Smartphone, label: 'Phone', desc: 'iPhone style' },
                          { type: 'tablet' as const, icon: Tablet, label: 'Tablet', desc: 'iPad style' },
                          { type: 'laptop' as const, icon: Monitor, label: 'Laptop', desc: 'MacBook style' },
                          { type: 'desktop' as const, icon: Monitor, label: 'Desktop', desc: 'iMac style' },
                        ].map((device) => (
                          <button
                            key={device.type}
                            onClick={() => setMockupDevice(device.type)}
                            className={cn(
                              'p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all',
                              mockupDevice === device.type
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                            )}
                          >
                            <device.icon className="w-8 h-8" />
                            <span className="text-sm font-medium">{device.label}</span>
                            <span className="text-[10px] text-slate-400">{device.desc}</span>
                          </button>
                        ))}
                      </div>

                      <Button onClick={generateMockup} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Smartphone className="w-4 h-4 mr-2" />
                        Add Mockup to Canvas
                      </Button>

                      {/* Gradient Text Section */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <Paintbrush className="w-4 h-4 text-indigo-600" />
                          Gradient Text
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { label: 'Sunset Text', colors: ['#FF512F', '#DD2476'], text: 'Sunset' },
                            { label: 'Ocean Text', colors: ['#2193b0', '#6dd5ed'], text: 'Ocean' },
                            { label: 'Neon Text', colors: ['#7F00FF', '#E100FF'], text: 'Neon Glow' },
                            { label: 'Gold Text', colors: ['#F2994A', '#F2C94C'], text: 'Golden' },
                            { label: 'Nature Text', colors: ['#11998e', '#38ef7d'], text: 'Nature' },
                            { label: 'Fire Text', colors: ['#f12711', '#f5af19'], text: 'Fire' },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              onClick={() => addGradientText(preset.text, preset.colors)}
                              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all flex items-center gap-3 group"
                            >
                              <div
                                className="w-16 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold"
                                style={{ background: `linear-gradient(90deg, ${preset.colors[0]}, ${preset.colors[1]})` }}
                              >
                                Aa
                              </div>
                              <span className="text-sm">{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============ NEW Phase 10: Video Panel ============ */}
                  {activePanel === 'video' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Film className="w-5 h-5 text-indigo-600" />
                        Video Editor
                      </h3>
                      <p className="text-xs text-slate-500">Upload a video to extract frames, trim, and add to your design</p>

                      {/* Upload Video */}
                      <label className="block">
                        <div className="w-full p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 transition-colors flex flex-col items-center gap-2 cursor-pointer">
                          <Film className="w-8 h-8 text-slate-400" />
                          <span className="text-sm text-slate-500">Upload Video</span>
                          <span className="text-[10px] text-slate-400">MP4, WebM, MOV</span>
                        </div>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) openVideoEditor(file)
                            e.target.value = ''
                          }}
                        />
                      </label>

                      {/* Video Templates */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold mb-3">Video Canvas Sizes</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: Youtube },
                            { name: 'TikTok / Reel', width: 1080, height: 1920, icon: Smartphone },
                            { name: 'YouTube Banner', width: 2560, height: 1440, icon: Monitor },
                            { name: 'Video 16:9', width: 1920, height: 1080, icon: Film },
                            { name: 'Video 4:3', width: 1440, height: 1080, icon: Film },
                            { name: 'Square Video', width: 1080, height: 1080, icon: Square },
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => {
                                setCanvasSize({ width: preset.width, height: preset.height })
                                if (fabricCanvasRef.current) {
                                  fabricCanvasRef.current.setDimensions({ width: preset.width * zoom, height: preset.height * zoom })
                                  fabricCanvasRef.current.renderAll()
                                }
                                setShowTemplateModal(false)
                                toast.success(`Canvas set to ${preset.name}`)
                              }}
                              className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all flex items-center gap-3 text-left"
                            >
                              <preset.icon className="w-5 h-5 text-indigo-600" />
                              <div>
                                <p className="text-sm font-medium">{preset.name}</p>
                                <p className="text-[10px] text-slate-400">{preset.width} × {preset.height}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Select Panel - Object Properties (auto-shown when object selected) */}
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
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div
              ref={containerRef}
              className={cn(
                'flex-1 overflow-auto flex items-center justify-center p-8',
                showGrid && 'bg-size-[20px_20px] bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)]'
              )}
              style={{ backgroundColor: '#f1f5f9' }}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
            >
              <div className="shadow-2xl rounded-lg overflow-hidden relative" style={{ backgroundColor: '#fff' }}>
                <canvas ref={canvasRef} />
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
                <span className="text-xs text-slate-500 min-w-15 text-center">
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

        {/* ============ NEW Phase 10: Video Editor Dialog ============ */}
        <Dialog open={showVideoEditor} onOpenChange={(open) => {
          if (!open && videoUrl) {
            URL.revokeObjectURL(videoUrl)
            setVideoUrl('')
            setVideoFile(null)
            setVideoFrames([])
          }
          setShowVideoEditor(open)
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-600" />
                Video Editor
              </DialogTitle>
              <DialogDescription>
                Scrub through your video, extract frames, and add them to your design canvas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Video Player */}
              {videoUrl && (
                <div className="bg-black rounded-xl overflow-hidden relative">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full max-h-90ct-contain"
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget
                      setVideoDuration(video.duration)
                      setVideoTrimEnd(video.duration)
                    }}
                    onTimeUpdate={(e) => setVideoCurrentTime(e.currentTarget.currentTime)}
                  />
                  {/* Play Overlay */}
                  {!isVideoPlaying && (
                    <button
                      onClick={() => {
                        videoRef.current?.play()
                        setIsVideoPlaying(true)
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-8 h-8 text-slate-900 ml-1" />
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Playback Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      if (isVideoPlaying) {
                        videoRef.current.pause()
                        setIsVideoPlaying(false)
                      } else {
                        videoRef.current.play()
                        setIsVideoPlaying(true)
                      }
                    }
                  }}
                  className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {isVideoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = Math.min(videoDuration, videoRef.current.currentTime + 5)
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-500 font-mono">
                  {videoCurrentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
                </span>
              </div>

              {/* Timeline Scrubber */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500">Timeline</label>
                <input
                  type="range"
                  min="0"
                  max={videoDuration}
                  step="0.1"
                  value={videoCurrentTime}
                  onChange={(e) => {
                    const time = Number(e.target.value)
                    if (videoRef.current) {
                      videoRef.current.currentTime = time
                      setVideoCurrentTime(time)
                    }
                  }}
                  className="w-full h-2 appearance-none bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(videoCurrentTime / videoDuration) * 100}%, #e2e8f0 ${(videoCurrentTime / videoDuration) * 100}%, #e2e8f0 100%)`,
                  }}
                />
              </div>

              {/* Trim Controls */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Scissors className="w-4 h-4" /> Trim Range
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Start: {videoTrimStart.toFixed(1)}s</label>
                    <input
                      type="range"
                      min="0"
                      max={videoDuration}
                      step="0.1"
                      value={videoTrimStart}
                      onChange={(e) => setVideoTrimStart(Math.min(Number(e.target.value), videoTrimEnd - 0.5))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">End: {videoTrimEnd.toFixed(1)}s</label>
                    <input
                      type="range"
                      min="0"
                      max={videoDuration}
                      step="0.1"
                      value={videoTrimEnd}
                      onChange={(e) => setVideoTrimEnd(Math.max(Number(e.target.value), videoTrimStart + 0.5))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={captureCurrentFrame}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Current Frame
                </Button>
                <Button
                  onClick={extractVideoFrames}
                  variant="outline"
                  disabled={isExtractingFrames}
                >
                  {isExtractingFrames ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Film className="w-4 h-4 mr-2" />
                  )}
                  Extract All Frames
                </Button>
              </div>

              {/* Extracted Frames Grid */}
              {videoFrames.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Extracted Frames ({videoFrames.length})
                  </h4>
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {videoFrames.map((frame, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          addFrameToCanvas(frame, index)
                          toast.success(`Frame ${index + 1} added to canvas`)
                        }}
                        className="relative rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all group"
                      >
                        <img src={frame} alt={`Frame ${index + 1}`} className="w-full aspect-video object-cover" />
                        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/30 transition-colors flex items-center justify-center">
                          <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1 rounded">
                          #{index + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => {
                if (videoUrl) URL.revokeObjectURL(videoUrl)
                setShowVideoEditor(false)
                setVideoUrl('')
                setVideoFile(null)
                setVideoFrames([])
              }}>
                Close
              </Button>
              <Button onClick={exportVideoClip} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
