import axios from 'axios';
import { config } from '../config';
import prisma from '../config/database';
import { cacheDel } from '../config/redis';

// ─── Types ──────────────────────────────────────────────────────────
export interface VideoGenerationRequest {
  prompt: string;
  imageUrl: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: 4 | 6 | 8;
  resolution?: '720p' | '1080p';
}

export interface Text2VideoRequest {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: 4 | 6 | 8;
  resolution?: '720p' | '1080p';
}

export interface VideoGenerationResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────
const VEO_BASE_URL = 'https://api.skycoding.ai';
const VEO_MODEL = 'google/veo-3.1/image-to-video';

const T2V_BASE_URL = 'https://api.apifree.ai';
const T2V_MODEL = 'google/veo-3.1-fast/text-to-video';

function getVideoApiKey(): string {
  // Use the dedicated Veo key; do NOT fall back to the text/image AI key
  // since those target different APIs (OpenRouter/ApiFree, not SkyCoding)
  return process.env.VEO_API_KEY || '';
}

function getT2VApiKey(): string {
  return process.env.text2video_MODEL || '';
}

// ─── Pre-validate that the image URL is reachable ───────────────────
async function validateImageUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const resp = await axios.head(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const contentType = resp.headers['content-type'] || '';
    if (!contentType.startsWith('image/')) {
      return {
        valid: false,
        error: `The URL does not point to an image (content-type: ${contentType}). Please use a direct image URL ending in .jpg, .png, or .webp.`,
      };
    }
    return { valid: true };
  } catch (err: any) {
    if (err.response?.status === 403 || err.response?.status === 401) {
      return {
        valid: false,
        error: 'The image URL is access-restricted (403/401). The AI service cannot download it. Please use a publicly accessible image URL.',
      };
    }
    if (err.response?.status === 404) {
      return { valid: false, error: 'The image URL returned 404 Not Found. Please check the URL.' };
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return { valid: false, error: 'Cannot reach the image host. Please check the URL.' };
    }
    // Some servers block HEAD but allow GET — let it through and let the API validate.
    return { valid: true };
  }
}

