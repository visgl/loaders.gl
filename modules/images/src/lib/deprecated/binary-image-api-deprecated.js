import {getBinaryImageMetadata} from '../category-api/binary-image-api';

// Supported image types are PNG, JPEG, GIF and BMP.
export function isBinaryImage(arrayBuffer, mimeType) {
  const metadata = getBinaryImageMetadata(arrayBuffer);
  if (mimeType) {
    return Boolean(metadata && metadata.mimeType === mimeType);
  }
  // return true if any known type
  return Boolean(metadata);
}

// Sniffs the contents of a file to attempt to deduce the image type
export function getBinaryImageMIMEType(arrayBuffer) {
  const metadata = getBinaryImageMetadata(arrayBuffer);
  return metadata ? metadata.mimeType : null;
}

export function getBinaryImageSize(arrayBuffer, mimeType = null) {
  const metadata = getBinaryImageMetadata(arrayBuffer);

  if (metadata) {
    return {
      width: metadata.width,
      height: metadata.height
    };
  }

  mimeType = mimeType || 'unknown';
  throw new Error(`invalid image data for type: ${mimeType}`);
}
