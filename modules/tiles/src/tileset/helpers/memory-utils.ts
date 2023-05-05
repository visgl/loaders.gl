import {GLTF} from '@loaders.gl/gltf';

/**
 * Calculate the GPU memory used by a GLTF tile, for both buffer and texture memory
 * @param gltf - the gltf content of a GLTF tile
 * @returns - total memory usage in bytes
 */
export function getGltfMemoryUsage(gltf: GLTF) {
  let {images, bufferViews} = gltf;
  images = images || [];
  bufferViews = bufferViews || [];
  const imageBufferViews = images.map((i) => i.bufferView);
  bufferViews = bufferViews.filter((view) => !imageBufferViews.includes(view as any));

  let bufferMemory = bufferViews.reduce((acc, view) => acc + view.byteLength, 0);
  let textureMemory = images.reduce((acc, image) => {
    // @ts-ignore
    const {width, height} = (image as any).image;
    return acc + 4 * width * height;
  }, 0);
  return bufferMemory + textureMemory;
}
