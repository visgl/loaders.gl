/** @typedef {import('./extract-mipmap-images')} types */
/** @type types['extractMipmapImages'] */
export function extractMipmapImages(data, options) {
  const images = new Array(options.mipMapLevels);

  let levelWidth = options.width;
  let levelHeight = options.height;
  let offset = 0;

  for (let i = 0; i < options.mipMapLevels; ++i) {
    const levelSize = getLevelSize(options, levelWidth, levelHeight, data, i);
    const levelData = getLevelData(data, i, offset, levelSize);

    images[i] = {
      compressed: true,
      format: options.internalFormat,
      data: levelData,
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

function getLevelData(data, index, offset, levelSize) {
  if (!Array.isArray(data)) {
    return new Uint8Array(data.buffer, data.byteOffset + offset, levelSize);
  }

  return data[index].levelData;
}

function getLevelSize(options, levelWidth, levelHeight, data, index) {
  if (!Array.isArray(data)) {
    return options.sizeFunction(levelWidth, levelHeight);
  }
  return options.sizeFunction(data[index]);
}
