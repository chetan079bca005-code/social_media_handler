import { request } from './api'

interface TextGenerationOptions {
  topic: string
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational'
  platform: string
  length: 'short' | 'medium' | 'long'
  keywords?: string[]
  includeHashtags?: boolean
  includeEmojis?: boolean
  includeCTA?: boolean
  variations?: number
}

interface ImageGenerationOptions {
  prompt: string
  imageUrl: string
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9'
  resolution?: '1K' | '2K' | '4K'
}

export interface GeneratedImageHistoryItem {
  id: string
  url: string
  createdAt: string
  metadata?: Record<string, unknown>
}

interface AudioGenerationOptions {
  text: string
  voice?: string
  speed?: number
  language?: string
}

// Platform-specific character limits and guidelines
const PLATFORM_GUIDELINES = {
  twitter: {
    maxChars: 280,
    style: 'concise, punchy, use threads for longer content',
    hashtagLimit: 3,
  },
  instagram: {
    maxChars: 2200,
    style: 'visual storytelling, engaging, use line breaks',
    hashtagLimit: 30,
  },
  facebook: {
    maxChars: 63206,
    style: 'conversational, community-focused',
    hashtagLimit: 5,
  },
  linkedin: {
    maxChars: 3000,
    style: 'professional, thought leadership, industry insights',
    hashtagLimit: 5,
  },
  tiktok: {
    maxChars: 2200,
    style: 'trendy, casual, use trending sounds/hashtags',
    hashtagLimit: 5,
  },
  youtube: {
    maxChars: 5000,
    style: 'descriptive, SEO-optimized, include timestamps',
    hashtagLimit: 15,
  },
  pinterest: {
    maxChars: 500,
    style: 'descriptive, keyword-rich, actionable',
    hashtagLimit: 20,
  },
  threads: {
    maxChars: 500,
    style: 'conversational, authentic, minimal hashtags',
    hashtagLimit: 3,
  },
}

const LENGTH_GUIDELINES = {
  short: '1-2 sentences, around 50-100 characters',
  medium: '2-4 sentences, around 150-300 characters',
  long: '4-8 sentences, around 300-600 characters',
}

// Text Generation using OpenRouter
export async function generateText(options: TextGenerationOptions): Promise<string[]> {
  const {
    topic,
    tone,
    platform,
    length,
    keywords = [],
    includeHashtags = true,
    includeEmojis = true,
    includeCTA = false,
    variations = 3,
  } = options

  const platformConfig = PLATFORM_GUIDELINES[platform as keyof typeof PLATFORM_GUIDELINES] || PLATFORM_GUIDELINES.instagram
  const lengthGuideline = LENGTH_GUIDELINES[length]

  const systemPrompt = `You are an expert social media content creator specializing in ${platform} content. 
Your task is to create engaging, platform-optimized content that resonates with audiences.

Guidelines:
- Tone: ${tone}
- Platform: ${platform} (max ${platformConfig.maxChars} characters)
- Style: ${platformConfig.style}
- Length: ${lengthGuideline}
${includeHashtags ? `- Include up to ${platformConfig.hashtagLimit} relevant hashtags` : '- Do not include hashtags'}
${includeEmojis ? '- Use emojis strategically to enhance engagement' : '- Do not use emojis'}
${includeCTA ? '- Include a clear call-to-action' : ''}
${keywords.length > 0 ? `- Incorporate these keywords naturally: ${keywords.join(', ')}` : ''}

Create content that is authentic, engaging, and optimized for ${platform}'s algorithm and audience expectations.`

  const userPrompt = `Create ${variations} unique variations of a ${platform} post about: "${topic}"

Each variation should be different in approach but maintain the same ${tone} tone.
Format your response as a JSON array of strings, each containing a complete post.
Example: ["Post 1 content here...", "Post 2 content here...", "Post 3 content here..."]`

  try {
    const response = await request<{ success: boolean; data?: { variations?: string[] | string; usage?: unknown } }>(
      {
        method: 'POST',
        url: '/ai/variations',
        data: {
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          platform,
          tone,
          count: variations,
        },
      }
    )

    if (response.success === false) {
      throw new Error('AI service returned an error')
    }

    const variationsList = response.data?.variations ?? (response as unknown as { variations?: string[] | string })?.variations
    if (Array.isArray(variationsList) && variationsList.length > 0) {
      return variationsList
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
    }

    if (typeof variationsList === 'string') {
      const trimmed = variationsList.trim()
      if (trimmed.length > 0) {
        try {
          const parsed = JSON.parse(trimmed)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        } catch {
          // ignore parse errors
        }

        const lines = trimmed
          .split(/\r?\n/)
          .map((line) => line.replace(/^\s*[-*\d.)]+\s*/, '').trim())
          .filter((line) => line.length > 0)

        if (lines.length > 0) {
          return lines
        }

        return [trimmed]
      }
    }

    return []
  } catch (error) {
    console.error('Text generation error:', error)
    throw new Error('Failed to generate text content. Please try again.')
  }
}

