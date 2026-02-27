import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface VideoFormState {
  prompt: string
  imageUrl: string
  aspectRatio: '16:9' | '9:16'
  duration: 4 | 6 | 8
  resolution: '720p' | '1080p'
  /** Videos from the last generation (URLs) */
  generatedVideos: string[]
  /** Cloudinary-saved copies */
  savedVideos: { cloudinaryUrl: string; publicId?: string }[]
  /** Last status so the user sees "complete" after refresh */
  lastStatus: string
  /** Timestamp of last modification */
  lastModified: number
}

const EMPTY_FORM: VideoFormState = {
  prompt: '',
  imageUrl: '',
  aspectRatio: '16:9',
  duration: 4,
  resolution: '720p',
  generatedVideos: [],
  savedVideos: [],
  lastStatus: 'idle',
  lastModified: 0,
}

interface VideoStoreState {
  form: VideoFormState
  updateForm: (updates: Partial<VideoFormState>) => void
  clearForm: () => void
  hasForm: () => boolean
}

export const useVideoStore = create<VideoStoreState>()(
  persist(
    (set, get) => ({
      form: { ...EMPTY_FORM },

      updateForm: (updates) =>
        set((state) => ({
          form: { ...state.form, ...updates, lastModified: Date.now() },
        })),

      clearForm: () =>
        set({ form: { ...EMPTY_FORM } }),

      hasForm: () => {
        const { form } = get()
        return form.prompt.trim().length > 0 || form.imageUrl.trim().length > 0
      },
    }),
    {
      name: 'video-studio-storage',
      partialize: (state) => ({ form: state.form }),
    }
  )
)