// ─── Submit video generation request ────────────────────────────────
export async function submitVideoGeneration(
  request: VideoGenerationRequest
): Promise<VideoGenerationResult> {
  const apiKey = getVideoApiKey();

  if (!apiKey) {
    return {
      success: false,
      error: 'Video AI service not configured. Please set VEO_API_KEY in your environment variables.',
    };
  }

  // Pre-validate the image URL is publicly accessible
  const imgCheck = await validateImageUrl(request.imageUrl);
  if (!imgCheck.valid) {
    return { success: false, error: imgCheck.error };
  }

  try {
    const response = await axios.post(
      `${VEO_BASE_URL}/v1/video/submit`,
      {
        aspect_ratio: request.aspectRatio || '16:9',
        duration: request.duration || 4,
        image: request.imageUrl,
        model: VEO_MODEL,
        prompt: request.prompt,
        resolution: request.resolution || '720p',
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const data = response.data;

    if (data?.code !== 200 || !data?.resp_data?.request_id) {
      // Translate cryptic API errors into user-friendly messages
      const rawMsg = data?.error?.message || data?.code_msg || '';
      const errorCode = data?.error?.code || '';
      let friendlyError = 'Video submission failed.';

      if (errorCode === 'insufficient_balance' || rawMsg.includes('Insufficient balance')) {
        friendlyError =
          'Your Veo API key has insufficient balance. Please top up your account at api.skycoding.ai to continue generating videos.';
      } else if (rawMsg.includes('parameters format error')) {
        friendlyError =
          'The Veo API could not process this image. The image URL may be blocked, ' +
          'redirect-protected, or in an unsupported format. Try using a direct ' +
          'publicly-accessible image URL (e.g. from Unsplash, Imgur, or Cloudinary).';
      } else if (rawMsg) {
        friendlyError = rawMsg;
      }

      return { success: false, error: friendlyError };
    }

    return {
      success: true,
      data: {
        requestId: data.resp_data.request_id,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Video submission error:', error.response?.data);
      const rawMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.code_msg ||
        '';
      const errorCode = error.response?.data?.error?.code || '';
      let friendlyError = 'Video submission failed.';

      if (errorCode === 'insufficient_balance' || rawMsg.includes('Insufficient balance')) {
        friendlyError =
          'Your Veo API key has insufficient balance. Please top up your account at api.skycoding.ai to continue generating videos.';
      } else if (rawMsg.includes('parameters format error')) {
        friendlyError =
          'The Veo API rejected this request. This usually means the image URL is ' +
          'not directly accessible. Try a publicly-hosted image (Unsplash, Imgur, Cloudinary).';
      } else if (rawMsg) {
        friendlyError = rawMsg;
      }
      return { success: false, error: friendlyError };
    }
    throw error;
  }
}

// ─── Check video generation status ──────────────────────────────────
export async function checkVideoStatus(
  requestId: string,
  options?: { baseUrl?: string; apiKey?: string }
): Promise<VideoGenerationResult> {
  const apiKey = options?.apiKey || getVideoApiKey();
  const baseUrl = options?.baseUrl || VEO_BASE_URL;

  if (!apiKey) {
    return {
      success: false,
      error: 'Video AI service not configured.',
    };
  }

  try {
    const response = await axios.get(
      `${baseUrl}/v1/video/${requestId}/status`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 15000,
      }
    );

    const data = response.data;

    if (data?.code !== 200) {
      return {
        success: false,
        error: data?.code_msg || 'Status check failed.',
      };
    }

    const rawStatus = (data?.resp_data?.status || '').toLowerCase();
    const successStatuses = ['success', 'completed', 'done', 'finished'];
    const errorStatuses = ['error', 'failed', 'failure'];

    let status = rawStatus;
    if (successStatuses.includes(rawStatus)) status = 'success';
    else if (errorStatuses.includes(rawStatus)) status = 'error';
    else status = 'processing';

    return {
      success: true,
      data: {
        status,
        time: data?.resp_data?.time || null,
        error: data?.resp_data?.error || null,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Video status error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.code_msg || 'Status check failed.',
      };
    }
    throw error;
  }
}

// ─── Get video generation result ────────────────────────────────────
export async function getVideoResult(
  requestId: string,
  options?: { baseUrl?: string; apiKey?: string }
): Promise<VideoGenerationResult> {
  const apiKey = options?.apiKey || getVideoApiKey();
  const baseUrl = options?.baseUrl || VEO_BASE_URL;

  if (!apiKey) {
    return {
      success: false,
      error: 'Video AI service not configured.',
    };
  }

  try {
    const response = await axios.get(
      `${baseUrl}/v1/video/${requestId}/result`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 30000,
      }
    );

    const data = response.data;

    if (data?.code !== 200) {
      return {
        success: false,
        error: data?.code_msg || 'Video result retrieval failed.',
      };
    }

    const rawStatus = (data?.resp_data?.status || '').toLowerCase();
    const successStatuses = ['success', 'completed', 'done', 'finished'];
    const finalStatus = successStatuses.includes(rawStatus) ? 'success' : rawStatus;

    const videoList = data?.resp_data?.video_list || [];

    // Some API endpoints return success before video_list is populated.
    // Retry the result a few times with a small delay if list is empty.
    if (finalStatus === 'success' && videoList.length === 0) {
      for (let retry = 0; retry < 3; retry++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const retryResp = await axios.get(
            `${baseUrl}/v1/video/${requestId}/result`,
            {
              headers: { Authorization: `Bearer ${apiKey}` },
              timeout: 30000,
            }
          );
          const retryList = retryResp.data?.resp_data?.video_list || [];
          if (retryList.length > 0) {
            return {
              success: true,
              data: {
                status: 'success',
                videoList: retryList,
                usage: retryResp.data?.resp_data?.usage || data?.resp_data?.usage || null,
                error: null,
              },
            };
          }
        } catch {
          // ignore retry errors
        }
      }
    }

    return {
      success: true,
      data: {
        status: finalStatus,
        videoList,
        usage: data?.resp_data?.usage || null,
        error: data?.resp_data?.error || null,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Video result error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.code_msg || 'Video result retrieval failed.',
      };
    }
    throw error;
  }
}

