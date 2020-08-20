import {loadBasisModule} from './basis-module-loader';
import {GL} from '../gl-constants';

const OutputFormat = {
  etc1: {basisFormat: 0, compressed: true},
  etc2: {basisFormat: 1, compressed: true},
  bc1: {basisFormat: 2, compressed: true, format: GL.COMPRESSED_RGB_S3TC_DXT1_EXT},
  bc3: {basisFormat: 3, compressed: true, format: GL.COMPRESSED_RGBA_S3TC_DXT5_EXT},
  bc4: {basisFormat: 4, compressed: true},
  bc5: {basisFormat: 5, compressed: true},
  'bc7-m6-opaque-only': {basisFormat: 6, compressed: true},
  'bc7-m5': {basisFormat: 7, compressed: true},
  'pvrtc1-4-rgb': {basisFormat: 8, compressed: true},
  'pvrtc1-4-rgba': {basisFormat: 9, compressed: true},
  'astc-4x4': {basisFormat: 10, compressed: true},
  'atc-rgb': {basisFormat: 11, compressed: true},
  'atc-rgba-interpolated-alpha': {basisFormat: 12, compressed: true},
  rgba32: {basisFormat: 13, compressed: false},
  rgb565: {basisFormat: 14, compressed: false},
  bgr565: {basisFormat: 15, compressed: false},
  rgba4444: {basisFormat: 16, compressed: false}
};

export default async function parseBasis(data, options) {
  const {BasisFile} = await loadBasisModule(options);
  const basisFile = new BasisFile(new Uint8Array(data));

  try {
    if (!basisFile.startTranscoding()) {
      return null;
    }

    const imageCount = basisFile.getNumImages();
    const images = [];

    for (let imageIndex = 0; imageIndex < imageCount; imageIndex++) {
      const levelsCount = basisFile.getNumLevels(imageIndex);
      const levels = [];

      for (let levelIndex = 0; levelIndex < levelsCount; levelIndex++) {
        levels.push(transcodeImage(basisFile, imageIndex, levelIndex, options));
      }

      images.push(levels);
    }

    return images;
  } finally {
    basisFile.close();
    basisFile.delete();
  }
}

function getBasisOptions(options, hasAlpha) {
  let format = options && options.basis && options.basis.format;
  if (typeof format === 'object') {
    format = hasAlpha ? format.alpha : format.noAlpha;
  }

  format = format.toLowerCase();
  return OutputFormat[format];
}

function transcodeImage(basisFile, imageIndex, levelIndex, options) {
  const width = basisFile.getImageWidth(imageIndex, levelIndex);
  const height = basisFile.getImageHeight(imageIndex, levelIndex);

  // See https://github.com/BinomialLLC/basis_universal/pull/83
  const hasAlpha = basisFile.getHasAlpha(/* imageIndex, levelIndex */);

  // Check options for output format etc
  const {compressed, format, basisFormat} = getBasisOptions(options, hasAlpha);

  const decodedSize = basisFile.getImageTranscodedSizeInBytes(imageIndex, levelIndex, basisFormat);
  const decodedData = new Uint8Array(decodedSize);

  if (!basisFile.transcodeImage(decodedData, imageIndex, levelIndex, basisFormat, 0, 0)) {
    return null;
  }

  return {
    // standard loaders.gl image category payload
    width,
    height,
    data: decodedData,
    compressed,

    // Additional fields
    hasAlpha,
    format
  };
}
