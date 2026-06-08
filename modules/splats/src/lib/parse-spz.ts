// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GZipCompression, ZstdCompression} from '@loaders.gl/compression';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {GaussianSplats, SplatsLoaderOptions} from '../types';
import {makeGaussianSplatsArrowTable} from './splats-arrow-table';
import {decodeFloat16, normalizeQuaternion} from './splat-utils';

const SPARK_LEGACY_SPZ_HEADER_BYTE_LENGTH = 16;
const SPZ_HEADER_BYTE_LENGTH = 32;
const SPZ_MAGIC = 0x5053474e;
const SPZ_VERSION = 4;
const SPZ_EXTENSION_FLAG = 0x2;
const SPARK_SPZ_LOD_TREE_FLAG = 0x80;
const SPZ_COLOR_SCALE = 0.15;
const SPZ_ROTATION_COMPONENT_SCALE = Math.SQRT1_2;
const SPZ_ROTATION_COMPONENT_MASK = (1 << 9) - 1;
const GZIP_MAGIC_0 = 0x1f;
const GZIP_MAGIC_1 = 0x8b;

type SPZHeader = {
  magic: number;
  version: number;
  numPoints: number;
  shDegree: number;
  fractionalBits: number;
  flags: number;
  numStreams: number;
  tocByteOffset: number;
};

type SparkLegacySPZHeader = {
  magic: number;
  version: number;
  numPoints: number;
  shDegree: number;
  fractionalBits: number;
  flags: number;
};

type SPZStreamInfo = {
  compressedSize: number;
  uncompressedSize: number;
  compressedOffset: number;
};

/** Parses an `.spz` ArrayBuffer into a Mesh Arrow table or decoded Gaussian splat arrays. */
export async function parseSPZ(
  data: ArrayBuffer,
  options?: SplatsLoaderOptions
): Promise<MeshArrowTable | GaussianSplats> {
  const splats = await parseSPZToGaussianSplats(data, options);
  return options?.splats?.shape === 'gaussian-splats'
    ? splats
    : makeGaussianSplatsArrowTable(splats);
}

/** Parses an `.spz` ArrayBuffer into decoded Gaussian splat values. */
export async function parseSPZToGaussianSplats(
  data: ArrayBuffer,
  options?: SplatsLoaderOptions
): Promise<GaussianSplats> {
  if (isGZipData(data)) {
    const compression = new GZipCompression();
    const decompressedData = await compression.decompress(data);
    return parseSparkLegacySPZToGaussianSplats(decompressedData);
  }

  const version = parseSPZVersion(data);
  if (version >= 1 && version <= 3) {
    return parseSparkLegacySPZToGaussianSplats(data);
  }
  if (version !== SPZ_VERSION) {
    throw new Error(`SPZLoader: version ${version} is not supported.`);
  }
  return parseSPZV4ToGaussianSplats(data, options);
}

/** Parses a Niantic Spatial `.spz` v4 ArrayBuffer into decoded Gaussian splat values. */
async function parseSPZV4ToGaussianSplats(
  data: ArrayBuffer,
  options?: SplatsLoaderOptions
): Promise<GaussianSplats> {
  const header = parseSPZHeader(data);
  const streamInfos = parseSPZStreamInfos(data, header, getSPZStreamByteLengths(header));
  const compressedStreams = streamInfos.map(streamInfo =>
    data.slice(streamInfo.compressedOffset, streamInfo.compressedOffset + streamInfo.compressedSize)
  );
  const compression = new ZstdCompression({modules: options?.modules});
  const streams = await Promise.all(
    compressedStreams.map((compressedStream, streamIndex) =>
      compression.decompress(compressedStream, streamInfos[streamIndex].uncompressedSize)
    )
  );

  validateSPZStreamLengths(streams, streamInfos);
  return decodeSPZStreams(header, streams, data);
}

/** Parses the SPZ magic and version from a plaintext header. */
function parseSPZVersion(data: ArrayBuffer): number {
  if (data.byteLength < SPARK_LEGACY_SPZ_HEADER_BYTE_LENGTH) {
    throw new Error(
      `SPZLoader: file must contain a ${SPARK_LEGACY_SPZ_HEADER_BYTE_LENGTH}-byte SPZ header.`
    );
  }

  const dataView = new DataView(data);
  const magic = dataView.getUint32(0, true);
  if (magic !== SPZ_MAGIC) {
    throw new Error('SPZLoader: NGSP magic header not found.');
  }
  return dataView.getUint32(4, true);
}

