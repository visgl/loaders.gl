type HTMLImageLoadOptions = {
  image?: {
    decode?: boolean;
  };
  imagebitmap?: ImageBitmapOptions & Record<string, unknown>;
};

import {getBlobOrSVGDataUrl} from './svg-utils';

// Parses html image from array buffer
export async function parseToImage(
  arrayBuffer: ArrayBuffer,
  options?: HTMLImageLoadOptions,
  url?: string
): Promise<HTMLImageElement> {
  // Note: image parsing requires conversion to Blob (for createObjectURL).
  // Potentially inefficient for not using `response.blob()` (and for File / Blob inputs)...
  // But presumably not worth adding 'blob' flag to loader objects?

  const blobOrDataUrl = getBlobOrSVGDataUrl(arrayBuffer, url);
  const URL = self.URL || self.webkitURL;
  const objectUrl = typeof blobOrDataUrl !== 'string' && URL.createObjectURL(blobOrDataUrl);
  try {
    return await loadToImage(objectUrl || (blobOrDataUrl as string), options);
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

async function loadToImage(url: string, options?: HTMLImageLoadOptions): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;

  if (options?.image?.decode && image.decode) {
    await image.decode();
    return image;
  }

  // Create a promise that tracks onload/onerror callbacks
  return await new Promise((resolve, reject) => {
    try {
      image.onload = () => resolve(image);
      image.onerror = error => {
        const message = error instanceof Error ? error.message : 'error';
        reject(new Error(message));
      };
    } catch (error) {
      reject(error);
    }
  });
}
