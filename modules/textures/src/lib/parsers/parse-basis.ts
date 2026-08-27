// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import type {TextureFormat, TextureLevel} from '@loaders.gl/schema';
import {extractLoadLibraryOptions} from '@loaders.gl/worker-utils';
import type {
  BasisASTCBlockSize,
  BasisCodec,
  BasisFormat,
  BasisLoaderOptions,
  BasisTextureInfo
} from '../../basis-types';
import type {GLTextureFormat} from '../gl-types';
import {
  GL_COMPRESSED_R11_EAC,
  GL_COMPRESSED_RED_GREEN_RGTC2_EXT,
  GL_COMPRESSED_RED_RGTC1_EXT,
  GL_COMPRESSED_RG11_EAC,
  GL_COMPRESSED_RGB_ATC_WEBGL,
  GL_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
  GL_COMPRESSED_RGB_ETC1_WEBGL,
  GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
  GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
  GL_COMPRESSED_RGBA8_ETC2_EAC,
  GL_COMPRESSED_RGBA_ASTC_10x10_KHR,
  GL_COMPRESSED_RGBA_ASTC_10x5_KHR,
  GL_COMPRESSED_RGBA_ASTC_10x6_KHR,
  GL_COMPRESSED_RGBA_ASTC_10x8_KHR,
  GL_COMPRESSED_RGBA_ASTC_12x10_KHR,
  GL_COMPRESSED_RGBA_ASTC_12x12_KHR,
  GL_COMPRESSED_RGBA_ASTC_4x4_KHR,
  GL_COMPRESSED_RGBA_ASTC_5x4_KHR,
  GL_COMPRESSED_RGBA_ASTC_5x5_KHR,
  GL_COMPRESSED_RGBA_ASTC_6x5_KHR,
  GL_COMPRESSED_RGBA_ASTC_6x6_KHR,
  GL_COMPRESSED_RGBA_ASTC_8x5_KHR,
  GL_COMPRESSED_RGBA_ASTC_8x6_KHR,
  GL_COMPRESSED_RGBA_ASTC_8x8_KHR,
  GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL,
  GL_COMPRESSED_RGBA_BPTC_UNORM_EXT,
  GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
  GL_COMPRESSED_RGBA_S3TC_DXT5_EXT,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
  GL_COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT,
  GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT,
  GL_COMPRESSED_SRGB_S3TC_DXT1_EXT,
  GL_RGB565,
  GL_RGB9_E5,
  GL_RGBA4,
  GL_RGBA8,
  GL_RGBA16F,
  GL_SRGB8_ALPHA8
} from '../gl-extensions';
import {selectSupportedBasisFormat} from '../utils/basis-format-utils';
import {loadBasisTranscoderModule} from './basis-module-loader';
import {isKTX} from './parse-ktx';

type BasisOutputOptions = {
  basisFormat: number;
  compressed: boolean;
  format: GLTextureFormat;
  textureFormat: TextureFormat;
  srgbFormat?: GLTextureFormat;
  srgbTextureFormat?: TextureFormat;
  dataType?: 'uint16' | 'uint32';
};

type BasisTranscoderModule = {
  BasisFile: new (data: Uint8Array) => any;
  KTX2File: new (data: Uint8Array) => any;
  isFormatSupported?: (sourceFormat: number, targetFormat: number) => boolean;
};

