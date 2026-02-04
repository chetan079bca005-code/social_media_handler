import axios from 'axios';
import { config } from '../config';
import prisma from '../config/database';
import { AppError } from '../middleware/error';

export interface TextGenerationRequest {
  prompt: string;
  platform?: string;
  tone?: string;
  maxLength?: number;
  language?: string;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

export interface ImageGenerationRequest {
  prompt: string;
  style?: string;
  aspectRatio?: string;
  count?: number;
}

export interface ContentImprovementRequest {
  content: string;
  platform?: string;
  improvementType: 'grammar' | 'engagement' | 'professional' | 'casual' | 'seo';
}

export interface HashtagSuggestionRequest {
  content: string;
  platform?: string;
  count?: number;
}

export interface AIGenerationResult {
  success: boolean;
  data?: unknown;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Helper function to call OpenRouter API
async function callOpenRouter(
  model: string,
  messages: { role: string; content: string }[],
  options: {
    maxTokens?: number;
    temperature?: number;
    responseFormat?: { type: string };
  } = {}
): Promise<AIGenerationResult> {
  // Check if API key is configured
  if (!config.ai.openRouterApiKey) {
    return {
      success: false,
      error: 'AI service not configured. Please set OPENROUTER_API_KEY in your environment variables.',
    };
  }

  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model,
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature ?? 0.7,
        ...(options.responseFormat && { response_format: options.responseFormat }),
      },
      {
        headers: {
          Authorization: `Bearer ${config.ai.openRouterApiKey}`,
          'HTTP-Referer': config.frontendUrl,
          'X-Title': 'Social Media Handler',
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data.choices[0]?.message?.content,
      usage: {
        promptTokens: response.data.usage?.prompt_tokens || 0,
        completionTokens: response.data.usage?.completion_tokens || 0,
        totalTokens: response.data.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('OpenRouter API Error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'AI service error. Please check your API key configuration.',
      };
    }
    throw error;
  }
}

// Generate social media post content
export async function generatePostContent(
  request: TextGenerationRequest
): Promise<AIGenerationResult> {
  const platformGuidelines: Record<string, string> = {
    twitter: 'Keep it under 280 characters. Use concise, punchy language.',
    instagram: 'Use engaging captions with line breaks. Up to 2200 characters.',
    facebook: 'Can be longer, conversational tone. Use calls to action.',
    linkedin: 'Professional tone, industry insights, thought leadership.',
    tiktok: 'Trendy, casual, use trending phrases and hooks.',
  };

  const toneInstructions: Record<string, string> = {
    professional: 'Maintain a professional, business-appropriate tone.',
    casual: 'Use a friendly, conversational, and approachable tone.',
    humorous: 'Include humor, wit, and playful language.',
    inspirational: 'Use motivating, uplifting, and encouraging language.',
    informative: 'Focus on facts, education, and valuable information.',
  };

  const systemPrompt = `You are an expert social media content creator and copywriter.
Create engaging social media content based on the user's prompt.

${request.platform ? `Platform guidelines: ${platformGuidelines[request.platform.toLowerCase()] || ''}` : ''}
${request.tone ? `Tone: ${toneInstructions[request.tone.toLowerCase()] || request.tone}` : ''}
${request.maxLength ? `Maximum length: ${request.maxLength} characters` : ''}
${request.includeHashtags ? 'Include relevant hashtags at the end.' : ''}
${request.includeEmojis ? 'Include relevant emojis to enhance engagement.' : ''}
${request.language ? `Write in ${request.language}.` : ''}

Output only the post content, nothing else.`;

  return callOpenRouter(
    config.ai.textModel,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: request.prompt },
    ],
    {
      maxTokens: request.maxLength ? Math.ceil(request.maxLength / 3) : 500,
      temperature: 0.8,
    }
  );
}

