/** @typedef {import('./extract-mipmap-images')} types */
/** @type types['extractMipmapImages'] */
export function extractMipmapImages(data, options) {
  const images = new Array(options.mipMapLevels);

  let levelWidth = options.width;
  let levelHeight = options.height;
  let offset = 0;

  for (let i = 0; i < options.mipMapLevels; ++i) {
    const levelSize = options.sizeFunction(levelWidth, levelHeight);
    images[i] = {
      compressed: true,
      format: options.internalFormat,
      data: new Uint8Array(data.buffer, data.byteOffset + offset, levelSize),
      width: levelWidth,
      height: levelHeight,
      levelSize
    };

    levelWidth = Math.max(1, levelWidth >> 1);
    levelHeight = Math.max(1, levelHeight >> 1);

    offset += levelSize;
  }
  return images;
}