const ASTC_OUTPUTS: Record<BasisASTCBlockSize, BasisOutputOptions> = {
  '4x4': createASTCOutput(
    10,
    GL_COMPRESSED_RGBA_ASTC_4x4_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
    '4x4'
  ),
  '5x4': createASTCOutput(
    28,
    GL_COMPRESSED_RGBA_ASTC_5x4_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
    '5x4'
  ),
  '5x5': createASTCOutput(
    29,
    GL_COMPRESSED_RGBA_ASTC_5x5_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
    '5x5'
  ),
  '6x5': createASTCOutput(
    30,
    GL_COMPRESSED_RGBA_ASTC_6x5_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
    '6x5'
  ),
  '6x6': createASTCOutput(
    31,
    GL_COMPRESSED_RGBA_ASTC_6x6_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
    '6x6'
  ),
  '8x5': createASTCOutput(
    32,
    GL_COMPRESSED_RGBA_ASTC_8x5_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
    '8x5'
  ),
  '8x6': createASTCOutput(
    33,
    GL_COMPRESSED_RGBA_ASTC_8x6_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
    '8x6'
  ),
  '8x8': createASTCOutput(
    36,
    GL_COMPRESSED_RGBA_ASTC_8x8_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
    '8x8'
  ),
  '10x5': createASTCOutput(
    34,
    GL_COMPRESSED_RGBA_ASTC_10x5_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
    '10x5'
  ),
  '10x6': createASTCOutput(
    35,
    GL_COMPRESSED_RGBA_ASTC_10x6_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
    '10x6'
  ),
  '10x8': createASTCOutput(
    37,
    GL_COMPRESSED_RGBA_ASTC_10x8_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
    '10x8'
  ),
  '10x10': createASTCOutput(
    38,
    GL_COMPRESSED_RGBA_ASTC_10x10_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
    '10x10'
  ),
  '12x10': createASTCOutput(
    39,
    GL_COMPRESSED_RGBA_ASTC_12x10_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
    '12x10'
  ),
  '12x12': createASTCOutput(
    40,
    GL_COMPRESSED_RGBA_ASTC_12x12_KHR,
    GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR,
    '12x12'
  )
};

/** Basis output target metadata keyed by public format name. */
export const BASIS_FORMAT_TO_OUTPUT_OPTIONS: Record<BasisFormat, BasisOutputOptions> = {
  etc1: compressedOutput(0, GL_COMPRESSED_RGB_ETC1_WEBGL, 'etc1-rgb-unorm-webgl'),
  etc2: {
    ...compressedOutput(1, GL_COMPRESSED_RGBA8_ETC2_EAC, 'etc2-rgba8unorm'),
    srgbFormat: GL_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
    srgbTextureFormat: 'etc2-rgba8unorm-srgb'
  },
  bc1: {
    ...compressedOutput(2, GL_COMPRESSED_RGB_S3TC_DXT1_EXT, 'bc1-rgb-unorm-webgl'),
    srgbFormat: GL_COMPRESSED_SRGB_S3TC_DXT1_EXT,
    srgbTextureFormat: 'bc1-rgb-unorm-srgb-webgl'
  },
  bc3: {
    ...compressedOutput(3, GL_COMPRESSED_RGBA_S3TC_DXT5_EXT, 'bc3-rgba-unorm'),
    srgbFormat: GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT,
    srgbTextureFormat: 'bc3-rgba-unorm-srgb'
  },
  bc4: compressedOutput(4, GL_COMPRESSED_RED_RGTC1_EXT, 'bc4-r-unorm'),
  bc5: compressedOutput(5, GL_COMPRESSED_RED_GREEN_RGTC2_EXT, 'bc5-rg-unorm'),
  bc7: {
    ...compressedOutput(6, GL_COMPRESSED_RGBA_BPTC_UNORM_EXT, 'bc7-rgba-unorm'),
    srgbFormat: GL_COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT,
    srgbTextureFormat: 'bc7-rgba-unorm-srgb'
  },
  'pvrtc1-4-rgb': compressedOutput(8, GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG, 'pvrtc-rgb4unorm-webgl'),
  'pvrtc1-4-rgba': compressedOutput(
    9,
    GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
    'pvrtc-rgba4unorm-webgl'
  ),
  'astc-4x4': ASTC_OUTPUTS['4x4'],
  'astc-5x4': ASTC_OUTPUTS['5x4'],
  'astc-5x5': ASTC_OUTPUTS['5x5'],
  'astc-6x5': ASTC_OUTPUTS['6x5'],
  'astc-6x6': ASTC_OUTPUTS['6x6'],
  'astc-8x5': ASTC_OUTPUTS['8x5'],
  'astc-8x6': ASTC_OUTPUTS['8x6'],
  'astc-8x8': ASTC_OUTPUTS['8x8'],
  'astc-10x5': ASTC_OUTPUTS['10x5'],
  'astc-10x6': ASTC_OUTPUTS['10x6'],
  'astc-10x8': ASTC_OUTPUTS['10x8'],
  'astc-10x10': ASTC_OUTPUTS['10x10'],
  'astc-12x10': ASTC_OUTPUTS['12x10'],
  'astc-12x12': ASTC_OUTPUTS['12x12'],
  'atc-rgb': compressedOutput(11, GL_COMPRESSED_RGB_ATC_WEBGL, 'atc-rgb-unorm-webgl'),
  'atc-rgba-interpolated-alpha': compressedOutput(
    12,
    GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL,
    'atc-rgbai-unorm-webgl'
  ),
  rgba32: uncompressedOutput(13, GL_RGBA8, 'rgba8unorm', GL_SRGB8_ALPHA8, 'rgba8unorm-srgb'),
  rgb565: uncompressedOutput(14, GL_RGB565, 'rgb565unorm-webgl'),
  bgr565: uncompressedOutput(15, GL_RGB565, 'rgb565unorm-webgl'),
  rgba4444: uncompressedOutput(16, GL_RGBA4, 'rgba4unorm-webgl'),
  'eac-r11': compressedOutput(20, GL_COMPRESSED_R11_EAC, 'eac-r11unorm'),
  'eac-rg11': compressedOutput(21, GL_COMPRESSED_RG11_EAC, 'eac-rg11unorm'),
  bc6h: compressedOutput(22, GL_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT, 'bc6h-rgb-ufloat'),
  'astc-hdr-4x4': compressedOutput(23, GL_COMPRESSED_RGBA_ASTC_4x4_KHR, 'astc-4x4-unorm'),
  rgba16f: {...uncompressedOutput(25, GL_RGBA16F, 'rgba16float'), dataType: 'uint16'},
  rgb9e5: {...uncompressedOutput(26, GL_RGB9_E5, 'rgb9e5ufloat'), dataType: 'uint32'},
  'astc-hdr-6x6': compressedOutput(27, GL_COMPRESSED_RGBA_ASTC_6x6_KHR, 'astc-6x6-unorm')
};

