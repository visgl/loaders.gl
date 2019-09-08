export {default as ImageLoader, HTMLImageLoader, ImageBitmapLoader} from './image-loader';
export {default as ImageWriter} from './image-writer';

// UTILS
export {
  isImage,
  getImageMetadata,
  getImageMIMEType,
  getImageSize
} from './lib/metadata/get-image-metadata';

// EXPERIMENTAL V2.0
export {
  JPEGLoader as _JPEGLoader,
  PNGLoader as _PNGLoader,
  GIFLoader as _GIFLoader,
  BMPLoader as _BMPLoader,
  SVGLoader as _SVGLoader,
  ImageLoaders as _ImageLoaders
} from './image-loaders';

// DEPRECATED
export {loadImage} from './lib/parsers/parse-image-v1';

// Now possible to use ImageLoaders on arrayBuffer input
// Unpacks compressed image data into an HTML image
export function decodeImage(arrayBufferOrView, {mimeType = 'image/jpeg'}) {
  /* global window, Blob, Image */
  const blob = new Blob([arrayBufferOrView], {type: mimeType});
  const urlCreator = window.URL || window.webkitURL;
  const imageUrl = urlCreator.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = imageUrl;
    return image;
  });
}