// Caption Rewriter
export async function rewriteCaption(
  originalCaption: string,
  platform: string,
  tone: string
): Promise<string> {
  try {
    const improvementType = tone === 'professional'
      ? 'professional'
      : tone === 'casual'
        ? 'casual'
        : 'engagement'

    const response = await request<{ data: { content: string } }>(
      {
        method: 'POST',
        url: '/ai/improve',
        data: {
          content: originalCaption,
          platform,
          improvementType,
        },
      }
    )

    return response.data?.content || originalCaption
  } catch (error) {
    console.error('Caption rewrite error:', error)
    throw new Error('Failed to rewrite caption. Please try again.')
  }
}

// Hashtag Generator
export async function generateHashtags(
  topic: string,
  platform: string,
  count: number = 10
): Promise<string[]> {
  try {
    const response = await request<{ data?: { hashtags?: string[] | string; error?: string } }>(
      {
        method: 'POST',
        url: '/ai/hashtags',
        data: {
          content: topic,
          platform,
          count,
        },
      }
    )

    // Check if there was an error from the API
    if (response.data?.error) {
      console.warn('Hashtag generation warning:', response.data.error)
      // Return empty array but don't throw - let the UI handle gracefully
      return []
    }

    const rawHashtags = response.data?.hashtags
    if (Array.isArray(rawHashtags)) {
      return rawHashtags
        .map((tag) => String(tag).replace(/^#/, '').trim())
        .filter((tag) => tag.length > 0)
    }

    if (typeof rawHashtags === 'string') {
      const trimmed = rawHashtags.trim()
      if (trimmed.length === 0) {
        return []
      }

      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed
            .map((tag) => String(tag).replace(/^#/, '').trim())
            .filter((tag) => tag.length > 0)
        }
      } catch {
        // ignore parse errors
      }

      return trimmed
        .split(/[,\n]/)
        .map((tag) => tag.replace(/^#/, '').trim())
        .filter((tag) => tag.length > 0)
    }

    return []
  } catch (error) {
    console.error('Hashtag generation error:', error)
    // Return empty array instead of throwing to prevent UI crashes
    return []
  }
}

// Content Ideas Generator
export async function generateContentIdeas(
  niche: string,
  platform: string,
  count: number = 5
): Promise<{ title: string; description: string; contentType: string }[]> {
  try {
    const response = await request<{ data?: { content?: string | Array<{ title: string; description: string; contentType: string }> } }>(
      {
        method: 'POST',
        url: '/ai/generate',
        data: {
          prompt: `Generate ${count} content ideas for ${platform} in the ${niche} niche.\n\nFor each idea, provide:\n- title: A catchy title\n- description: Brief description of the content\n- contentType: The type of content (text, image, video, carousel)\n\nReturn as a JSON array. Example: [{"title": "...", "description": "...", "contentType": "image"}]`,
          platform,
        },
      }
    )

    const content = response.data?.content
    if (Array.isArray(content)) {
      return content
    }

    const raw = typeof content === 'string' ? content : '[]'
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      const start = raw.indexOf('[')
      const end = raw.lastIndexOf(']')
      if (start >= 0 && end > start) {
        try {
          const sliced = raw.slice(start, end + 1)
          const parsed = JSON.parse(sliced)
          if (Array.isArray(parsed)) {
            return parsed
          }
        } catch {
          return []
        }
      }
      return []
    }

    return []
  } catch (error) {
    console.error('Content ideas error:', error)
    throw new Error('Failed to generate content ideas. Please try again.')
  }
}

// Image Generation using OpenRouter with compatible model
export async function generateImage(options: ImageGenerationOptions): Promise<string[]> {
  const { prompt, imageUrl, aspectRatio = '1:1', resolution = '1K' } = options

  const enhancedPrompt = prompt.trim()

  try {
    const submitResponse = await request<{ data?: { requestId?: string } }>(
      {
        method: 'POST',
        url: '/ai/image',
        timeout: 120000,
        data: {
          prompt: enhancedPrompt,
          image: imageUrl,
          aspectRatio,
          resolution,
        },
      }
    )

    const requestId = submitResponse.data?.requestId
    console.log('Image generation submitted, requestId:', requestId)
    if (!requestId) {
      console.error('No requestId returned from image submission')
      return []
    }

    const maxAttempts = 30
    const delayMs = 2000

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))

      const resultResponse = await request<{ data?: { status?: string; images?: string[]; error?: string } }>(
        {
          method: 'GET',
          url: `/ai/image/${requestId}`,
          timeout: 120000,
        }
      )

      console.log(`Attempt ${attempt + 1}: Image result response:`, resultResponse)

      // Normalize status for case-insensitive comparison
      const status = (resultResponse.data?.status || '').toLowerCase()
      const successStatuses = ['success', 'completed', 'done', 'finished']
      const errorStatuses = ['error', 'failed', 'failure']
      
      if (successStatuses.includes(status)) {
        const images = resultResponse.data?.images || []
        console.log('Image generation successful, images:', images)
        return images
      }

      if (errorStatuses.includes(status)) {
        console.error('Image generation failed with status:', status, 'error:', resultResponse.data?.error)
        return []
      }
      
      // Still processing, continue polling
      console.log(`Image generation status: ${status}, continuing to poll...`)
    }

    console.warn('Image generation timed out after max attempts')
    return []
  } catch (error) {
    console.error('Image generation error:', error)
    throw new Error('Failed to generate image. Please try again.')
  }
}

