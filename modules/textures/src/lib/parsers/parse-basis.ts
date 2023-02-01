/* eslint-disable indent */
import type {TextureLevel} from '@loaders.gl/schema';
import {loadBasisEncoderModule, loadBasisTrascoderModule} from './basis-module-loader';
import {GL_EXTENSIONS_CONSTANTS} from '../gl-extensions';
import {getSupportedGPUTextureFormats} from '../utils/texture-formats';
import {isKTX} from './parse-ktx';

export type BasisFormat =
  | 'etc1'
  | 'etc2'
  | 'bc1'
  | 'bc3'
  | 'bc4'
  | 'bc5'
  | 'bc7-m6-opaque-only'
  | 'bc7-m5'
  | 'pvrtc1-4-rgb'
  | 'pvrtc1-4-rgba'
  | 'astc-4x4'
  | 'atc-rgb'
  | 'atc-rgba-interpolated-alpha'
  | 'rgba32'
  | 'rgb565'
  | 'bgr565'
  | 'rgba4444';

type BasisOutputOptions = {
  basisFormat: number;
  compressed: boolean;
  format?: number;
};

const OutputFormat: Record<string, BasisOutputOptions> = {
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
 * @param data
 * @param options
 * @returns compressed texture data
 */
export default async function parseBasis(data: ArrayBuffer, options): Promise<TextureLevel[][]> {
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
 * @param BasisFile - initialized transcoder module
 * @param data
 * @param options
 * @returns compressed texture data
 */
function parseBasisFile(BasisFile, data, options): TextureLevel[][] {
  const basisFile = new BasisFile(new Uint8Array(data));

  try {
    if (!basisFile.startTranscoding()) {
      throw new Error('Failed to start basis transcoding');
    }

    const imageCount = basisFile.getNumImages();
    const images: TextureLevel[][] = [];

    for (let imageIndex = 0; imageIndex < imageCount; imageIndex++) {
      const levelsCount = basisFile.getNumLevels(imageIndex);
      const levels: TextureLevel[] = [];

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
 * @param basisFile
 * @param imageIndex
 * @param levelIndex
 * @param options
 * @returns compressed texture data
 */
function transcodeImage(basisFile, imageIndex, levelIndex, options): TextureLevel {
  const width = basisFile.getImageWidth(imageIndex, levelIndex);
  const height = basisFile.getImageHeight(imageIndex, levelIndex);

  // See https://github.com/BinomialLLC/basis_universal/pull/83
  const hasAlpha = basisFile.getHasAlpha(/* imageIndex, levelIndex */);

  // Check options for output format etc
  const {compressed, format, basisFormat} = getBasisOptions(options, hasAlpha);

  const decodedSize = basisFile.getImageTranscodedSizeInBytes(imageIndex, levelIndex, basisFormat);
  const decodedData = new Uint8Array(decodedSize);

  if (!basisFile.transcodeImage(decodedData, imageIndex, levelIndex, basisFormat, 0, 0)) {
    throw new Error('failed to start Basis transcoding');
  }

  return {
    // standard loaders.gl image category payload
    width,
    height,
    data: decodedData,
    compressed,
    format,

    // Additional fields
    // Add levelSize field.
    hasAlpha
  };
}

/**
 * Parse *.ktx2 file data
 * @param KTX2File
 * @param data
 * @param options
 * @returns compressed texture data
 */
function parseKTX2File(KTX2File, data: ArrayBuffer, options): TextureLevel[][] {
  const ktx2File = new KTX2File(new Uint8Array(data));

  try {
    if (!ktx2File.startTranscoding()) {
      throw new Error('failed to start KTX2 transcoding');
    }
    const levelsCount = ktx2File.getLevels();
    const levels: TextureLevel[] = [];

    for (let levelIndex = 0; levelIndex < levelsCount; levelIndex++) {
      levels.push(transcodeKTX2Image(ktx2File, levelIndex, options));
      break; // texture app can only show one level for some reason
    }

    return [levels];
  } finally {
    ktx2File.close();
    ktx2File.delete();
  }
}

/**
 * Parse the particular level image of a ktx2 file
 * @param ktx2File
 * @param levelIndex
 * @param options
 * @returns
 */
function transcodeKTX2Image(ktx2File, levelIndex: number, options): TextureLevel {
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
    throw new Error('Failed to transcode KTX2 image');
  }

  return {
    // standard loaders.gl image category payload
    width,
    height,
    data: decodedData,
    compressed,

    // Additional fields
    levelSize: decodedSize,
    hasAlpha: alphaFlag,
    format
  };
}

/**
 * Get BasisFormat by loader format option
 * @param options
 * @param hasAlpha
 * @returns BasisFormat data
 */
function getBasisOptions(options, hasAlpha: boolean): BasisOutputOptions {
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
export function selectSupportedBasisFormat():
  | BasisFormat
  | {
      alpha: BasisFormat;
      noAlpha: BasisFormat;
    } {
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