/** Parses and decodes Spark legacy gzip SPZ v1-v3 data. */
function parseSparkLegacySPZToGaussianSplats(data: ArrayBuffer): GaussianSplats {
  const header = parseSparkLegacySPZHeader(data);
  const bytes = new Uint8Array(data);
  const splatCount = header.numPoints;
  const positions = new Float32Array(splatCount * 3);
  const scales = new Float32Array(splatCount * 3);
  const rotations = new Float32Array(splatCount * 4);
  const colors = new Uint8Array(splatCount * 3);
  const sphericalHarmonicDcs = new Float32Array(splatCount * 3);
  const opacities = new Float32Array(splatCount);
  const sphericalHarmonicsComponentCount = getSphericalHarmonicsComponentCount(header.shDegree);
  const sphericalHarmonics = sphericalHarmonicsComponentCount
    ? new Float32Array(splatCount * sphericalHarmonicsComponentCount)
    : undefined;
  const lodTree = Boolean(header.flags & SPARK_SPZ_LOD_TREE_FLAG);

  let byteOffset = SPARK_LEGACY_SPZ_HEADER_BYTE_LENGTH;
  byteOffset = decodeSparkLegacySPZPositions(bytes, byteOffset, positions, header);
  byteOffset = decodeSparkLegacySPZOpacities(bytes, byteOffset, opacities, header);
  byteOffset = decodeSparkLegacySPZColors(bytes, byteOffset, colors, sphericalHarmonicDcs, header);
  byteOffset = decodeSparkLegacySPZScales(bytes, byteOffset, scales, header);
  byteOffset = decodeSparkLegacySPZRotations(bytes, byteOffset, rotations, header);

  if (sphericalHarmonics && sphericalHarmonicsComponentCount) {
    byteOffset = decodeSparkLegacySPZSphericalHarmonics(
      bytes,
      byteOffset,
      sphericalHarmonics,
      header
    );
  }

  const childCounts = lodTree
    ? decodeSparkLegacySPZChildCounts(bytes, byteOffset, header)
    : undefined;
  if (childCounts) {
    byteOffset += splatCount * 2;
  }
  const childStarts = lodTree
    ? decodeSparkLegacySPZChildStarts(bytes, byteOffset, header)
    : undefined;
  if (childStarts) {
    byteOffset += splatCount * 4;
  }

  if (byteOffset !== bytes.byteLength) {
    throw new Error('SPZLoader: legacy SPZ byte length does not match decoded sections.');
  }

  return {
    format: 'spz',
    splatCount,
    positions,
    scales,
    rotations,
    colors,
    sphericalHarmonicDcs,
    opacities,
    sphericalHarmonics,
    sphericalHarmonicsComponentCount,
    loaderData: {
      format: 'spz',
      spzFlavor: 'spark-legacy',
      version: header.version,
      numPoints: header.numPoints,
      shDegree: header.shDegree,
      fractionalBits: header.fractionalBits,
      flags: header.flags,
      lodTree,
      childCounts,
      childStarts,
      splatEncoding: lodTree ? {lodOpacity: true} : undefined
    }
  };
}

/** Parses and validates the Spark legacy SPZ plaintext header after gzip decompression. */
function parseSparkLegacySPZHeader(data: ArrayBuffer): SparkLegacySPZHeader {
  if (data.byteLength < SPARK_LEGACY_SPZ_HEADER_BYTE_LENGTH) {
    throw new Error(
      `SPZLoader: legacy SPZ payload must contain a ${SPARK_LEGACY_SPZ_HEADER_BYTE_LENGTH}-byte header.`
    );
  }

  const dataView = new DataView(data);
  const header: SparkLegacySPZHeader = {
    magic: dataView.getUint32(0, true),
    version: dataView.getUint32(4, true),
    numPoints: dataView.getUint32(8, true),
    shDegree: dataView.getUint8(12),
    fractionalBits: dataView.getUint8(13),
    flags: dataView.getUint8(14)
  };

  if (header.magic !== SPZ_MAGIC) {
    throw new Error('SPZLoader: NGSP magic header not found in legacy SPZ payload.');
  }
  if (header.version < 1 || header.version > 3) {
    throw new Error(`SPZLoader: legacy SPZ version ${header.version} is not supported.`);
  }
  if (header.shDegree > 3) {
    throw new Error(
      `SPZLoader: legacy SPZ spherical harmonics degree ${header.shDegree} is not supported.`
    );
  }

  return header;
}

