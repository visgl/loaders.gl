// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GZipDecompressor, ZstdDecompressor} from '@loaders.gl/compression';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {GaussianSplats, SPZCoordinateSystem, SplatsLoaderOptions} from '../types';
import {makeGaussianSplatsArrowTable} from './splats-arrow-table';
import {normalizeQuaternion} from './splat-utils';

const SPZ_HEADER_BYTE_LENGTH = 32;
const SPZ_MAGIC = 0x5053474e;
const SPZ_VERSION = 4;
const SPZ_EXTENSION_FLAG = 0x2;
const SPZ_COLOR_SCALE = 0.15;
const SPZ_ROTATION_COMPONENT_SCALE = Math.SQRT1_2;
const SPZ_ROTATION_COMPONENT_MASK = (1 << 9) - 1;

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

type SPZStreamInfo = {
  compressedSize: number;
  uncompressedSize: number;
  compressedOffset: number;
};

/** Parses a Niantic Spatial `.spz` ArrayBuffer into a Mesh Arrow table. */
export async function parseSPZ(
  data: ArrayBuffer,
  options?: SplatsLoaderOptions
): Promise<MeshArrowTable> {
  return makeGaussianSplatsArrowTable(await parseSPZToGaussianSplats(data, options));
}

/** Parses a Niantic Spatial `.spz` ArrayBuffer into decoded Gaussian splat values. */
export async function parseSPZToGaussianSplats(
  data: ArrayBuffer,
  options?: SplatsLoaderOptions
): Promise<GaussianSplats> {
  const version = detectSPZVersion(data);
  if (version === 0) {
    return await parseLegacySPZ(data, options);
  }
  if (version !== SPZ_VERSION) {
    throw new Error(`SPZLoader: version ${version} is not supported.`);
  }
  const header = parseSPZHeader(data);
  const streamInfos = parseSPZStreamInfos(data, header, getSPZStreamByteLengths(header));
  const compressedStreams = streamInfos.map(streamInfo =>
    data.slice(streamInfo.compressedOffset, streamInfo.compressedOffset + streamInfo.compressedSize)
  );
  const decompressor = new ZstdDecompressor({modules: options?.modules});
  const streams = await Promise.all(
    compressedStreams.map((compressedStream, streamIndex) =>
      decompressor.decompress(compressedStream, streamInfos[streamIndex].uncompressedSize)
    )
  );

  validateSPZStreamLengths(streams, streamInfos);
  return applySPZCoordinateSystem(
    decodeSPZStreams(header, streams, data),
    options?.splats?.sourceCoordinateSystem ?? 'RUB',
    options?.splats?.targetCoordinateSystem ?? options?.splats?.sourceCoordinateSystem ?? 'RUB'
  );
}

/** Detects the SPZ generation from either the legacy gzip or v4 plaintext header. */
function detectSPZVersion(data: ArrayBuffer): number {
  if (data.byteLength < 8) {
    throw new Error('SPZLoader: file must contain at least an 8-byte header.');
  }
  const bytes = new Uint8Array(data);
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    // Legacy files carry their 16-byte header inside the gzip stream. The
    // version is therefore read by parseLegacySPZ after decompression.
    return 0;
  }
  if (data.byteLength < SPZ_HEADER_BYTE_LENGTH) {
    throw new Error('SPZLoader: file must contain a 32-byte header.');
  }
  return new DataView(data).getUint32(4, true);
}

