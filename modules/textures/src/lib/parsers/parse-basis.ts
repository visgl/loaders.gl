// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
/* eslint-disable indent */
import type {TextureFormat, TextureLevel} from '@loaders.gl/schema';
import {extractLoadLibraryOptions} from '@loaders.gl/worker-utils';
import {loadBasisEncoderModule, loadBasisTranscoderModule} from './basis-module-loader';
import type {GLTextureFormat} from '../gl-types';
import {
  GL_COMPRESSED_RED_GREEN_RGTC2_EXT,
  GL_COMPRESSED_RED_RGTC1_EXT,
  GL_COMPRESSED_RGB_ATC_WEBGL,
  GL_COMPRESSED_RGB_ETC1_WEBGL,
  GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
  GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
  GL_COMPRESSED_RGBA8_ETC2_EAC,
  GL_COMPRESSED_RGBA_ASTC_4x4_KHR,
  GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL,
  GL_COMPRESSED_RGBA_BPTC_UNORM_EXT,
  GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
  GL_COMPRESSED_RGBA_S3TC_DXT5_EXT,
  GL_RGB565,
  GL_RGBA4,
  GL_RGBA8
} from '../gl-extensions';
import {detectSupportedTextureFormats} from '../utils/detect-supported-texture-formats';
import {isKTX} from './parse-ktx';

// TODO - circular type import
import type {BasisLoaderOptions} from '../../basis-loader';

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
  format?: GLTextureFormat;
  textureFormat?: TextureFormat;
};

let basisTranscodingLock: Promise<void> = Promise.resolve();

export const BASIS_FORMAT_TO_OUTPUT_OPTIONS: Record<BasisFormat, BasisOutputOptions> = {
  etc1: {
    basisFormat: 0,
    compressed: true,
    format: GL_COMPRESSED_RGB_ETC1_WEBGL,
    textureFormat: 'etc1-rgb-unorm-webgl'
  },
  etc2: {
    basisFormat: 1,
    compressed: true,
    format: GL_COMPRESSED_RGBA8_ETC2_EAC,
    textureFormat: 'etc2-rgba8unorm'
  },
  bc1: {
    basisFormat: 2,
    compressed: true,
    format: GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
    textureFormat: 'bc1-rgb-unorm-webgl'
  },
  bc3: {
    basisFormat: 3,
    compressed: true,
    format: GL_COMPRESSED_RGBA_S3TC_DXT5_EXT,
    textureFormat: 'bc3-rgba-unorm'
  },
  bc4: {
    basisFormat: 4,
    compressed: true,
    format: GL_COMPRESSED_RED_RGTC1_EXT,
    textureFormat: 'bc4-r-unorm'
  },
  bc5: {
    basisFormat: 5,
    compressed: true,
    format: GL_COMPRESSED_RED_GREEN_RGTC2_EXT,
    textureFormat: 'bc5-rg-unorm'
  },
  'bc7-m6-opaque-only': {
    basisFormat: 6,
    compressed: true,
    format: GL_COMPRESSED_RGBA_BPTC_UNORM_EXT,
    textureFormat: 'bc7-rgba-unorm'
  },
  'bc7-m5': {
    basisFormat: 7,
    compressed: true,
    format: GL_COMPRESSED_RGBA_BPTC_UNORM_EXT,
    textureFormat: 'bc7-rgba-unorm'
  },
  'pvrtc1-4-rgb': {
    basisFormat: 8,
    compressed: true,
    format: GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
    textureFormat: 'pvrtc-rgb4unorm-webgl'
  },
  'pvrtc1-4-rgba': {
    basisFormat: 9,
    compressed: true,
    format: GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
    textureFormat: 'pvrtc-rgba4unorm-webgl'
  },
  'astc-4x4': {
    basisFormat: 10,
    compressed: true,
    format: GL_COMPRESSED_RGBA_ASTC_4x4_KHR,
    textureFormat: 'astc-4x4-unorm'
  },
  'atc-rgb': {
    basisFormat: 11,
    compressed: true,
    format: GL_COMPRESSED_RGB_ATC_WEBGL,
    textureFormat: 'atc-rgb-unorm-webgl'
  },
  'atc-rgba-interpolated-alpha': {
    basisFormat: 12,
    compressed: true,
    format: GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL,
    textureFormat: 'atc-rgbai-unorm-webgl'
  },
  rgba32: {
    basisFormat: 13,
    compressed: false,
    format: GL_RGBA8,
    textureFormat: 'rgba8unorm'
  },
  rgb565: {
    basisFormat: 14,
    compressed: false,
    format: GL_RGB565,
    textureFormat: 'rgb565unorm-webgl'
  },
  bgr565: {
    basisFormat: 15,
    compressed: false,
    format: GL_RGB565,
    textureFormat: 'rgb565unorm-webgl'
  },
  rgba4444: {
    basisFormat: 16,
    compressed: false,
    format: GL_RGBA4,
    textureFormat: 'rgba4unorm-webgl'
  }
};