export async function getImageHistory(): Promise<GeneratedImageHistoryItem[]> {
  try {
    const response = await request<{ data?: { images?: GeneratedImageHistoryItem[] } }>(
      {
        method: 'GET',
        url: '/ai/image/history',
      }
    )

    return response.data?.images || []
  } catch (error) {
    console.error('Image history error:', error)
    return []
  }
}

// Audio/Voice Generation
export async function generateAudio(_options: AudioGenerationOptions): Promise<string> {
  console.error('Audio generation error:', 'Audio generation not supported via API')
  throw new Error('Audio generation is not supported right now. Please try again later.')
}

// Translate content
export async function translateContent(
  content: string,
  targetLanguage: string
): Promise<string> {
  try {
    const response = await request<{ data: { content: string } }>(
      {
        method: 'POST',
        url: '/ai/generate',
        data: {
          prompt: `Translate the following content to ${targetLanguage} while maintaining tone, emojis, and hashtags. Keep hashtags in their original language if commonly used internationally.\n\n${content}`,
          language: targetLanguage,
        },
      }
    )

    return response.data?.content || content
  } catch (error) {
    console.error('Translation error:', error)
    throw new Error('Failed to translate content. Please try again.')
  }
}

// Alt Text Generator for Images
export async function generateAltText(imageUrl: string): Promise<string> {
  try {
    const response = await request<{ data: { content: string } }>(
      {
        method: 'POST',
        url: '/ai/generate',
        data: {
          prompt: `Generate concise, descriptive alt text (under 125 characters) for the image at this URL: ${imageUrl}`,
          maxLength: 125,
        },
      }
    )

    return response.data?.content || 'Image'
  } catch (error) {
    console.error('Alt text generation error:', error)
    return 'Image'
  }
}

// Best Posting Time Suggestion
export async function suggestBestPostingTime(
  platform: string,
  timezone: string = 'UTC'
): Promise<{ day: string; time: string; reason: string }[]> {
  try {
    const response = await request<{ data: { content: string } }>(
      {
        method: 'POST',
        url: '/ai/generate',
        data: {
          prompt: `Suggest the best 5 posting times for ${platform} in the ${timezone} timezone.\nConsider current trends and platform algorithm preferences.\n\nReturn as a JSON array with: day, time (24h format), reason. Example: [{"day": "Monday", "time": "09:00", "reason": "High user activity at start of work week"}]`,
          platform,
        },
      }
    )

    const content = response.data?.content || '[]'
    try {
      return JSON.parse(content)
    } catch {
      return []
    }
  } catch (error) {
    console.error('Best time suggestion error:', error)
    return []
  }
}

export const aiService = {
  generateText,
  rewriteCaption,
  generateHashtags,
  generateContentIdeas,
  generateImage,
  generateAudio,
  translateContent,
  generateAltText,
  suggestBestPostingTime,
}

export default aiService
