export interface CompressionResult {
  data: string;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

/**
 * Compresses a base64 image using canvas API
 * @param base64 - The base64 encoded image
 * @param maxWidth - Maximum width in pixels (default 800)
 * @param quality - JPEG quality 0-1 (default 0.7)
 * @returns Promise with compression result
 */
export function compressImage(
  base64: string,
  maxWidth: number = 800,
  quality: number = 0.7
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const originalSize = Math.round((base64.length * 3) / 4);

    // If image is already small enough (under 100KB), return as-is
    if (originalSize < 100 * 1024) {
      resolve({
        data: base64,
        originalSize,
        compressedSize: originalSize,
        wasCompressed: false,
      });
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Try JPEG first (better compression for photos)
        let compressed = canvas.toDataURL('image/jpeg', quality);

        // If the original was PNG with transparency, check if JPEG is appropriate
        if (base64.includes('data:image/png')) {
          const pngCompressed = canvas.toDataURL('image/png');
          // Use PNG if it's not much larger, preserving transparency
          if (pngCompressed.length < compressed.length * 1.5) {
            compressed = pngCompressed;
          }
        }

        const compressedSize = Math.round((compressed.length * 3) / 4);

        // Only use compressed version if it's actually smaller
        if (compressedSize < originalSize) {
          resolve({
            data: compressed,
            originalSize,
            compressedSize,
            wasCompressed: true,
          });
        } else {
          resolve({
            data: base64,
            originalSize,
            compressedSize: originalSize,
            wasCompressed: false,
          });
        }
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = base64;
  });
}

/**
 * Formats bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculates compression percentage
 */
export function compressionPercent(original: number, compressed: number): number {
  if (original === 0) return 0;
  return Math.round(((original - compressed) / original) * 100);
}