export const BASIS_FORMATS = Object.freeze(
  Object.keys(BASIS_FORMAT_TO_OUTPUT_OPTIONS) as BasisFormat[]
);

export type ParseBasisOptions = {
  format: 'auto' | BasisFormat | {alpha: BasisFormat; noAlpha: BasisFormat};
  containerFormat: 'auto' | 'ktx2' | 'basis';
  module: 'transcoder' | 'encoder';
  supportedTextureFormats?: TextureFormat[];
};

/**
 * Serializes access to the Basis transcoder so concurrent callers do not enter the non-reentrant
 * decoder path at the same time.
 * @param transcode - Transcode operation to run with exclusive access.
 * @returns The transcode result.
 */
export async function withBasisTranscodingLock<T>(transcode: () => Promise<T> | T): Promise<T> {
  const previousLock = basisTranscodingLock;
  let releaseLock!: () => void;

  basisTranscodingLock = new Promise((resolve) => {
    releaseLock = resolve;
  });

  await previousLock;

  try {
    return await transcode();
  } finally {
    releaseLock();
  }
}

/**
 * parse data with a Binomial Basis_Universal module
 * @param data
 * @param options
 * @returns compressed texture data
 */
// eslint-disable-next-line complexity
export async function parseBasis(
  data: ArrayBuffer,
  options: BasisLoaderOptions = {}
): Promise<TextureLevel[][]> {
  const loadLibraryOptions = extractLoadLibraryOptions(options);

  return await withBasisTranscodingLock(async () => {
    if (!options.basis?.containerFormat || options.basis.containerFormat === 'auto') {
      if (isKTX(data)) {
        const fileConstructors = await loadBasisEncoderModule(loadLibraryOptions);
        return parseKTX2File(fileConstructors.KTX2File, data, options);
      }
      const {BasisFile} = await loadBasisTranscoderModule(loadLibraryOptions);
      return parseBasisFile(BasisFile, data, options);
    }
    switch (options.basis.module) {
      case 'encoder':
        const fileConstructors = await loadBasisEncoderModule(loadLibraryOptions);
        switch (options.basis.containerFormat) {
          case 'ktx2':
            return parseKTX2File(fileConstructors.KTX2File, data, options);
          case 'basis':
          default:
            return parseBasisFile(fileConstructors.BasisFile, data, options);
        }
      case 'transcoder':
      default:
        const {BasisFile} = await loadBasisTranscoderModule(loadLibraryOptions);
        return parseBasisFile(BasisFile, data, options);
    }
  });
}

/**
 * Parse *.basis file data
 * @param BasisFile - initialized transcoder module
 * @param data
 * @param options
 * @returns compressed texture data
 */
