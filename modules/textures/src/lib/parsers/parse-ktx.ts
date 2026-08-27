// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextureLevel} from '@loaders.gl/schema';
import {extractMipmapImages} from '../utils/extract-mipmap-images';
import {mapVkFormatToTextureFormat} from '../utils/ktx-format-helper';

const KTX2_IDENTIFIER = new Uint8Array([
  0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a
]);
const KTX2_HEADER_BYTE_LENGTH = 80;
const KTX2_LEVEL_INDEX_ENTRY_BYTE_LENGTH = 24;
const KTX2_SUPERCOMPRESSION_NONE = 0;

type KTX2Level = {
  levelData: Uint8Array;
  uncompressedByteLength: number;
};

type KTX2Container = {
  vkFormat: number;
  pixelWidth: number;
  pixelHeight: number;
  pixelDepth: number;
  layerCount: number;
  faceCount: number;
  levelCount: number;
  supercompressionScheme: number;
  levels: KTX2Level[];
};

/**
 * Tests whether an ArrayBuffer begins with the KTX2 identifier.
 * @param data - Candidate KTX2 bytes.
 * @returns Whether the KTX2 identifier is present.
 */
export function isKTX(data: ArrayBuffer): boolean {
  if (data.byteLength < KTX2_IDENTIFIER.byteLength) {
    return false;
  }
  const bytes = new Uint8Array(data, 0, KTX2_IDENTIFIER.byteLength);
  return KTX2_IDENTIFIER.every((value, index) => bytes[index] === value);
}

/**
 * Parses native, non-supercompressed KTX2 texture levels.
 * BasisLZ and Zstandard KTX2 data must be decoded with BasisLoader instead.
 * @param arrayBuffer - KTX2 container bytes.
 * @returns Native GPU texture mip levels.
 */
export function parseKTX(arrayBuffer: ArrayBuffer): TextureLevel[] {
  const ktx2 = readKTX2Container(arrayBuffer);
  if (ktx2.pixelDepth > 0) {
    throw new Error('CompressedTextureLoader does not support 3D KTX2 textures');
  }
  if (ktx2.supercompressionScheme !== KTX2_SUPERCOMPRESSION_NONE) {
    throw new Error(
      `KTX2 supercompression scheme ${ktx2.supercompressionScheme} requires BasisLoader`
    );
  }
  if (ktx2.vkFormat === 0) {
    throw new Error('KTX2 vkFormat is undefined; decode this texture with BasisLoader');
  }
  const textureFormat = mapVkFormatToTextureFormat(ktx2.vkFormat);
  if (!textureFormat) {
    throw new Error(`Unsupported KTX2 Vulkan format ${ktx2.vkFormat}`);
  }

  return extractMipmapImages(ktx2.levels, {
    mipMapLevels: ktx2.levelCount,
    width: ktx2.pixelWidth,
    height: ktx2.pixelHeight,
    sizeFunction: (level: KTX2Level): number => level.uncompressedByteLength,
    textureFormat
  });
}

/**
 * Reads and bounds-checks the KTX2 header and level index.
 * @param arrayBuffer - KTX2 container bytes.
 * @returns Validated container metadata and zero-copy level views.
 */
export function readKTX2Container(arrayBuffer: ArrayBuffer): KTX2Container {
  if (!isKTX(arrayBuffer)) {
    throw new Error('Invalid KTX2 identifier');
  }
  if (arrayBuffer.byteLength < KTX2_HEADER_BYTE_LENGTH) {
    throw new Error('Truncated KTX2 header');
  }

  const dataView = new DataView(arrayBuffer);
  const levelCount = Math.max(1, dataView.getUint32(40, true));
  const levelIndexByteLength = safeMultiply(
    levelCount,
    KTX2_LEVEL_INDEX_ENTRY_BYTE_LENGTH,
    'KTX2 level index'
  );
  assertRange(
    KTX2_HEADER_BYTE_LENGTH,
    levelIndexByteLength,
    arrayBuffer.byteLength,
    'KTX2 level index'
  );

  const container: KTX2Container = {
    vkFormat: dataView.getUint32(12, true),
    pixelWidth: dataView.getUint32(20, true),
    pixelHeight: dataView.getUint32(24, true),
    pixelDepth: dataView.getUint32(28, true),
    layerCount: dataView.getUint32(32, true),
    faceCount: dataView.getUint32(36, true),
    levelCount,
    supercompressionScheme: dataView.getUint32(44, true),
    levels: []
  };

  if (container.pixelWidth === 0 || container.pixelHeight === 0) {
    throw new Error('KTX2 texture dimensions must be non-zero');
  }
  if (container.faceCount !== 1 && container.faceCount !== 6) {
    throw new Error(`Invalid KTX2 face count ${container.faceCount}`);
  }

  assertOptionalRange(
    dataView.getUint32(48, true),
    dataView.getUint32(52, true),
    arrayBuffer.byteLength,
    'KTX2 data format descriptor'
  );
  assertOptionalRange(
    dataView.getUint32(56, true),
    dataView.getUint32(60, true),
    arrayBuffer.byteLength,
    'KTX2 key/value data'
  );
  assertOptionalRange(
    readUint64(dataView, 64, 'KTX2 supercompression global data offset'),
    readUint64(dataView, 72, 'KTX2 supercompression global data length'),
    arrayBuffer.byteLength,
    'KTX2 supercompression global data'
  );

  for (let levelIndex = 0; levelIndex < levelCount; levelIndex++) {
    const entryOffset = KTX2_HEADER_BYTE_LENGTH + levelIndex * KTX2_LEVEL_INDEX_ENTRY_BYTE_LENGTH;
    const byteOffset = readUint64(dataView, entryOffset, `KTX2 level ${levelIndex} offset`);
    const byteLength = readUint64(dataView, entryOffset + 8, `KTX2 level ${levelIndex} length`);
    const uncompressedByteLength = readUint64(
      dataView,
      entryOffset + 16,
      `KTX2 level ${levelIndex} uncompressed length`
    );
    assertRange(byteOffset, byteLength, arrayBuffer.byteLength, `KTX2 level ${levelIndex}`);
    container.levels.push({
      levelData: new Uint8Array(arrayBuffer, byteOffset, byteLength),
      uncompressedByteLength
    });
  }
  return container;
}

function readUint64(dataView: DataView, byteOffset: number, label: string): number {
  const low = dataView.getUint32(byteOffset, true);
  const high = dataView.getUint32(byteOffset + 4, true);
  const value = high * 0x1_0000_0000 + low;
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} exceeds JavaScript's safe integer range`);
  }
  return value;
}

function safeMultiply(left: number, right: number, label: string): number {
  const result = left * right;
  if (!Number.isSafeInteger(result)) {
    throw new Error(`${label} size exceeds JavaScript's safe integer range`);
  }
  return result;
}

function assertOptionalRange(
  byteOffset: number,
  byteLength: number,
  containerByteLength: number,
  label: string
): void {
  if (byteLength > 0) {
    assertRange(byteOffset, byteLength, containerByteLength, label);
  }
}

function assertRange(
  byteOffset: number,
  byteLength: number,
  containerByteLength: number,
  label: string
): void {
  if (
    !Number.isSafeInteger(byteOffset) ||
    !Number.isSafeInteger(byteLength) ||
    byteOffset < 0 ||
    byteLength < 0
  ) {
    throw new Error(`${label} has an invalid byte range`);
  }
  const end = byteOffset + byteLength;
  if (!Number.isSafeInteger(end) || end > containerByteLength) {
    throw new Error(`${label} is outside the KTX2 container`);
  }
}
