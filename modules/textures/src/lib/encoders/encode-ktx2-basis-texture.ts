// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {extractLoadLibraryOptions} from '@loaders.gl/worker-utils';
import type {BasisEncoderFormat, BasisImageData} from '../../basis-types';
import type {KTX2BasisWriterOptions} from '../../ktx2-basis-writer';
import {loadBasisEncoderModule} from '../parsers/basis-module-loader';

const BASIS_ENCODER_FORMATS: Record<BasisEncoderFormat, number> = {
  etc1s: 0,
  'uastc-ldr-4x4': 1,
  'uastc-hdr-4x4': 2,
  'astc-hdr-6x6': 3,
  'uastc-hdr-6x6': 4,
  'xuastc-ldr-4x4': 5,
  'xuastc-ldr-5x4': 6,
  'xuastc-ldr-5x5': 7,
  'xuastc-ldr-6x5': 8,
  'xuastc-ldr-6x6': 9,
  'xuastc-ldr-8x5': 10,
  'xuastc-ldr-8x6': 11,
  'xuastc-ldr-10x5': 12,
  'xuastc-ldr-10x6': 13,
  'xuastc-ldr-8x8': 14,
  'xuastc-ldr-10x8': 15,
  'xuastc-ldr-10x10': 16,
  'xuastc-ldr-12x10': 17,
  'xuastc-ldr-12x12': 18,
  'astc-ldr-4x4': 19,
  'astc-ldr-5x4': 20,
  'astc-ldr-5x5': 21,
  'astc-ldr-6x5': 22,
  'astc-ldr-6x6': 23,
  'astc-ldr-8x5': 24,
  'astc-ldr-8x6': 25,
  'astc-ldr-10x5': 26,
  'astc-ldr-10x6': 27,
  'astc-ldr-8x8': 28,
  'astc-ldr-10x8': 29,
  'astc-ldr-10x10': 30,
  'astc-ldr-12x10': 31,
  'astc-ldr-12x12': 32,
  xubc7: 33
};

const HDR_ENCODER_FORMATS = new Set<BasisEncoderFormat>([
  'uastc-hdr-4x4',
  'astc-hdr-6x6',
  'uastc-hdr-6x6'
]);

const ZSTD_ENCODER_FORMATS = new Set<BasisEncoderFormat>([
  'uastc-ldr-4x4',
  'uastc-hdr-4x4',
  'astc-hdr-6x6'
]);

const MINIMUM_OUTPUT_BYTE_LENGTH = 64 * 1024;
const MAXIMUM_OUTPUT_BYTE_LENGTH = 0x7fff_ffff;

/**
 * Encodes RGBA pixels to a Basis Universal KTX2 texture.
 * @param image - RGBA8, RGBA16F, or RGBA32F source pixels.
 * @param options - Basis writer and library-loading options.
 * @returns Encoded KTX2 bytes.
 */
export async function encodeKTX2BasisTexture(
  image: BasisImageData,
  options: KTX2BasisWriterOptions = {}
): Promise<ArrayBuffer> {
  const writerOptions = options['ktx2-basis-writer'] || {};
  const format = writerOptions.format || 'etc1s';
  const contentType = writerOptions.contentType || 'linear';
  const mipmaps = writerOptions.mipmaps || false;
  const zstd = writerOptions.zstd || false;
  const ldrToHdrNitMultiplier = writerOptions.ldrToHdrNitMultiplier ?? 100;

  validateWriterOptions(image, {
    format,
    contentType,
    quality: writerOptions.quality,
    effort: writerOptions.effort,
    zstd,
    ldrToHdrNitMultiplier
  });

  const {BasisEncoder} = await loadBasisEncoderModule(extractLoadLibraryOptions(options));
  const basisEncoder = new BasisEncoder();
  try {
    basisEncoder.setCreateKTX2File(true);
    applyContentPreset(basisEncoder, format, contentType);
    basisEncoder.setFormatModeAndQualityEffort(
      BASIS_ENCODER_FORMATS[format],
      writerOptions.quality ?? (format === 'etc1s' ? 50 : -1),
      writerOptions.effort ?? -1,
      true
    );
    basisEncoder.setMipGen(mipmaps);
    basisEncoder.setKTX2UASTCSupercompression(zstd);

    const sourceAccepted = HDR_ENCODER_FORMATS.has(format)
      ? setHDRSource(basisEncoder, image, contentType === 'srgb', ldrToHdrNitMultiplier)
      : basisEncoder.setSliceSourceImage(0, image.data, image.width, image.height, 0);
    if (!sourceAccepted) {
      throw new Error('Basis encoder rejected the source pixel buffer');
    }

    const outputByteLength = getOutputBufferByteLength(image.data.byteLength);
    const output = new Uint8Array(outputByteLength);
    const encodedByteLength = basisEncoder.encode(output);
    if (!encodedByteLength) {
      throw new Error(
        `Basis encoder failed to encode ${format}; the ${outputByteLength}-byte output buffer may be insufficient`
      );
    }
    if (encodedByteLength > output.byteLength) {
      throw new Error('Basis encoder reported an output larger than the supplied buffer');
    }
    return output.slice(0, encodedByteLength).buffer;
  } finally {
    basisEncoder.delete();
  }
}

