import {loadBasisEncoderModule, loadBasisTrascoderModule} from './basis-module-loader';
import {GL_EXTENSIONS_CONSTANTS} from '../gl-extensions';
import {getSupportedGPUTextureFormats} from '../utils/texture-formats';
import {isKTX} from './parse-ktx';

const OutputFormat = {
  etc1: {
    basisFormat: 0,
    compressed: true,
    format: GL_EXTENSIONS_CONSTANTS.COMPRESSED_RGB_ETC1_WEBGL
  },
  etc2: {basisFormat: 1, compressed: true},
  bc1: {
    basisFormat: 2,
    compressed: true,
    format: GL_EXTENSIONS_CONSTANTS.COMPRESSED_RGB_S3TC_DXT1_EXT
  },
  bc3: {
    basisFormat: 3,
    compressed: true,
    format: GL_EXTENSIONS_CONSTANTS.COMPRESSED_RGBA_S3TC_DXT5_EXT
  },
  bc4: {basisFormat: 4, compressed: true},
  bc5: {basisFormat: 5, compressed: true},
  'bc7-m6-opaque-only': {basisFormat: 6, compressed: true},
  'bc7-m5': {basisFormat: 7, compressed: true},
  'pvrtc1-4-rgb': {
    basisFormat: 8,
    compressed: true,
    format: GL_EXTENSIONS_CONSTANTS.COMPRESSED_RGB_PVRTC_4BPPV1_IMG
  },
  'pvrtc1-4-rgba': {
    basisFormat: 9,
    compressed: true,
    format: GL_EXTENSIONS_CONSTANTS.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG
  },
  'astc-4x4': {
    basisFormat: 10,
    compressed: true,
    format: GL_EXTENSIONS_CONSTANTS.COMPRESSED_RGBA_ASTC_4X4_KHR
  },
  'atc-rgb': {basisFormat: 11, compressed: true},
  'atc-rgba-interpolated-alpha': {basisFormat: 12, compressed: true},
  rgba32: {basisFormat: 13, compressed: false},
  rgb565: {basisFormat: 14, compressed: false},
  bgr565: {basisFormat: 15, compressed: false},
  rgba4444: {basisFormat: 16, compressed: false}
};

/**
 * parse data with a Binomial Basis_Universal module
 * @param {ArrayBuffer} data
 * @param {*} options
 * @returns compressed texture data
 */
export default async function parseBasis(data, options) {
  if (options.basis.containerFormat === 'auto') {
    if (isKTX(data)) {
      const fileConstructors = await loadBasisEncoderModule(options);
      return parseKTX2File(fileConstructors.KTX2File, data, options);
    }
    const {BasisFile} = await loadBasisTrascoderModule(options);
    return parseBasisFile(BasisFile, data, options);
  }
  switch (options.basis.module) {
    case 'encoder':
      const fileConstructors = await loadBasisEncoderModule(options);
      switch (options.basis.containerFormat) {
        case 'ktx2':
          return parseKTX2File(fileConstructors.KTX2File, data, options);
        case 'basis':
        default:
          return parseBasisFile(fileConstructors.BasisFile, data, options);
      }
    case 'transcoder':
    default:
      const {BasisFile} = await loadBasisTrascoderModule(options);
      return parseBasisFile(BasisFile, data, options);
  }
}

/**
 * Parse *.basis file data
 * @param {*} BasisFile - initialized transcoder module
 * @param {*} data
 * @param {*} options
 * @returns compressed texture data
 */
function parseBasisFile(BasisFile, data, options) {
  const basisFile = new BasisFile(new Uint8Array(data));

  try {
    if (!basisFile.startTranscoding()) {
      return null;
    }

    const imageCount = basisFile.getNumImages();
    const images: any[] = [];

    for (let imageIndex = 0; imageIndex < imageCount; imageIndex++) {
      const levelsCount = basisFile.getNumLevels(imageIndex);
      const levels: any[] = [];

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

/**
 * Parse the particular level image of a basis file
 * @param {*} basisFile
 * @param {*} imageIndex
 * @param {*} levelIndex
 * @param {*} options
 * @returns compressed texture data
 */
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
    // Add levelSize field.
    hasAlpha,
    format
  };
}

/**
 * Parse *.ktx2 file data
 * @param {*} KTX2File
 * @param {*} data
 * @param {*} options
 * @returns compressed texture data
 */
function parseKTX2File(KTX2File, data, options) {
  const ktx2File = new KTX2File(new Uint8Array(data));

  try {
    if (!ktx2File.startTranscoding()) {
      return null;
    }
    const levelsCount = ktx2File.getLevels();
    const levels: any[] = [];

    for (let levelIndex = 0; levelIndex < levelsCount; levelIndex++) {
      levels.push(transcodeKTX2Image(ktx2File, levelIndex, options));
      break; // texture app can only show one level for some reason
    }

    return levels;
  } finally {
    ktx2File.close();
    ktx2File.delete();
  }
}

/**
 * Parse the particular level image of a ktx2 file
 * @param {*} ktx2File
 * @param {*} levelIndex
 * @param {*} options
 * @returns
 */
function transcodeKTX2Image(ktx2File, levelIndex, options) {
  const {alphaFlag, height, width} = ktx2File.getImageLevelInfo(levelIndex, 0, 0);

  // Check options for output format etc
  const {compressed, format, basisFormat} = getBasisOptions(options, alphaFlag);

  const decodedSize = ktx2File.getImageTranscodedSizeInBytes(
    levelIndex,
    0 /* layerIndex */,
    0 /* faceIndex */,
    basisFormat
  );
  const decodedData = new Uint8Array(decodedSize);

  if (
    !ktx2File.transcodeImage(
      decodedData,
      levelIndex,
      0 /* layerIndex */,
      0 /* faceIndex */,
      basisFormat,
      0,
      -1 /* channel0 */,
      -1 /* channel1 */
    )
  ) {
    return null;
  }

  return {
    // standard loaders.gl image category payload
    width,
    height,
    data: decodedData,
    compressed,

    // Additional fields
    // Add levelSize field.
    alphaFlag,
    format
  };
}

/**
 * Get BasisFormat by loader format option
 * @param {*} options
 * @param {*} hasAlpha
 * @returns BasisFormat data
 */
function getBasisOptions(options, hasAlpha) {
  let format = options && options.basis && options.basis.format;
  if (format === 'auto') {
    format = selectSupportedBasisFormat();
  }
  if (typeof format === 'object') {
    format = hasAlpha ? format.alpha : format.noAlpha;
  }
  format = format.toLowerCase();
  return OutputFormat[format];
}

/**
 * Select transcode format from the list of supported formats
 * @returns key for OutputFormat map
 */
export function selectSupportedBasisFormat() {
  const supportedFormats = getSupportedGPUTextureFormats();
  if (supportedFormats.has('astc')) {
    return 'astc-4x4';
  } else if (supportedFormats.has('dxt')) {
    return {
      alpha: 'bc3',
      noAlpha: 'bc1'
    };
  } else if (supportedFormats.has('pvrtc')) {
    return {
      alpha: 'pvrtc1-4-rgba',
      noAlpha: 'pvrtc1-4-rgb'
    };
  } else if (supportedFormats.has('etc1')) {
    return 'etc1';
  } else if (supportedFormats.has('etc2')) {
    return 'etc2';
  }
  return 'rgb565';
}