/** Decodes Spark legacy SPZ center coordinates. */
function decodeSparkLegacySPZPositions(
  bytes: Uint8Array,
  byteOffset: number,
  positions: Float32Array,
  header: SparkLegacySPZHeader
): number {
  const bytesPerSplat = header.version === 1 ? 6 : 9;
  assertSparkLegacySPZSection(bytes, byteOffset, header.numPoints * bytesPerSplat, 'positions');

  if (header.version === 1) {
    for (let splatIndex = 0; splatIndex < header.numPoints; splatIndex++) {
      const sourceOffset = byteOffset + splatIndex * bytesPerSplat;
      const targetOffset = splatIndex * 3;
      positions[targetOffset + 0] = decodeFloat16(readUint16LE(bytes, sourceOffset + 0));
      positions[targetOffset + 1] = decodeFloat16(readUint16LE(bytes, sourceOffset + 2));
      positions[targetOffset + 2] = decodeFloat16(readUint16LE(bytes, sourceOffset + 4));
    }
  } else {
    const scale = 1 / 2 ** header.fractionalBits;
    for (let componentIndex = 0; componentIndex < positions.length; componentIndex++) {
      positions[componentIndex] = readInt24LE(bytes, byteOffset + componentIndex * 3) * scale;
    }
  }

  return byteOffset + header.numPoints * bytesPerSplat;
}

/** Decodes Spark legacy SPZ opacity bytes, including Spark's LoD opacity domain. */
function decodeSparkLegacySPZOpacities(
  bytes: Uint8Array,
  byteOffset: number,
  opacities: Float32Array,
  header: SparkLegacySPZHeader
): number {
  assertSparkLegacySPZSection(bytes, byteOffset, header.numPoints, 'opacities');
  const opacityScale = header.flags & SPARK_SPZ_LOD_TREE_FLAG ? 2 : 1;
  for (let splatIndex = 0; splatIndex < header.numPoints; splatIndex++) {
    opacities[splatIndex] = (bytes[byteOffset + splatIndex] / 255) * opacityScale;
  }
  return byteOffset + header.numPoints;
}

/** Decodes Spark legacy SPZ RGB bytes and matching SH DC coefficients. */
function decodeSparkLegacySPZColors(
  bytes: Uint8Array,
  byteOffset: number,
  colors: Uint8Array,
  sphericalHarmonicDcs: Float32Array,
  header: SparkLegacySPZHeader
): number {
  assertSparkLegacySPZSection(bytes, byteOffset, header.numPoints * 3, 'colors');
  const colorBytes = bytes.subarray(byteOffset, byteOffset + header.numPoints * 3);
  decodeSPZColors(colorBytes, colors, sphericalHarmonicDcs);
  return byteOffset + header.numPoints * 3;
}

/** Decodes Spark legacy SPZ log-scale bytes. */
function decodeSparkLegacySPZScales(
  bytes: Uint8Array,
  byteOffset: number,
  scales: Float32Array,
  header: SparkLegacySPZHeader
): number {
  assertSparkLegacySPZSection(bytes, byteOffset, header.numPoints * 3, 'scales');
  const scaleBytes = bytes.subarray(byteOffset, byteOffset + header.numPoints * 3);
  decodeSPZScales(scaleBytes, scales);
  return byteOffset + header.numPoints * 3;
}

/** Decodes Spark legacy SPZ rotations into `[w, x, y, z]` order. */
function decodeSparkLegacySPZRotations(
  bytes: Uint8Array,
  byteOffset: number,
  rotations: Float32Array,
  header: SparkLegacySPZHeader
): number {
  const bytesPerSplat = header.version === 3 ? 4 : 3;
  assertSparkLegacySPZSection(bytes, byteOffset, header.numPoints * bytesPerSplat, 'rotations');

  if (header.version === 3) {
    const rotationBytes = bytes.subarray(byteOffset, byteOffset + header.numPoints * bytesPerSplat);
    decodeSPZRotations(rotationBytes, rotations);
  } else {
    for (let splatIndex = 0; splatIndex < header.numPoints; splatIndex++) {
      const sourceOffset = byteOffset + splatIndex * bytesPerSplat;
      const x = bytes[sourceOffset + 0] / 127.5 - 1;
      const y = bytes[sourceOffset + 1] / 127.5 - 1;
      const z = bytes[sourceOffset + 2] / 127.5 - 1;
      const w = Math.sqrt(Math.max(0, 1 - (x * x + y * y + z * z)));
      const [normalizedW, normalizedX, normalizedY, normalizedZ] = normalizeQuaternion(w, x, y, z);
      const targetOffset = splatIndex * 4;
      rotations[targetOffset + 0] = normalizedW;
      rotations[targetOffset + 1] = normalizedX;
      rotations[targetOffset + 2] = normalizedY;
      rotations[targetOffset + 3] = normalizedZ;
    }
  }

  return byteOffset + header.numPoints * bytesPerSplat;
}