type NormalizedWriterOptions = {
  format: BasisEncoderFormat;
  contentType: 'linear' | 'srgb' | 'normal-map';
  quality?: number;
  effort?: number;
  zstd: boolean;
  ldrToHdrNitMultiplier: number;
};

function validateWriterOptions(image: BasisImageData, options: NormalizedWriterOptions): void {
  if (
    !Number.isInteger(image.width) ||
    !Number.isInteger(image.height) ||
    image.width <= 0 ||
    image.height <= 0
  ) {
    throw new Error('Basis writer image dimensions must be positive integers');
  }
  if (
    options.quality !== undefined &&
    (!Number.isInteger(options.quality) || options.quality < 0 || options.quality > 100)
  ) {
    throw new Error('Basis writer quality must be an integer from 0 to 100');
  }
  if (
    options.effort !== undefined &&
    (!Number.isInteger(options.effort) || options.effort < 0 || options.effort > 10)
  ) {
    throw new Error('Basis writer effort must be an integer from 0 to 10');
  }
  if (!Number.isFinite(options.ldrToHdrNitMultiplier) || options.ldrToHdrNitMultiplier <= 0) {
    throw new Error('Basis writer ldrToHdrNitMultiplier must be greater than zero');
  }
  if (options.zstd && !ZSTD_ENCODER_FORMATS.has(options.format)) {
    throw new Error(
      `Basis writer format ${options.format} does not support Zstandard supercompression`
    );
  }

  const expectedElementCount = image.width * image.height * 4;
  if (image.data.length !== expectedElementCount) {
    throw new Error(
      `Basis writer expected ${expectedElementCount} RGBA elements, received ${image.data.length}`
    );
  }
  if (!HDR_ENCODER_FORMATS.has(options.format) && !isRGBA8Array(image.data)) {
    throw new Error(`Basis writer format ${options.format} requires Uint8Array RGBA pixels`);
  }
  if (HDR_ENCODER_FORMATS.has(options.format) && options.contentType === 'normal-map') {
    throw new Error('Basis HDR writer formats do not support normal-map content');
  }
  if (
    HDR_ENCODER_FORMATS.has(options.format) &&
    options.contentType === 'srgb' &&
    !isRGBA8Array(image.data)
  ) {
    throw new Error('sRGB-to-HDR conversion is only defined for Uint8Array RGBA pixels');
  }
}

function applyContentPreset(
  basisEncoder: any,
  format: BasisEncoderFormat,
  contentType: 'linear' | 'srgb' | 'normal-map'
): void {
  if (HDR_ENCODER_FORMATS.has(format)) {
    basisEncoder.setLinearPreset();
    basisEncoder.setSRGBOptions(false);
    return;
  }
  switch (contentType) {
    case 'srgb':
      basisEncoder.setSRGBPreset();
      basisEncoder.setSRGBOptions(true);
      break;
    case 'normal-map':
      basisEncoder.setNormalMapPreset();
      break;
    case 'linear':
    default:
      basisEncoder.setLinearPreset();
      basisEncoder.setSRGBOptions(false);
  }
}

function setHDRSource(
  basisEncoder: any,
  image: BasisImageData,
  convertSRGBToLinear: boolean,
  ldrToHdrNitMultiplier: number
): boolean {
  const imageType =
    image.data instanceof Uint16Array ? 0 : image.data instanceof Float32Array ? 1 : 7;
  return basisEncoder.setSliceSourceImageHDR(
    0,
    image.data,
    image.width,
    image.height,
    imageType,
    convertSRGBToLinear,
    ldrToHdrNitMultiplier
  );
}

function isRGBA8Array(data: BasisImageData['data']): data is Uint8Array | Uint8ClampedArray {
  return data instanceof Uint8Array || data instanceof Uint8ClampedArray;
}

function getOutputBufferByteLength(inputByteLength: number): number {
  const outputByteLength = Math.max(
    MINIMUM_OUTPUT_BYTE_LENGTH,
    inputByteLength * 2 + MINIMUM_OUTPUT_BYTE_LENGTH
  );
  if (!Number.isSafeInteger(outputByteLength) || outputByteLength > MAXIMUM_OUTPUT_BYTE_LENGTH) {
    throw new Error('Basis writer input is too large to allocate a safe output buffer');
  }
  return outputByteLength;
}
