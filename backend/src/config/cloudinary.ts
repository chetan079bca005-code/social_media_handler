import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    transformation?: Record<string, any>[];
    format?: string;
  } = {}
): Promise<{
  url: string;
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
  resourceType: string;
  thumbnailUrl?: string;
  duration?: number;
}> {
  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, any> = {
      folder: options.folder || 'socialhub',
      resource_type: options.resourceType || 'auto',
      ...(options.publicId && { public_id: options.publicId }),
      ...(options.transformation && { transformation: options.transformation }),
      ...(options.format && { format: options.format }),
      // Generate thumbnails for images/videos
      eager: options.resourceType !== 'raw'
        ? [{ width: 400, height: 400, crop: 'limit', quality: 'auto', format: 'webp' }]
        : undefined,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error.message);
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned no result'));
        }

        resolve({
          url: result.secure_url || result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          resourceType: result.resource_type,
          thumbnailUrl: result.eager?.[0]?.secure_url || undefined,
          duration: result.duration || undefined,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload a file from a URL to Cloudinary
 */
export async function uploadUrlToCloudinary(
  url: string,
  options: {
    folder?: string;
    publicId?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
  } = {}
): Promise<{
  url: string;
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
}> {
  const result = await cloudinary.uploader.upload(url, {
    folder: options.folder || 'socialhub',
    resource_type: options.resourceType || 'auto',
    ...(options.publicId && { public_id: options.publicId }),
    eager: [{ width: 400, height: 400, crop: 'limit', quality: 'auto', format: 'webp' }],
  });

  return {
    url: result.secure_url || result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Delete a file from Cloudinary by public_id
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === 'ok';
  } catch (error: any) {
    console.error('Cloudinary delete error:', error.message);
    return false;
  }
}

/**
 * Get an optimized URL with transformations
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  } = {}
): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop || 'limit',
        quality: options.quality || 'auto',
        fetch_format: options.format || 'auto',
      },
    ],
    secure: true,
  });
}

export { cloudinary };