/** Decodes Spark legacy SPZ SH rest coefficients in GraphDECO component order. */
function decodeSparkLegacySPZSphericalHarmonics(
  bytes: Uint8Array,
  byteOffset: number,
  sphericalHarmonics: Float32Array,
  header: SparkLegacySPZHeader
): number {
  const bytesPerSplat = getSphericalHarmonicsComponentCount(header.shDegree);
  assertSparkLegacySPZSection(
    bytes,
    byteOffset,
    header.numPoints * bytesPerSplat,
    'spherical harmonics'
  );

  for (let splatIndex = 0; splatIndex < header.numPoints; splatIndex++) {
    const sourceOffset = byteOffset + splatIndex * bytesPerSplat;
    const targetOffset = splatIndex * bytesPerSplat;
    for (let componentIndex = 0; componentIndex < bytesPerSplat; componentIndex++) {
      sphericalHarmonics[targetOffset + componentIndex] =
        (bytes[sourceOffset + componentIndex] - 128) / 128;
    }
  }

  return byteOffset + header.numPoints * bytesPerSplat;
}

/** Decodes Spark legacy SPZ child-count LoD metadata. */
function decodeSparkLegacySPZChildCounts(
  bytes: Uint8Array,
  byteOffset: number,
  header: SparkLegacySPZHeader
): Uint16Array {
  assertSparkLegacySPZSection(bytes, byteOffset, header.numPoints * 2, 'child counts');
  const childCounts = new Uint16Array(header.numPoints);
  for (let splatIndex = 0; splatIndex < header.numPoints; splatIndex++) {
    childCounts[splatIndex] = readUint16LE(bytes, byteOffset + splatIndex * 2);
  }
  return childCounts;
}

/** Decodes Spark legacy SPZ child-start LoD metadata. */
function decodeSparkLegacySPZChildStarts(
  bytes: Uint8Array,
  byteOffset: number,
  header: SparkLegacySPZHeader
): Uint32Array {
  assertSparkLegacySPZSection(bytes, byteOffset, header.numPoints * 4, 'child starts');
  const childStarts = new Uint32Array(header.numPoints);
  for (let splatIndex = 0; splatIndex < header.numPoints; splatIndex++) {
    childStarts[splatIndex] = readUint32LE(bytes, byteOffset + splatIndex * 4);
  }
  return childStarts;
}

/** Ensures a Spark legacy SPZ section is fully present before decoding. */
function assertSparkLegacySPZSection(
  bytes: Uint8Array,
  byteOffset: number,
  byteLength: number,
  sectionName: string
): void {
  if (byteOffset + byteLength > bytes.byteLength) {
    throw new Error(`SPZLoader: legacy SPZ ${sectionName} section is truncated.`);
  }
}

/** Parses and validates the SPZ v4 plaintext header. */
function parseSPZHeader(data: ArrayBuffer): SPZHeader {
  if (data.byteLength < SPZ_HEADER_BYTE_LENGTH) {
    throw new Error(`SPZLoader: file must contain a ${SPZ_HEADER_BYTE_LENGTH}-byte header.`);
  }

  const dataView = new DataView(data);
  const header: SPZHeader = {
    magic: dataView.getUint32(0, true),
    version: dataView.getUint32(4, true),
    numPoints: dataView.getUint32(8, true),
    shDegree: dataView.getUint8(12),
    fractionalBits: dataView.getUint8(13),
    flags: dataView.getUint8(14),
    numStreams: dataView.getUint8(15),
    tocByteOffset: dataView.getUint32(16, true)
  };

  if (header.magic !== SPZ_MAGIC) {
    throw new Error('SPZLoader: NGSP magic header not found.');
  }
  if (header.version !== SPZ_VERSION) {
    throw new Error(`SPZLoader: version ${header.version} is not supported.`);
  }
  if (header.shDegree > 4) {
    throw new Error(`SPZLoader: spherical harmonics degree ${header.shDegree} is not supported.`);
  }
  if (header.tocByteOffset < SPZ_HEADER_BYTE_LENGTH || header.tocByteOffset > data.byteLength) {
    throw new Error('SPZLoader: invalid table of contents byte offset.');
  }

  return header;
}

