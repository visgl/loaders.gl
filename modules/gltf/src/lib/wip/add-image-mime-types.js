/*
import GLTFScenegraph from './gltf-scenegraph';

// Checks if a binary buffer is a recognized image format (PNG, JPG, GIF, ...)
export function addImageMIMETypes(gltfData) {
  const gltfScenegraph = new GLTFScenegraph(gltfData);

  for (const image of gltfScenegraph.json.images || []) {
    if ('bufferView' in image && !image.mimeType) {
      const imageData = getBufferView(image.bufferView);
      const sizeAndType = getImageSize(imageData);
      if (sizeAndType) {
        const {mimeType} = sizeAndType;
        image.mimeType = mimeType;
      }
    }
  }
}
*/
