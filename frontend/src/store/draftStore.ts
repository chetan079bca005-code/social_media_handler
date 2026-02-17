import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PostDraft {
  /** Set when editing an existing post */
  editId?: string | null
  content: string
  selectedPlatforms: string[]
  /** Actual social account IDs mapped to platforms */
  selectedAccountIds: string[]
  hashtags: string[]
  linkUrl: string
  scheduledDate: string
  scheduledTime: string
  /** AI generation state */
  aiTopic: string
  aiTone: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational'
  aiLength: 'short' | 'medium' | 'long'
  /** Tracks uploaded media IDs (from server) */
  uploadedMediaIds: string[]
  /** Local file preview data URIs (can't persist File objects) */
  mediaPreviewUrls: string[]
  /** Timestamp of last modification */
  lastModified: number
}

const EMPTY_DRAFT: PostDraft = {
  editId: null,
  content: '',
  selectedPlatforms: [],
  selectedAccountIds: [],
  hashtags: [],
  linkUrl: '',
  scheduledDate: '',
  scheduledTime: '',
  aiTopic: '',
  aiTone: 'casual',
  aiLength: 'medium',
  uploadedMediaIds: [],
  mediaPreviewUrls: [],
  lastModified: 0,
}

interface DraftStoreState {
  draft: PostDraft
  /** Whether there are unsaved changes compared to what's on the server */
  isDirty: boolean
  /** Update a subset of the draft fields */
  updateDraft: (updates: Partial<PostDraft>) => void
  /** Load a post from the server into the draft for editing */
  loadForEdit: (post: any) => void
  /** Clear the draft (after publish/schedule/save) */
  clearDraft: () => void
  /** Check if a draft exists that is worth restoring */
  hasDraft: () => boolean
}

export const useDraftStore = create<DraftStoreState>()(
  persist(
    (set, get) => ({
      draft: { ...EMPTY_DRAFT },
      isDirty: false,

      updateDraft: (updates) =>
        set((state) => ({
          draft: { ...state.draft, ...updates, lastModified: Date.now() },
          isDirty: true,
        })),

      loadForEdit: (post) =>
        set({
          draft: {
            editId: post.id,
            content: post.content || '',
            selectedPlatforms: (post.platforms || []).map(
              (p: any) => p.socialAccount?.platform?.toLowerCase() || ''
            ).filter(Boolean),
            selectedAccountIds: (post.platforms || []).map(
              (p: any) => p.socialAccountId || p.socialAccount?.id || ''
            ).filter(Boolean),
            hashtags: post.hashtags || [],
            linkUrl: post.linkUrl || '',
            scheduledDate: post.scheduledAt
              ? new Date(post.scheduledAt).toISOString().split('T')[0]
              : '',
            scheduledTime: post.scheduledAt
              ? new Date(post.scheduledAt).toTimeString().slice(0, 5)
              : '',
            aiTopic: '',
            aiTone: 'casual',
            aiLength: 'medium',
            uploadedMediaIds: (post.mediaFiles || []).map(
              (m: any) => m.mediaFileId || m.mediaFile?.id || m.id || ''
            ).filter(Boolean),
            mediaPreviewUrls: (post.mediaFiles || []).map(
              (m: any) => m.mediaFile?.url || m.url || ''
            ).filter(Boolean),
            lastModified: Date.now(),
          },
          isDirty: false,
        }),

      clearDraft: () =>
        set({
          draft: { ...EMPTY_DRAFT },
          isDirty: false,
        }),

      hasDraft: () => {
        const { draft } = get()
        return (
          draft.content.trim().length > 0 ||
          draft.hashtags.length > 0 ||
          draft.uploadedMediaIds.length > 0 ||
          draft.mediaPreviewUrls.length > 0
        )
      },
    }),
    {
      name: 'post-draft-storage',
      partialize: (state) => ({ draft: state.draft, isDirty: state.isDirty }),
    }
  )
)