/** Parses the SPZ stream table of contents and validates expected stream sizes. */
function parseSPZStreamInfos(
  data: ArrayBuffer,
  header: SPZHeader,
  expectedUncompressedSizes: number[]
): SPZStreamInfo[] {
  if (header.numStreams !== expectedUncompressedSizes.length) {
    throw new Error(
      `SPZLoader: expected ${expectedUncompressedSizes.length} streams, found ${header.numStreams}.`
    );
  }

  const tocByteLength = header.numStreams * 16;
  const tocEnd = header.tocByteOffset + tocByteLength;
  if (tocEnd > data.byteLength) {
    throw new Error('SPZLoader: table of contents exceeds file byte length.');
  }

  const dataView = new DataView(data);
  let compressedOffset = tocEnd;
  const streamInfos: SPZStreamInfo[] = [];
  for (let streamIndex = 0; streamIndex < header.numStreams; streamIndex++) {
    const tocOffset = header.tocByteOffset + streamIndex * 16;
    const compressedSize = readSafeUint64(dataView, tocOffset);
    const uncompressedSize = readSafeUint64(dataView, tocOffset + 8);
    const expectedUncompressedSize = expectedUncompressedSizes[streamIndex];

    if (uncompressedSize !== expectedUncompressedSize) {
      throw new Error(
        `SPZLoader: stream ${streamIndex} has ${uncompressedSize} uncompressed bytes, expected ${expectedUncompressedSize}.`
      );
    }
    if (compressedOffset + compressedSize > data.byteLength) {
      throw new Error(`SPZLoader: stream ${streamIndex} exceeds file byte length.`);
    }

    streamInfos.push({compressedSize, uncompressedSize, compressedOffset});
    compressedOffset += compressedSize;
  }

  if (compressedOffset !== data.byteLength) {
    throw new Error('SPZLoader: compressed stream byte lengths do not match file byte length.');
  }

  return streamInfos;
}

/** Converts a little-endian uint64 to a safe JavaScript number. */
function readSafeUint64(dataView: DataView, byteOffset: number): number {
  const value = dataView.getBigUint64(byteOffset, true);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('SPZLoader: stream byte length exceeds Number.MAX_SAFE_INTEGER.');
  }
  return Number(value);
}

/** Returns true when the SPZ payload is gzip-wrapped legacy Spark SPZ data. */
function isGZipData(data: ArrayBuffer): boolean {
  if (data.byteLength < 2) {
    return false;
  }
  const bytes = new Uint8Array(data, 0, 2);
  return bytes[0] === GZIP_MAGIC_0 && bytes[1] === GZIP_MAGIC_1;
}

/** Reads a little-endian uint16 from a byte array. */
function readUint16LE(bytes: Uint8Array, byteOffset: number): number {
  return bytes[byteOffset] | (bytes[byteOffset + 1] << 8);
}

/** Reads a little-endian uint32 from a byte array. */
function readUint32LE(bytes: Uint8Array, byteOffset: number): number {
  return (
    (bytes[byteOffset] |
      (bytes[byteOffset + 1] << 8) |
      (bytes[byteOffset + 2] << 16) |
      (bytes[byteOffset + 3] << 24)) >>>
    0
  );
}

/** Reads a little-endian signed 24-bit integer from a byte array. */
function readInt24LE(bytes: Uint8Array, byteOffset: number): number {
  let value = bytes[byteOffset] | (bytes[byteOffset + 1] << 8) | (bytes[byteOffset + 2] << 16);
  value |= value & 0x800000 ? 0xff000000 : 0;
  return value;
}