// Generate multiple post variations
export async function generatePostVariations(
  request: TextGenerationRequest,
  count: number = 3
): Promise<AIGenerationResult> {
  const systemPrompt = `You are an expert social media content creator.
Generate ${count} different variations of social media posts based on the user's prompt.

${request.platform ? `Platform: ${request.platform}` : ''}
${request.tone ? `Tone: ${request.tone}` : ''}

Each variation should have a different approach:
1. Direct and clear
2. Question-based to encourage engagement
3. Story or hook-based

Format as JSON array: ["variation1", "variation2", "variation3"]
Only output the JSON array, nothing else.`;

  const result = await callOpenRouter(
    config.ai.textModel,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: request.prompt },
    ],
    {
      maxTokens: 1500,
      temperature: 0.9,
      responseFormat: { type: 'json_object' },
    }
  );

  if (result.success && typeof result.data === 'string') {
    try {
      result.data = JSON.parse(result.data);
    } catch {
      // Keep as string if parsing fails
    }
  }

  return result;
}

// Improve existing content
export async function improveContent(
  request: ContentImprovementRequest
): Promise<AIGenerationResult> {
  const improvementPrompts: Record<string, string> = {
    grammar: 'Fix grammar, spelling, and punctuation errors while maintaining the original meaning and style.',
    engagement: 'Make the content more engaging, add hooks, questions, or calls to action.',
    professional: 'Rewrite to be more professional and business-appropriate.',
    casual: 'Rewrite to be more casual, friendly, and conversational.',
    seo: 'Optimize for search visibility, include relevant keywords naturally.',
  };

  const systemPrompt = `You are an expert content editor.
${improvementPrompts[request.improvementType]}

${request.platform ? `Optimize for ${request.platform}.` : ''}

Output only the improved content, nothing else.`;

  return callOpenRouter(
    config.ai.textModel,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: request.content },
    ],
    {
      maxTokens: 1000,
      temperature: 0.5,
    }
  );
}

// Generate hashtag suggestions
export async function generateHashtags(
  request: HashtagSuggestionRequest
): Promise<AIGenerationResult> {
  const systemPrompt = `You are a social media hashtag expert.
Analyze the content and suggest ${request.count || 10} relevant hashtags.

${request.platform ? `Platform: ${request.platform}` : ''}

Consider:
- Mix of popular and niche hashtags
- Relevant to the content topic
- Trending when applicable
- Platform-specific best practices

Format as JSON array: ["hashtag1", "hashtag2", ...]
Don't include the # symbol in the hashtags.
Only output the JSON array, nothing else.`;

  const result = await callOpenRouter(
    config.ai.textModel,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: request.content },
    ],
    {
      maxTokens: 300,
      temperature: 0.7,
      responseFormat: { type: 'json_object' },
    }
  );

  if (result.success && typeof result.data === 'string') {
    try {
      result.data = JSON.parse(result.data);
    } catch {
      // Keep as string if parsing fails
    }
  }

  return result;
}

// Generate image from prompt
export async function generateImage(
  request: ImageGenerationRequest
): Promise<AIGenerationResult> {
  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/images/generations`,
      {
        model: config.ai.imageModel,
        prompt: request.prompt,
        n: request.count || 1,
        size: getImageSize(request.aspectRatio),
        style: request.style || 'vivid',
      },
      {
        headers: {
          Authorization: `Bearer ${config.ai.openRouterApiKey}`,
          'HTTP-Referer': config.frontendUrl,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data.data.map((img: { url: string }) => img.url),
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Image generation error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Image generation failed',
      };
    }
    throw error;
  }
}

function getImageSize(aspectRatio?: string): string {
  const sizes: Record<string, string> = {
    '1:1': '1024x1024',
    '16:9': '1792x1024',
    '9:16': '1024x1792',
    '4:3': '1024x768',
    '3:4': '768x1024',
  };
  return sizes[aspectRatio || '1:1'] || '1024x1024';
}

// Generate content calendar
export async function generateContentCalendar(
  workspaceId: string,
  options: {
    startDate: Date;
    days: number;
    postsPerDay: number;
    platforms: string[];
    topics: string[];
    tone?: string;
  }
): Promise<AIGenerationResult> {
  const systemPrompt = `You are a social media content strategist.
Generate a content calendar for ${options.days} days starting from ${options.startDate.toISOString().split('T')[0]}.

Requirements:
- ${options.postsPerDay} posts per day
- Platforms: ${options.platforms.join(', ')}
- Topics: ${options.topics.join(', ')}
${options.tone ? `- Tone: ${options.tone}` : ''}

For each post, provide:
- date (YYYY-MM-DD format)
- time (HH:MM format, suggest optimal posting times)
- platform
- topic
- content
- hashtags (array)

Output as JSON array.`;

  const result = await callOpenRouter(
    config.ai.textModel,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate content calendar for topics: ${options.topics.join(', ')}` },
    ],
    {
      maxTokens: 4000,
      temperature: 0.8,
      responseFormat: { type: 'json_object' },
    }
  );

  if (result.success && typeof result.data === 'string') {
    try {
      result.data = JSON.parse(result.data);
    } catch {
      // Keep as string if parsing fails
    }
  }

  return result;
}