// ─── Save generated video to Cloudinary + DB ────────────────────────
export async function saveGeneratedVideo(params: {
  workspaceId: string;
  userId: string;
  videoUrl: string;
  prompt: string;
  modelName?: string;
}): Promise<{ cloudinaryUrl: string; publicId?: string }> {
  const { workspaceId, userId, videoUrl, prompt, modelName } = params;

  const { isCloudinaryConfigured, uploadUrlToCloudinary } = await import(
    '../config/cloudinary'
  );

  let finalUrl = videoUrl;
  let cloudinaryPublicId: string | undefined;
  let fileSize = 0;

  if (isCloudinaryConfigured() && videoUrl.startsWith('http')) {
    try {
      const result = await uploadUrlToCloudinary(videoUrl, {
        folder: `socialhub/${workspaceId}/ai-videos`,
        resourceType: 'video',
      });
      finalUrl = result.secureUrl;
      cloudinaryPublicId = result.publicId;
      fileSize = result.bytes;
    } catch (err: any) {
      console.warn(
        'Cloudinary upload of AI video failed, keeping original URL:',
        err.message
      );
    }
  }

  // Derive filename
  let filename = 'ai-video.mp4';
  try {
    const parsed = new URL(finalUrl);
    const name = parsed.pathname.split('/').pop();
    if (name && name.length > 0) filename = name;
  } catch {
    // keep default
  }

  await prisma.mediaFile.create({
    data: {
      workspaceId,
      uploadedById: userId,
      filename,
      originalName: filename,
      mimeType: 'video/mp4',
      size: fileSize,
      url: finalUrl,
      tags: ['ai-generated', 'ai-video'],
      metadata: {
        aiGenerated: true,
        prompt,
        model: modelName || VEO_MODEL,
        source: modelName?.includes('text-to-video') ? 'veo-3.1-t2v' : 'veo-3.1',
        ...(cloudinaryPublicId ? { cloudinaryPublicId } : {}),
      },
    },
  });

  // Invalidate media cache
  await cacheDel(`media:workspace:${workspaceId}:*`);

  return { cloudinaryUrl: finalUrl, publicId: cloudinaryPublicId };
}

// ─── Submit Text-to-Video generation request ────────────────────────
export async function submitText2Video(
  request: Text2VideoRequest
): Promise<VideoGenerationResult> {
  const apiKey = getT2VApiKey();

  if (!apiKey) {
    return {
      success: false,
      error: 'Text-to-Video AI service not configured. Please set text2video_MODEL in your environment variables.',
    };
  }

  try {
    const response = await axios.post(
      `${T2V_BASE_URL}/v1/video/submit`,
      {
        aspect_ratio: request.aspectRatio || '16:9',
        duration: request.duration || 4,
        model: T2V_MODEL,
        prompt: request.prompt,
        resolution: request.resolution || '720p',
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const data = response.data;

    if (data?.code !== 200 || !data?.resp_data?.request_id) {
      const rawMsg = data?.error?.message || data?.code_msg || '';
      const errorCode = data?.error?.code || '';
      let friendlyError = 'Text-to-Video submission failed.';

      if (errorCode === 'insufficient_balance' || rawMsg.includes('Insufficient balance')) {
        friendlyError =
          'Your Text-to-Video API key has insufficient balance. Please top up your account at api.apifree.ai to continue generating videos.';
      } else if (rawMsg) {
        friendlyError = rawMsg;
      }

      return { success: false, error: friendlyError };
    }

    return {
      success: true,
      data: {
        requestId: data.resp_data.request_id,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('T2V submission error:', error.response?.data);
      const rawMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.code_msg ||
        '';
      const errorCode = error.response?.data?.error?.code || '';
      let friendlyError = 'Text-to-Video submission failed.';

      if (errorCode === 'insufficient_balance' || rawMsg.includes('Insufficient balance')) {
        friendlyError =
          'Your Text-to-Video API key has insufficient balance. Please top up at api.apifree.ai.';
      } else if (rawMsg) {
        friendlyError = rawMsg;
      }
      return { success: false, error: friendlyError };
    }
    throw error;
  }
}

// ─── Check T2V video status (uses apifree.ai) ──────────────────────
export async function checkT2VStatus(
  requestId: string
): Promise<VideoGenerationResult> {
  return checkVideoStatus(requestId, {
    baseUrl: T2V_BASE_URL,
    apiKey: getT2VApiKey(),
  });
}

// ─── Get T2V video result (uses apifree.ai) ─────────────────────────
export async function getT2VResult(
  requestId: string
): Promise<VideoGenerationResult> {
  return getVideoResult(requestId, {
    baseUrl: T2V_BASE_URL,
    apiKey: getT2VApiKey(),
  });
}

// ─── Get video history ──────────────────────────────────────────────
export async function getVideoHistory(workspaceId: string) {
  const videos = await prisma.mediaFile.findMany({
    where: {
      workspaceId,
      tags: { has: 'ai-video' },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return videos.map((v) => ({
    id: v.id,
    url: v.url,
    createdAt: v.createdAt,
    metadata: v.metadata,
  }));
}