/** Returns expected SPZ v4 stream byte lengths, skipping zero-length SH data. */
function getSPZStreamByteLengths(header: SPZHeader): number[] {
  return [
    header.numPoints * 9,
    header.numPoints,
    header.numPoints * 3,
    header.numPoints * 3,
    header.numPoints * 4,
    header.numPoints * getSphericalHarmonicsComponentCount(header.shDegree)
  ].filter(byteLength => byteLength > 0);
}

/** Validates that decompressed stream lengths match the TOC. */
function validateSPZStreamLengths(streams: ArrayBuffer[], streamInfos: SPZStreamInfo[]): void {
  for (let streamIndex = 0; streamIndex < streams.length; streamIndex++) {
    if (streams[streamIndex].byteLength !== streamInfos[streamIndex].uncompressedSize) {
      throw new Error(`SPZLoader: decompressed stream ${streamIndex} has unexpected byte length.`);
    }
  }
}

/** Decodes decompressed SPZ streams into shared Gaussian splat arrays. */
function decodeSPZStreams(
  header: SPZHeader,
  streams: ArrayBuffer[],
  sourceData: ArrayBuffer
): GaussianSplats {
  const splatCount = header.numPoints;
  const positions = new Float32Array(splatCount * 3);
  const scales = new Float32Array(splatCount * 3);
  const rotations = new Float32Array(splatCount * 4);
  const colors = new Uint8Array(splatCount * 3);
  const sphericalHarmonicDcs = new Float32Array(splatCount * 3);
  const opacities = new Float32Array(splatCount);
  const sphericalHarmonicsComponentCount = getSphericalHarmonicsComponentCount(header.shDegree);
  const sphericalHarmonics = sphericalHarmonicsComponentCount
    ? new Float32Array(splatCount * sphericalHarmonicsComponentCount)
    : undefined;
  const [
    positionStream,
    alphaStream,
    colorStream,
    scaleStream,
    rotationStream,
    sphericalHarmonicsStream
  ] = streams.map(stream => new Uint8Array(stream));

  decodeSPZPositions(positionStream, positions, header.fractionalBits);
  decodeSPZScales(scaleStream, scales);
  decodeSPZRotations(rotationStream, rotations);
  decodeSPZColors(colorStream, colors, sphericalHarmonicDcs);
  decodeSPZOpacities(alphaStream, opacities);
  if (sphericalHarmonics && sphericalHarmonicsStream) {
    decodeSPZSphericalHarmonics(sphericalHarmonicsStream, sphericalHarmonics);
  }

  return {
    format: 'spz',
    splatCount,
    positions,
    scales,
    rotations,
    colors,
    sphericalHarmonicDcs,
    opacities,
    sphericalHarmonics,
    sphericalHarmonicsComponentCount,
    loaderData: {
      format: 'spz',
      ...header,
      antialiased: Boolean(header.flags & 0x1),
      extensionByteLength: getSPZExtensionByteLength(header),
      extensionBytes: getSPZExtensionBytes(sourceData, header)
    }
  };
}

/** Decodes 24-bit signed fixed-point SPZ positions. */
function decodeSPZPositions(
  positionStream: Uint8Array,
  positions: Float32Array,
  fractionalBits: number
): void {
  const scale = 1 / 2 ** fractionalBits;
  for (let componentIndex = 0; componentIndex < positions.length; componentIndex++) {
    const byteOffset = componentIndex * 3;
    let fixed32 =
      positionStream[byteOffset] |
      (positionStream[byteOffset + 1] << 8) |
      (positionStream[byteOffset + 2] << 16);
    fixed32 |= fixed32 & 0x800000 ? 0xff000000 : 0;
    positions[componentIndex] = fixed32 * scale;
  }
}

/** Decodes SPZ log-encoded scales to linear standard deviations. */
function decodeSPZScales(scaleStream: Uint8Array, scales: Float32Array): void {
  for (let componentIndex = 0; componentIndex < scales.length; componentIndex++) {
    scales[componentIndex] = Math.exp(scaleStream[componentIndex] / 16 - 10);
  }
}

/** Decodes SPZ smallest-three quaternion rotations into `[w, x, y, z]` order. */
function decodeSPZRotations(rotationStream: Uint8Array, rotations: Float32Array): void {
  for (let splatIndex = 0; splatIndex < rotations.length / 4; splatIndex++) {
    const byteOffset = splatIndex * 4;
    const component =
      rotationStream[byteOffset] |
      (rotationStream[byteOffset + 1] << 8) |
      (rotationStream[byteOffset + 2] << 16) |
      (rotationStream[byteOffset + 3] << 24);
    const xyzw = decodeSPZQuaternion(component >>> 0);
    const [w, x, y, z] = normalizeQuaternion(xyzw[3], xyzw[0], xyzw[1], xyzw[2]);
    const rotationOffset = splatIndex * 4;
    rotations[rotationOffset + 0] = w;
    rotations[rotationOffset + 1] = x;
    rotations[rotationOffset + 2] = y;
    rotations[rotationOffset + 3] = z;
  }
}