// Analyze content sentiment
export async function analyzeContentSentiment(content: string): Promise<AIGenerationResult> {
  const systemPrompt = `Analyze the sentiment of the given social media content.
Provide:
- overall_sentiment: positive, negative, neutral, or mixed
- confidence: 0-1 score
- emotions: array of detected emotions
- suggestions: brief improvements if needed

Output as JSON.`;

  const result = await callOpenRouter(
    config.ai.textModel,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ],
    {
      maxTokens: 300,
      temperature: 0.3,
      responseFormat: { type: 'json_object' },
    }
  );

  if (result.success && typeof result.data === 'string') {
    try {
      result.data = JSON.parse(result.data);
    } catch {
      // Keep as string if parsing fails
    }
  }

  return result;
}

// Generate reply suggestions
export async function generateReplySuggestions(
  originalContent: string,
  context?: string
): Promise<AIGenerationResult> {
  const systemPrompt = `You are a social media community manager.
Generate 3 professional reply suggestions for the given content.

${context ? `Context: ${context}` : ''}

Provide varied responses:
1. Friendly and engaging
2. Professional and informative
3. Brief and conversational

Output as JSON array of strings.`;

  const result = await callOpenRouter(
    config.ai.textModel,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: originalContent },
    ],
    {
      maxTokens: 500,
      temperature: 0.7,
      responseFormat: { type: 'json_object' },
    }
  );

  if (result.success && typeof result.data === 'string') {
    try {
      result.data = JSON.parse(result.data);
    } catch {
      // Keep as string if parsing fails
    }
  }

  return result;
}

// Transcribe audio (using Whisper model)
export async function transcribeAudio(audioUrl: string): Promise<AIGenerationResult> {
  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/audio/transcriptions`,
      {
        model: config.ai.audioModel,
        file: audioUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${config.ai.openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data.text,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Transcription failed',
      };
    }
    throw error;
  }
}

// Track AI usage for workspace
export async function trackAIUsage(
  userId: string,
  type: 'text' | 'image' | 'audio',
  tokens: number
): Promise<void> {
  // This would be used to track usage for billing purposes
  await prisma.activityLog.create({
    data: {
      userId,
      action: `AI_${type.toUpperCase()}_GENERATION`,
      entityType: 'AI_USAGE',
      metadata: {
        type,
        tokens,
        timestamp: new Date().toISOString(),
      },
    },
  });
}

// Get AI usage stats for user
export async function getAIUsageStats(userId: string, startDate: Date, endDate: Date) {
  const logs = await prisma.activityLog.findMany({
    where: {
      userId,
      action: {
        startsWith: 'AI_',
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const stats = {
    text: { count: 0, tokens: 0 },
    image: { count: 0, tokens: 0 },
    audio: { count: 0, tokens: 0 },
  };

  logs.forEach((log) => {
    const metadata = log.metadata as Record<string, unknown>;
    const type = metadata?.type as string;
    const tokens = (metadata?.tokens as number) || 0;

    if (type in stats) {
      stats[type as keyof typeof stats].count++;
      stats[type as keyof typeof stats].tokens += tokens;
    }
  });

  return stats;
}