/** All public Basis output target names. */
export const BASIS_FORMATS = Object.freeze(
  Object.keys(BASIS_FORMAT_TO_OUTPUT_OPTIONS) as BasisFormat[]
);

let basisTranscodingLock: Promise<void> = Promise.resolve();

/**
 * Serializes access to the non-reentrant Basis transcoder.
 * @param transcode - Transcode operation to run with exclusive access.
 * @returns Result of the transcode operation.
 */
export async function withBasisTranscodingLock<T>(transcode: () => Promise<T> | T): Promise<T> {
  const previousLock = basisTranscodingLock;
  let releaseLock!: () => void;
  basisTranscodingLock = new Promise(resolve => {
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
 * Parses and transcodes Basis or Basis-backed KTX2 data.
 * @param data - Encoded texture bytes.
 * @param options - Basis loader options.
 * @returns Mip chains grouped by image, or by KTX2 layer and face.
 */
export async function parseBasis(
  data: ArrayBuffer,
  options: BasisLoaderOptions = {}
): Promise<TextureLevel[][]> {
  return await withBasisTranscodingLock(async () => {
    const module = (await loadBasisTranscoderModule(
      extractLoadLibraryOptions(options)
    )) as BasisTranscoderModule;
    const containerFormat = options.basis?.containerFormat || 'auto';
    const isKTX2 = containerFormat === 'ktx2' || (containerFormat === 'auto' && isKTX(data));

    if (isKTX2) {
      if (!module.KTX2File) {
        throw new Error('The injected Basis transcoder module does not provide KTX2File');
      }
      return parseKTX2File(module, data, options);
    }
    return parseBasisFile(module, data, options);
  });
}

function parseBasisFile(
  module: BasisTranscoderModule,
  data: ArrayBuffer,
  options: BasisLoaderOptions
): TextureLevel[][] {
  const basisFile = new module.BasisFile(new Uint8Array(data));
  try {
    const source = getSourceInfo(basisFile, false);
    if (!basisFile.startTranscoding()) {
      throw new Error('Failed to start Basis transcoding');
    }
    const images: TextureLevel[][] = [];
    for (let imageIndex = 0; imageIndex < basisFile.getNumImages(); imageIndex++) {
      const levels: TextureLevel[] = [];
      for (let levelIndex = 0; levelIndex < basisFile.getNumLevels(imageIndex); levelIndex++) {
        const width = basisFile.getImageWidth(imageIndex, levelIndex);
        const height = basisFile.getImageHeight(imageIndex, levelIndex);
        levels.push(
          transcodeLevel(
            basisFile,
            source,
            width,
            height,
            options,
            basisFormat =>
              basisFile.getImageTranscodedSizeInBytes(imageIndex, levelIndex, basisFormat),
            (output, basisFormat) =>
              basisFile.transcodeImage(output, imageIndex, levelIndex, basisFormat, 0, 0)
          )
        );
      }
      images.push(levels);
    }
    return images;
  } finally {
    basisFile.close();
    basisFile.delete();
  }
}

function parseKTX2File(
  module: BasisTranscoderModule,
  data: ArrayBuffer,
  options: BasisLoaderOptions
): TextureLevel[][] {
  const ktx2File = new module.KTX2File(new Uint8Array(data));
  try {
    if (!ktx2File.isValid()) {
      throw new Error('Invalid KTX2 texture');
    }
    const header = ktx2File.getHeader();
    if (header.pixelDepth > 0) {
      throw new Error('BasisLoader does not support 3D KTX2 textures');
    }
    const source = getSourceInfo(ktx2File, true);
    if (!ktx2File.startTranscoding()) {
      throw new Error('Failed to start KTX2 transcoding');
    }

    const layers = Math.max(1, ktx2File.getLayers());
    const faces = Math.max(1, ktx2File.getFaces());
    const images: TextureLevel[][] = [];
    for (let layerIndex = 0; layerIndex < layers; layerIndex++) {
      for (let faceIndex = 0; faceIndex < faces; faceIndex++) {
        const levels: TextureLevel[] = [];
        for (let levelIndex = 0; levelIndex < ktx2File.getLevels(); levelIndex++) {
          const levelInfo = ktx2File.getImageLevelInfo(levelIndex, layerIndex, faceIndex);
          levels.push(
            transcodeLevel(
              ktx2File,
              {...source, hasAlpha: Boolean(levelInfo.alphaFlag)},
              levelInfo.width,
              levelInfo.height,
              options,
              basisFormat =>
                ktx2File.getImageTranscodedSizeInBytes(
                  levelIndex,
                  layerIndex,
                  faceIndex,
                  basisFormat
                ),
              (output, basisFormat) =>
                ktx2File.transcodeImage(
                  output,
                  levelIndex,
                  layerIndex,
                  faceIndex,
                  basisFormat,
                  0,
                  -1,
                  -1
                )
            )
          );
        }
        images.push(levels);
      }
    }
    return images;
  } finally {
    ktx2File.close();
    ktx2File.delete();
  }
}

function transcodeLevel(
  file: any,
  source: BasisTextureInfo,
  width: number,
  height: number,
  options: BasisLoaderOptions,
  getSize: (basisFormat: number) => number,
  transcode: (output: Uint8Array | Uint16Array | Uint32Array, basisFormat: number) => boolean
): TextureLevel {
  const outputOptions = getBasisOptions(options, source);
  validateBasisTarget(source, getSelectedFormat(options, source));
  const decodedSize = getSize(outputOptions.basisFormat);
  const decodedData = createOutputArray(decodedSize, outputOptions.dataType);
  if (!transcode(decodedData, outputOptions.basisFormat)) {
    throw new Error(`Failed to transcode Basis texture to ${getSelectedFormat(options, source)}`);
  }

  const useSRGB = source.isSRGB && outputOptions.srgbTextureFormat;
  return {
    shape: 'texture-level',
    width,
    height,
    data: decodedData,
    compressed: outputOptions.compressed,
    format: useSRGB ? outputOptions.srgbFormat || outputOptions.format : outputOptions.format,
    textureFormat: useSRGB ? outputOptions.srgbTextureFormat : outputOptions.textureFormat,
    levelSize: decodedSize,
    hasAlpha: source.hasAlpha
  };
}

function validateBasisTarget(source: BasisTextureInfo, target: BasisFormat): void {
  const hdrTarget =
    target === 'bc6h' ||
    target === 'rgba16f' ||
    target === 'rgb9e5' ||
    target.startsWith('astc-hdr-');
  if (source.isHDR !== hdrTarget) {
    throw new Error(`Basis source codec ${source.codec} cannot be transcoded to ${target}`);
  }
  if (source.codec === 'xubc7' && target !== 'bc7' && target !== 'rgba32') {
    throw new Error(`Basis source codec ${source.codec} cannot be transcoded to ${target}`);
  }
}

function getBasisOptions(
  options: BasisLoaderOptions,
  source: BasisTextureInfo
): BasisOutputOptions {
  const selectedFormat = getSelectedFormat(options, source);
  const outputOptions = BASIS_FORMAT_TO_OUTPUT_OPTIONS[selectedFormat];
  if (!outputOptions) {
    throw new Error(`Unknown Basis format ${selectedFormat}`);
  }
  return outputOptions;
}

function getSelectedFormat(options: BasisLoaderOptions, source: BasisTextureInfo): BasisFormat {
  let format = options.basis?.format || 'auto';
  if (format === 'auto') {
    format = selectSupportedBasisFormat(
      options.basis?.supportedTextureFormats,
      source,
      options.basis?.supportedTextureFeatures
    );
  }
  if (typeof format === 'object') {
    format = source.hasAlpha ? format.alpha : format.noAlpha;
  }
  return format.toLowerCase() as BasisFormat;
}

function getSourceInfo(file: any, isKTX2: boolean): BasisTextureInfo {
  const basisTextureFormat = file.getBasisTexFormat();
  const codec = BASIS_TEXTURE_FORMAT_TO_CODEC[basisTextureFormat];
  if (!codec) {
    throw new Error(`Unsupported Basis source texture format ${basisTextureFormat}`);
  }
  return {
    codec,
    isHDR: Boolean(file.isHDR()),
    isSRGB: isKTX2 ? Boolean(file.isSRGB()) : false,
    hasAlpha: Boolean(file.getHasAlpha()),
    blockWidth: file.getBlockWidth(),
    blockHeight: file.getBlockHeight()
  };
}

const BASIS_TEXTURE_FORMAT_TO_CODEC: Record<number, BasisCodec> = {
  0: 'etc1s',
  1: 'uastc-ldr-4x4',
  2: 'uastc-hdr-4x4',
  3: 'astc-hdr-6x6',
  4: 'uastc-hdr-6x6',
  5: 'xuastc-ldr-4x4',
  6: 'xuastc-ldr-5x4',
  7: 'xuastc-ldr-5x5',
  8: 'xuastc-ldr-6x5',
  9: 'xuastc-ldr-6x6',
  10: 'xuastc-ldr-8x5',
  11: 'xuastc-ldr-8x6',
  12: 'xuastc-ldr-10x5',
  13: 'xuastc-ldr-10x6',
  14: 'xuastc-ldr-8x8',
  15: 'xuastc-ldr-10x8',
  16: 'xuastc-ldr-10x10',
  17: 'xuastc-ldr-12x10',
  18: 'xuastc-ldr-12x12',
  19: 'astc-ldr-4x4',
  20: 'astc-ldr-5x4',
  21: 'astc-ldr-5x5',
  22: 'astc-ldr-6x5',
  23: 'astc-ldr-6x6',
  24: 'astc-ldr-8x5',
  25: 'astc-ldr-8x6',
  26: 'astc-ldr-10x5',
  27: 'astc-ldr-10x6',
  28: 'astc-ldr-8x8',
  29: 'astc-ldr-10x8',
  30: 'astc-ldr-10x10',
  31: 'astc-ldr-12x10',
  32: 'astc-ldr-12x12',
  33: 'xubc7'
};

function createOutputArray(
  byteLength: number,
  dataType?: 'uint16' | 'uint32'
): Uint8Array | Uint16Array | Uint32Array {
  if (dataType === 'uint16') {
    return new Uint16Array(byteLength / Uint16Array.BYTES_PER_ELEMENT);
  }
  if (dataType === 'uint32') {
    return new Uint32Array(byteLength / Uint32Array.BYTES_PER_ELEMENT);
  }
  return new Uint8Array(byteLength);
}

function compressedOutput(
  basisFormat: number,
  format: GLTextureFormat,
  textureFormat: TextureFormat
): BasisOutputOptions {
  return {basisFormat, compressed: true, format, textureFormat};
}

function uncompressedOutput(
  basisFormat: number,
  format: GLTextureFormat,
  textureFormat: TextureFormat,
  srgbFormat?: GLTextureFormat,
  srgbTextureFormat?: TextureFormat
): BasisOutputOptions {
  return {basisFormat, compressed: false, format, textureFormat, srgbFormat, srgbTextureFormat};
}

function createASTCOutput(
  basisFormat: number,
  format: GLTextureFormat,
  srgbFormat: GLTextureFormat,
  blockSize: BasisASTCBlockSize
): BasisOutputOptions {
  return {
    ...compressedOutput(basisFormat, format, `astc-${blockSize}-unorm`),
    srgbFormat,
    srgbTextureFormat: `astc-${blockSize}-unorm-srgb`
  };
}