/** Decodes the single-stream SPZ v2/v3 container. */
async function parseLegacySPZ(
  data: ArrayBuffer,
  options?: SplatsLoaderOptions
): Promise<GaussianSplats> {
  const decompressed = await new GZipDecompressor({
    modules: options?.modules,
    useNative: true
  }).decompress(data);
  if (decompressed.byteLength < 16) {
    throw new Error('SPZLoader: legacy payload must contain a 16-byte header.');
  }
  const dataView = new DataView(decompressed);
  const header = {
    magic: dataView.getUint32(0, true),
    version: dataView.getUint32(4, true),
    numPoints: dataView.getUint32(8, true),
    shDegree: dataView.getUint8(12),
    fractionalBits: dataView.getUint8(13),
    flags: dataView.getUint8(14)
  };
  if (header.magic !== SPZ_MAGIC) {
    throw new Error('SPZLoader: NGSP magic header not found.');
  }
  if (header.version !== 2 && header.version !== 3) {
    throw new Error(`SPZLoader: version ${header.version} is not supported.`);
  }
  if (dataView.getUint8(15) !== 0) {
    throw new Error('SPZLoader: legacy header reserved byte must be zero.');
  }
  if (header.shDegree > 3) {
    throw new Error(`SPZLoader: spherical harmonics degree ${header.shDegree} is not supported.`);
  }

  const count = header.numPoints;
  const shComponentCount = getSphericalHarmonicsComponentCount(header.shDegree);
  const positionByteLength = count * 9;
  const alphaByteLength = count;
  const colorByteLength = count * 3;
  const scaleByteLength = count * 3;
  const rotationByteLength = count * (header.version === 2 ? 3 : 4);
  const shByteLength = count * shComponentCount;
  const payloadByteLength =
    positionByteLength +
    alphaByteLength +
    colorByteLength +
    scaleByteLength +
    rotationByteLength +
    shByteLength;
  if (decompressed.byteLength - 16 !== payloadByteLength) {
    throw new Error(
      `SPZLoader: legacy payload has ${decompressed.byteLength - 16} bytes, expected ${payloadByteLength}.`
    );
  }

  let offset = 16;
  const positions = new Float32Array(count * 3);
  const opacities = new Float32Array(count);
  const colors = new Uint8Array(count * 3);
  const scales = new Float32Array(count * 3);
  const rotations = new Float32Array(count * 4);
  const sphericalHarmonicDcs = new Float32Array(count * 3);
  const sphericalHarmonics = shComponentCount
    ? new Float32Array(count * shComponentCount)
    : undefined;
  decodeSPZPositions(
    new Uint8Array(decompressed, offset, positionByteLength),
    positions,
    header.fractionalBits
  );
  offset += positionByteLength;
  decodeSPZOpacities(new Uint8Array(decompressed, offset, alphaByteLength), opacities);
  offset += alphaByteLength;
  decodeSPZColors(
    new Uint8Array(decompressed, offset, colorByteLength),
    colors,
    sphericalHarmonicDcs
  );
  offset += colorByteLength;
  decodeSPZScales(new Uint8Array(decompressed, offset, scaleByteLength), scales);
  offset += scaleByteLength;
  if (header.version === 2) {
    decodeLegacySPZRotations(new Uint8Array(decompressed, offset, rotationByteLength), rotations);
  } else {
    decodeSPZRotations(new Uint8Array(decompressed, offset, rotationByteLength), rotations);
  }
  offset += rotationByteLength;
  if (sphericalHarmonics) {
    decodeSPZSphericalHarmonics(
      new Uint8Array(decompressed, offset, shByteLength),
      sphericalHarmonics
    );
  }

  return applySPZCoordinateSystem(
    {
      format: 'spz',
      splatCount: count,
      positions,
      scales,
      rotations,
      colors,
      sphericalHarmonicDcs,
      opacities,
      sphericalHarmonics,
      sphericalHarmonicsComponentCount: shComponentCount || undefined,
      loaderData: {...header, legacy: true}
    },
    options?.splats?.sourceCoordinateSystem ?? 'RUB',
    options?.splats?.targetCoordinateSystem ?? options?.splats?.sourceCoordinateSystem ?? 'RUB'
  );
}

/** Decodes the three signed bytes used by SPZ v2 rotations. */
function decodeLegacySPZRotations(rotationStream: Uint8Array, rotations: Float32Array): void {
  for (let splatIndex = 0; splatIndex < rotations.length / 4; splatIndex++) {
    const byteOffset = splatIndex * 3;
    const x = signedByte(rotationStream[byteOffset]) / 127;
    const y = signedByte(rotationStream[byteOffset + 1]) / 127;
    const z = signedByte(rotationStream[byteOffset + 2]) / 127;
    const w = Math.sqrt(Math.max(0, 1 - x * x - y * y - z * z));
    const normalized = normalizeQuaternion(w, x, y, z);
    rotations.set(normalized, splatIndex * 4);
  }
}

/** Converts an unsigned byte containing a signed int8 value. */
function signedByte(value: number): number {
  return value > 127 ? value - 256 : value;
}

/** Applies the explicitly requested SPZ coordinate conversion. */
function applySPZCoordinateSystem(
  splats: GaussianSplats,
  source: SPZCoordinateSystem,
  target: SPZCoordinateSystem
): GaussianSplats {
  if (source === target || source === 'UNSPECIFIED' || target === 'UNSPECIFIED') {
    return splats;
  }
  if (source === 'RUB' && target === 'LUF') {
    for (let index = 0; index < splats.positions.length; index += 3) {
      splats.positions[index] = -splats.positions[index];
      splats.positions[index + 2] = -splats.positions[index + 2];
    }
    for (let index = 0; index < splats.rotations.length; index += 4) {
      splats.rotations[index + 1] = -splats.rotations[index + 1];
      splats.rotations[index + 3] = -splats.rotations[index + 3];
    }
    return splats;
  }
  if (source === 'LUF' && target === 'RUB') {
    return applySPZCoordinateSystem(splats, 'RUB', 'LUF');
  }
  throw new Error(`SPZLoader: coordinate conversion ${source} -> ${target} is not supported.`);
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