function parseBasisFile(
  BasisFile,
  data: ArrayBuffer,
  options: BasisLoaderOptions
): TextureLevel[][] {
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
function transcodeImage(
  basisFile,
  imageIndex: number,
  levelIndex: number,
  options: BasisLoaderOptions
): TextureLevel {
  const width = basisFile.getImageWidth(imageIndex, levelIndex);
  const height = basisFile.getImageHeight(imageIndex, levelIndex);

  // See https://github.com/BinomialLLC/basis_universal/pull/83
  const hasAlpha = basisFile.getHasAlpha(/* imageIndex, levelIndex */);

  // Check options for output format etc
  const {compressed, format, basisFormat, textureFormat} = getBasisOptions(options, hasAlpha);

  const decodedSize = basisFile.getImageTranscodedSizeInBytes(imageIndex, levelIndex, basisFormat);
  const decodedData = new Uint8Array(decodedSize);

  if (!basisFile.transcodeImage(decodedData, imageIndex, levelIndex, basisFormat, 0, 0)) {
    throw new Error('failed to start Basis transcoding');
  }

  return {
    // standard loaders.gl image category payload
    shape: 'texture-level',
    width,
    height,
    data: decodedData,
    compressed,
    ...(format !== undefined ? {format} : {}),
    ...(textureFormat !== undefined ? {textureFormat} : {}),

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
function parseKTX2File(KTX2File, data: ArrayBuffer, options: BasisLoaderOptions): TextureLevel[][] {
  const ktx2File = new KTX2File(new Uint8Array(data));

  try {
    if (!ktx2File.startTranscoding()) {
      throw new Error('failed to start KTX2 transcoding');
    }
    const levelsCount = ktx2File.getLevels();
    const levels: TextureLevel[] = [];

    for (let levelIndex = 0; levelIndex < levelsCount; levelIndex++) {
      levels.push(transcodeKTX2Image(ktx2File, levelIndex, options));
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
function transcodeKTX2Image(
  ktx2File,
  levelIndex: number,
  options: BasisLoaderOptions
): TextureLevel {
  const {alphaFlag, height, width} = ktx2File.getImageLevelInfo(levelIndex, 0, 0);

  // Check options for output format etc
  const {compressed, format, basisFormat, textureFormat} = getBasisOptions(options, alphaFlag);

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
    shape: 'texture-level',
    width,
    height,
    data: decodedData,
    compressed,
    ...(format !== undefined ? {format} : {}),
    ...(textureFormat !== undefined ? {textureFormat} : {}),

    // Additional fields
    levelSize: decodedSize,
    hasAlpha: alphaFlag
  };
}

/**
 * Get BasisFormat by loader format option
 * @param options
 * @param hasAlpha
 * @returns BasisFormat data
 */
function getBasisOptions(options: BasisLoaderOptions, hasAlpha: boolean): BasisOutputOptions {
  let format = options.basis?.format || 'auto';
  if (format === 'auto') {
    format = options.basis?.supportedTextureFormats
      ? selectSupportedBasisFormat(options.basis.supportedTextureFormats)
      : selectSupportedBasisFormat();
  }
  if (typeof format === 'object') {
    format = hasAlpha ? format.alpha : format.noAlpha;
  }
  const normalizedFormat = format.toLowerCase() as BasisFormat;
  const basisOutputOptions = BASIS_FORMAT_TO_OUTPUT_OPTIONS[normalizedFormat];
  if (!basisOutputOptions) {
    throw new Error(`Unknown Basis format ${format}`);
  }
  return basisOutputOptions;
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
    };
export function selectSupportedBasisFormat(supportedTextureFormats?: Iterable<TextureFormat>):
  | BasisFormat
  | {
      alpha: BasisFormat;
      noAlpha: BasisFormat;
    };
export function selectSupportedBasisFormat(
  supportedTextureFormats: Iterable<TextureFormat> = detectSupportedTextureFormats()
): BasisFormat | {alpha: BasisFormat; noAlpha: BasisFormat} {
  const textureFormats = new Set(supportedTextureFormats);

  if (hasSupportedTextureFormat(textureFormats, ['astc-4x4-unorm', 'astc-4x4-unorm-srgb'])) {
    return 'astc-4x4';
  } else if (hasSupportedTextureFormat(textureFormats, ['bc7-rgba-unorm', 'bc7-rgba-unorm-srgb'])) {
    return {
      alpha: 'bc7-m5',
      noAlpha: 'bc7-m6-opaque-only'
    };
  } else if (
    hasSupportedTextureFormat(textureFormats, [
      'bc1-rgb-unorm-webgl',
      'bc1-rgb-unorm-srgb-webgl',
      'bc1-rgba-unorm',
      'bc1-rgba-unorm-srgb',
      'bc2-rgba-unorm',
      'bc2-rgba-unorm-srgb',
      'bc3-rgba-unorm',
      'bc3-rgba-unorm-srgb'
    ])
  ) {
    return {
      alpha: 'bc3',
      noAlpha: 'bc1'
    };
  } else if (
    hasSupportedTextureFormat(textureFormats, [
      'pvrtc-rgb4unorm-webgl',
      'pvrtc-rgba4unorm-webgl',
      'pvrtc-rgb2unorm-webgl',
      'pvrtc-rgba2unorm-webgl'
    ])
  ) {
    return {
      alpha: 'pvrtc1-4-rgba',
      noAlpha: 'pvrtc1-4-rgb'
    };
  } else if (
    hasSupportedTextureFormat(textureFormats, [
      'etc2-rgb8unorm',
      'etc2-rgb8unorm-srgb',
      'etc2-rgb8a1unorm',
      'etc2-rgb8a1unorm-srgb',
      'etc2-rgba8unorm',
      'etc2-rgba8unorm-srgb',
      'eac-r11unorm',
      'eac-r11snorm',
      'eac-rg11unorm',
      'eac-rg11snorm'
    ])
  ) {
    return 'etc2';
  } else if (textureFormats.has('etc1-rgb-unorm-webgl')) {
    return 'etc1';
  } else if (
    hasSupportedTextureFormat(textureFormats, [
      'atc-rgb-unorm-webgl',
      'atc-rgba-unorm-webgl',
      'atc-rgbai-unorm-webgl'
    ])
  ) {
    return {
      alpha: 'atc-rgba-interpolated-alpha',
      noAlpha: 'atc-rgb'
    };
  }
  return 'rgb565';
}

export function getSupportedBasisFormats(
  supportedTextureFormats: Iterable<TextureFormat> = detectSupportedTextureFormats()
): BasisFormat[] {
  const textureFormats = new Set(supportedTextureFormats);
  const basisFormats: BasisFormat[] = [];

  if (hasSupportedTextureFormat(textureFormats, ['astc-4x4-unorm', 'astc-4x4-unorm-srgb'])) {
    basisFormats.push('astc-4x4');
  }
  if (
    hasSupportedTextureFormat(textureFormats, [
      'bc1-rgb-unorm-webgl',
      'bc1-rgb-unorm-srgb-webgl',
      'bc1-rgba-unorm',
      'bc1-rgba-unorm-srgb',
      'bc2-rgba-unorm',
      'bc2-rgba-unorm-srgb',
      'bc3-rgba-unorm',
      'bc3-rgba-unorm-srgb'
    ])
  ) {
    basisFormats.push('bc1', 'bc3');
  }
  if (hasSupportedTextureFormat(textureFormats, ['bc4-r-unorm', 'bc4-r-snorm'])) {
    basisFormats.push('bc4');
  }
  if (hasSupportedTextureFormat(textureFormats, ['bc5-rg-unorm', 'bc5-rg-snorm'])) {
    basisFormats.push('bc5');
  }
  if (hasSupportedTextureFormat(textureFormats, ['bc7-rgba-unorm', 'bc7-rgba-unorm-srgb'])) {
    basisFormats.push('bc7-m5', 'bc7-m6-opaque-only');
  }
  if (
    hasSupportedTextureFormat(textureFormats, [
      'pvrtc-rgb4unorm-webgl',
      'pvrtc-rgba4unorm-webgl',
      'pvrtc-rgb2unorm-webgl',
      'pvrtc-rgba2unorm-webgl'
    ])
  ) {
    basisFormats.push('pvrtc1-4-rgb', 'pvrtc1-4-rgba');
  }
  if (
    hasSupportedTextureFormat(textureFormats, [
      'etc2-rgb8unorm',
      'etc2-rgb8unorm-srgb',
      'etc2-rgb8a1unorm',
      'etc2-rgb8a1unorm-srgb',
      'etc2-rgba8unorm',
      'etc2-rgba8unorm-srgb',
      'eac-r11unorm',
      'eac-r11snorm',
      'eac-rg11unorm',
      'eac-rg11snorm'
    ])
  ) {
    basisFormats.push('etc2');
  }
  if (textureFormats.has('etc1-rgb-unorm-webgl')) {
    basisFormats.push('etc1');
  }
  if (
    hasSupportedTextureFormat(textureFormats, [
      'atc-rgb-unorm-webgl',
      'atc-rgba-unorm-webgl',
      'atc-rgbai-unorm-webgl'
    ])
  ) {
    basisFormats.push('atc-rgb', 'atc-rgba-interpolated-alpha');
  }

  basisFormats.push('rgba32', 'rgb565', 'bgr565', 'rgba4444');
  return basisFormats;
}

function hasSupportedTextureFormat(
  supportedTextureFormats: Set<TextureFormat>,
  candidateTextureFormats: TextureFormat[]
): boolean {
  return candidateTextureFormats.some((textureFormat) =>
    supportedTextureFormats.has(textureFormat)
  );
}