/** Decodes one SPZ smallest-three quaternion into `[x, y, z, w]` order. */
function decodeSPZQuaternion(component: number): [number, number, number, number] {
  const rotation: [number, number, number, number] = [0, 0, 0, 0];
  const largestComponent = component >>> 30;
  let remainingBits = component;
  let sumSquares = 0;

  for (let componentIndex = 3; componentIndex >= 0; componentIndex--) {
    if (componentIndex !== largestComponent) {
      const magnitude = remainingBits & SPZ_ROTATION_COMPONENT_MASK;
      const isNegative = (remainingBits >>> 9) & 0x1;
      remainingBits >>>= 10;
      let value = (SPZ_ROTATION_COMPONENT_SCALE * magnitude) / SPZ_ROTATION_COMPONENT_MASK;
      if (isNegative) {
        value = -value;
      }
      rotation[componentIndex] = value;
      sumSquares += value * value;
    }
  }

  rotation[largestComponent] = Math.sqrt(Math.max(0, 1 - sumSquares));
  return rotation;
}

/** Decodes SPZ color bytes into display RGB bytes and direct SH DC coefficients. */
function decodeSPZColors(
  colorStream: Uint8Array,
  colors: Uint8Array,
  sphericalHarmonicDcs: Float32Array
): void {
  for (let componentIndex = 0; componentIndex < colors.length; componentIndex++) {
    sphericalHarmonicDcs[componentIndex] =
      (colorStream[componentIndex] / 255 - 0.5) / SPZ_COLOR_SCALE;
    colors[componentIndex] = normalizeColorByte(sphericalHarmonicDcs[componentIndex]);
  }
}

/** Decodes SPZ alpha bytes into linear opacity. */
function decodeSPZOpacities(alphaStream: Uint8Array, opacities: Float32Array): void {
  for (let splatIndex = 0; splatIndex < opacities.length; splatIndex++) {
    opacities[splatIndex] = alphaStream[splatIndex] / 255;
  }
}

/** Decodes SPZ quantized SH rest coefficients. */
function decodeSPZSphericalHarmonics(
  sphericalHarmonicsStream: Uint8Array,
  sphericalHarmonics: Float32Array
): void {
  for (let componentIndex = 0; componentIndex < sphericalHarmonics.length; componentIndex++) {
    sphericalHarmonics[componentIndex] = (sphericalHarmonicsStream[componentIndex] - 128) / 128;
  }
}

/** Converts an SH DC coefficient to a fallback RGB byte for preview paths. */
function normalizeColorByte(sphericalHarmonicDc: number): number {
  return Math.min(
    Math.max(Math.round((sphericalHarmonicDc * SPZ_COLOR_SCALE + 0.5) * 255), 0),
    255
  );
}

/** Returns the number of SH rest coefficients per splat for an SPZ degree. */
function getSphericalHarmonicsComponentCount(shDegree: number): number {
  switch (shDegree) {
    case 0:
      return 0;
    case 1:
      return 9;
    case 2:
      return 24;
    case 3:
      return 45;
    case 4:
      return 72;
    default:
      throw new Error(`SPZLoader: spherical harmonics degree ${shDegree} is not supported.`);
  }
}

/** Returns the plaintext SPZ extension byte count. */
function getSPZExtensionByteLength(header: SPZHeader): number {
  return header.flags & SPZ_EXTENSION_FLAG ? header.tocByteOffset - SPZ_HEADER_BYTE_LENGTH : 0;
}

/** Returns a copy of plaintext SPZ extension bytes when extension records are present. */
function getSPZExtensionBytes(data: ArrayBuffer, header: SPZHeader): Uint8Array | undefined {
  const extensionByteLength = getSPZExtensionByteLength(header);
  return extensionByteLength
    ? new Uint8Array(data.slice(SPZ_HEADER_BYTE_LENGTH, header.tocByteOffset))
    : undefined;
}
