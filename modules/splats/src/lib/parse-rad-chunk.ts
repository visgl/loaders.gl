// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DeflateDecompressor} from '@loaders.gl/compression/deflate-decompressor';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {GaussianSplats, SplatsLoaderOptions} from '../types';
import {
  parseRADChunkHeader,
  roundUpToEight,
  type RADChunkMetadata,
  type RADChunkProperty,
  type RADSplatEncoding
} from './parse-rad';
import {makeGaussianSplatsArrowTable} from './splats-arrow-table';
import {decodeFloat16, normalizeQuaternion, SH_C0} from './splat-utils';

const RAD_PROPERTY_DEFLATE = new DeflateDecompressor({useNative: false});
const RAD_PROPERTY_RAW_DEFLATE = new DeflateDecompressor({raw: true, useNative: false});

/** Options for decoding one Spark RADC chunk payload. */
export type RADChunkDecodeOptions = SplatsLoaderOptions & {
  radChunk?: {
    /** Optional source-level splat encoding metadata used as a fallback for chunk-local metadata. */
    splatEncoding?: RADSplatEncoding;
    /** Whether decoded LoD child metadata is retained in `loaderData`. */
    includeLoDTree?: boolean;
    /** Whether decoded SH rest coefficients are included in Arrow table columns. */
    includeSphericalHarmonics?: boolean;
  };
};

/** Parses a Spark `.radc` chunk into a Mesh Arrow table. */
export function parseRADChunk(
  data: ArrayBuffer | ArrayBufferView,
  options?: RADChunkDecodeOptions
): MeshArrowTable {
  return makeGaussianSplatsArrowTable(parseRADChunkToGaussianSplats(data, options));
}

/** Parses a Spark `.radc` chunk into decoded Gaussian splat values. */
export function parseRADChunkToGaussianSplats(
  data: ArrayBuffer | ArrayBufferView,
  options?: RADChunkDecodeOptions
): GaussianSplats {
  const bytes = getUint8Array(data);
  const metadata = getRADChunkDecodeMetadata(parseRADChunkHeader(bytes), options);
  if (bytes.byteLength < metadata.chunkByteLength) {
    throw new Error('RADLoader: RADC chunk payload is incomplete.');
  }

  const splatCount = metadata.count;
  const positions = decodeRADFloatProperty(
    bytes,
    metadata,
    requireRADProperty(metadata, 'center'),
    3
  );
  const opacities = decodeRADAlpha(bytes, metadata, splatCount);
  const rgb = decodeRADRgb(bytes, metadata, splatCount);
  const scales = decodeRADScales(bytes, metadata, splatCount);
  const rotations = decodeRADRotations(bytes, metadata, splatCount);
  const {colors, sphericalHarmonicDcs} = convertRgbToColorColumns(rgb);
  const includeLoDTree = options?.radChunk?.includeLoDTree ?? true;
  const childCounts = includeLoDTree
    ? decodeOptionalRADUint16(bytes, metadata, 'child_count')
    : null;
  const childStarts = includeLoDTree
    ? decodeOptionalRADUint32(bytes, metadata, 'child_start')
    : null;
  const includeSphericalHarmonics = options?.radChunk?.includeSphericalHarmonics ?? false;
  const sphericalHarmonics = includeSphericalHarmonics
    ? decodeRADSphericalHarmonics(bytes, metadata)
    : null;

  return {
    format: 'rad',
    splatCount,
    positions,
    scales,
    rotations,
    colors,
    sphericalHarmonicDcs,
    opacities,
    sphericalHarmonics: sphericalHarmonics?.values,
    sphericalHarmonicsComponentCount: sphericalHarmonics?.componentCount,
    loaderData: {
      format: 'rad',
      base: metadata.base,
      count: metadata.count,
      maxSh: metadata.maxSh ?? 0,
      lodTree: metadata.lodTree ?? false,
      splatEncoding: metadata.splatEncoding,
      childCounts: childCounts ?? undefined,
      childStarts: childStarts ?? undefined
    }
  };
}

/** Decodes the chunk alpha property, falling back to fully opaque splats. */
function decodeRADAlpha(
  bytes: Uint8Array,
  metadata: RADChunkMetadata,
  splatCount: number
): Float32Array {
  const property = findRADProperty(metadata, 'alpha');
  if (!property) {
    return new Float32Array(splatCount).fill(1);
  }
  const opacities = decodeRADFloatProperty(bytes, metadata, property, 1);
  for (let splatIndex = 0; splatIndex < opacities.length; splatIndex++) {
    opacities[splatIndex] = decodeRADOpacity(opacities[splatIndex], metadata, property);
  }
  return opacities;
}

/** Decodes normal or Spark LoD opacity into the renderer opacity domain. */
function decodeRADOpacity(
  opacity: number,
  metadata: RADChunkMetadata,
  property: RADChunkProperty
): number {
  const normalizedOpacity = Math.max(opacity, 0);
  if (
    !metadata.splatEncoding?.lodOpacity ||
    (property.encoding !== 'r8' && property.encoding !== 'r8_delta')
  ) {
    return normalizedOpacity;
  }

  return normalizedOpacity * 2;
}

/** Decodes the chunk RGB property, falling back to white splats. */
function decodeRADRgb(
  bytes: Uint8Array,
  metadata: RADChunkMetadata,
  splatCount: number
): Float32Array {
  const property = findRADProperty(metadata, 'rgb');
  if (!property) {
    return new Float32Array(splatCount * 3).fill(1);
  }
  return decodeRADFloatProperty(bytes, metadata, property, 3);
}

/** Decodes the chunk scale property, falling back to unit splats. */
function decodeRADScales(
  bytes: Uint8Array,
  metadata: RADChunkMetadata,
  splatCount: number
): Float32Array {
  const property = findRADProperty(metadata, 'scales');
  if (!property) {
    return new Float32Array(splatCount * 3).fill(1);
  }
  return decodeRADFloatProperty(bytes, metadata, property, 3);
}

/** Decodes the chunk orientation property, falling back to identity rotations. */
function decodeRADRotations(
  bytes: Uint8Array,
  metadata: RADChunkMetadata,
  splatCount: number
): Float32Array {
  const property = findRADProperty(metadata, 'orientation');
  if (!property) {
    return makeIdentityRotations(splatCount);
  }

  const propertyBytes = getRADPropertyBytes(bytes, metadata, property);
  switch (property.encoding) {
    case 'oct88r8':
      return decodeRADOct88R8Rotations(propertyBytes, splatCount);
    case 'f32':
    case 'f16': {
      const xyz = decodeRADFloatProperty(bytes, metadata, property, 3);
      const rotations = new Float32Array(splatCount * 4);
      for (let splatIndex = 0; splatIndex < splatCount; splatIndex++) {
        const xyzOffset = splatIndex * 3;
        const rotationOffset = splatIndex * 4;
        const x = xyz[xyzOffset + 0];
        const y = xyz[xyzOffset + 1];
        const z = xyz[xyzOffset + 2];
        const w = Math.sqrt(Math.max(0, 1 - x * x - y * y - z * z));
        const normalized = normalizeQuaternion(w, x, y, z);
        rotations.set(normalized, rotationOffset);
      }
      return rotations;
    }
    default:
      throw new Error(`RADLoader: unsupported orientation encoding ${property.encoding}.`);
  }
}

/** Decodes optional spherical harmonic rest properties from a chunk. */
function decodeRADSphericalHarmonics(
  bytes: Uint8Array,
  metadata: RADChunkMetadata
): {values: Float32Array; componentCount: number} | null {
  const shProperties = [
    {property: findRADProperty(metadata, 'sh1'), dimensions: 9},
    {property: findRADProperty(metadata, 'sh2'), dimensions: 15},
    {property: findRADProperty(metadata, 'sh3'), dimensions: 21}
  ].filter(
    (entry): entry is {property: RADChunkProperty; dimensions: number} =>
      entry.property !== undefined
  );
  if (shProperties.length === 0) {
    return null;
  }

  const decodedProperties = shProperties.map(entry => ({
    values: decodeRADFloatProperty(bytes, metadata, entry.property, entry.dimensions),
    dimensions: entry.dimensions
  }));
  const componentCount = decodedProperties.reduce((total, entry) => total + entry.dimensions, 0);
  const values = new Float32Array(metadata.count * componentCount);
  for (let splatIndex = 0; splatIndex < metadata.count; splatIndex++) {
    let outputOffset = splatIndex * componentCount;
    for (const decodedProperty of decodedProperties) {
      const inputOffset = splatIndex * decodedProperty.dimensions;
      values.set(
        decodedProperty.values.subarray(inputOffset, inputOffset + decodedProperty.dimensions),
        outputOffset
      );
      outputOffset += decodedProperty.dimensions;
    }
  }
  return {values, componentCount};
}

/** Decodes one numeric RADC property into row-major Float32 values. */
function decodeRADFloatProperty(
  bytes: Uint8Array,
  metadata: RADChunkMetadata,
  property: RADChunkProperty,
  dimensions: number
): Float32Array {
  const propertyBytes = getRADPropertyBytes(bytes, metadata, property);
  switch (property.encoding) {
    case 'f32':
      return decodePlanarFloat32(propertyBytes, dimensions, metadata.count);
    case 'f16':
      return decodePlanarFloat16(propertyBytes, dimensions, metadata.count);
    case 'f32_lebytes':
      return decodeLeBytesFloat32(propertyBytes, dimensions, metadata.count);
    case 'f16_lebytes':
      return decodeLeBytesFloat16(propertyBytes, dimensions, metadata.count);
    case 'r8':
      return decodeR8(
        propertyBytes,
        dimensions,
        metadata.count,
        getPropertyMin(metadata, property),
        getPropertyMax(metadata, property)
      );
    case 'r8_delta':
      return decodeR8Delta(
        propertyBytes,
        dimensions,
        metadata.count,
        getPropertyMin(metadata, property),
        getPropertyMax(metadata, property)
      );
    case 's8':
      return decodeS8(
        propertyBytes,
        dimensions,
        metadata.count,
        getPropertyMax(metadata, property)
      );
    case 's8_delta':
      return decodeS8Delta(
        propertyBytes,
        dimensions,
        metadata.count,
        getPropertyMax(metadata, property)
      );
    case 'ln_0r8':
      return decodeScaleR8(
        propertyBytes,
        dimensions,
        metadata.count,
        getPropertyMin(metadata, property),
        getPropertyMax(metadata, property)
      );
    case 'ln_f16':
      return decodeLogFloat16(propertyBytes, dimensions, metadata.count);
    default:
      throw new Error(`RADLoader: unsupported ${property.property} encoding ${property.encoding}.`);
  }
}

/** Decodes one optional unsigned 16-bit RADC property. */
function decodeOptionalRADUint16(
  bytes: Uint8Array,
  metadata: RADChunkMetadata,
  propertyName: string
): Uint16Array | null {
  const property = findRADProperty(metadata, propertyName);
  if (!property) {
    return null;
  }
  if (property.encoding !== 'u16') {
    throw new Error(`RADLoader: unsupported ${propertyName} encoding ${property.encoding}.`);
  }
  const propertyBytes = getRADPropertyBytes(bytes, metadata, property);
  const values = new Uint16Array(metadata.count);
  for (let splatIndex = 0; splatIndex < metadata.count; splatIndex++) {
    values[splatIndex] = propertyBytes[splatIndex * 2] | (propertyBytes[splatIndex * 2 + 1] << 8);
  }
  return values;
}

/** Decodes one optional unsigned 32-bit RADC property. */
function decodeOptionalRADUint32(
  bytes: Uint8Array,
  metadata: RADChunkMetadata,
  propertyName: string
): Uint32Array | null {
  const property = findRADProperty(metadata, propertyName);
  if (!property) {
    return null;
  }
  if (property.encoding !== 'u32') {
    throw new Error(`RADLoader: unsupported ${propertyName} encoding ${property.encoding}.`);
  }
  const propertyBytes = getRADPropertyBytes(bytes, metadata, property);
  const dataView = new DataView(
    propertyBytes.buffer,
    propertyBytes.byteOffset,
    propertyBytes.byteLength
  );
  const values = new Uint32Array(metadata.count);
  for (let splatIndex = 0; splatIndex < metadata.count; splatIndex++) {
    values[splatIndex] = dataView.getUint32(splatIndex * 4, true);
  }
  return values;
}

/** Returns decompressed bytes for one RADC property. */
function getRADPropertyBytes(
  bytes: Uint8Array,
  metadata: RADChunkMetadata,
  property: RADChunkProperty
): Uint8Array {
  const paddedByteLength = roundUpToEight(property.bytes);
  const byteOffset = metadata.payloadByteOffset + property.offset;
  const byteEnd = byteOffset + paddedByteLength;
  if (byteEnd > bytes.byteLength || property.offset + paddedByteLength > metadata.payloadBytes) {
    throw new Error(`RADLoader: property ${property.property} exceeds RADC payload byte length.`);
  }

  const propertyBytes = bytes.subarray(byteOffset, byteOffset + property.bytes);
  if (!property.compression) {
    return propertyBytes;
  }
  if (property.compression !== 'gz') {
    throw new Error(`RADLoader: unsupported property compression ${property.compression}.`);
  }
  return decompressRADProperty(propertyBytes, property.property);
}

/** Inflates one Spark RADC property payload. */
function decompressRADProperty(bytes: Uint8Array, propertyName: string): Uint8Array {
  const arrayBuffer = copyToArrayBuffer(bytes);
  try {
    return new Uint8Array(RAD_PROPERTY_DEFLATE.decompressSync(arrayBuffer));
  } catch {
    try {
      return new Uint8Array(RAD_PROPERTY_RAW_DEFLATE.decompressSync(arrayBuffer));
    } catch {
      throw new Error(`RADLoader: failed to decompress RADC property ${propertyName}.`);
    }
  }
}

/** Decodes planar Float32 values emitted by Spark RADC. */
function decodePlanarFloat32(bytes: Uint8Array, dimensions: number, count: number): Float32Array {
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values = new Float32Array(count * dimensions);
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      values[rowIndex * dimensions + dimension] = dataView.getFloat32(
        (dimension * count + rowIndex) * 4,
        true
      );
    }
  }
  return values;
}

/** Decodes planar Float16 values emitted by Spark RADC. */
function decodePlanarFloat16(bytes: Uint8Array, dimensions: number, count: number): Float32Array {
  const values = new Float32Array(count * dimensions);
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      const byteOffset = (dimension * count + rowIndex) * 2;
      values[rowIndex * dimensions + dimension] = decodeFloat16(
        bytes[byteOffset] | (bytes[byteOffset + 1] << 8)
      );
    }
  }
  return values;
}

/** Decodes Spark's byte-plane reordered Float32 values. */
function decodeLeBytesFloat32(bytes: Uint8Array, dimensions: number, count: number): Float32Array {
  const values = new Float32Array(count * dimensions);
  const stride = count * dimensions;
  const scratch = new Uint8Array(4);
  const scratchView = new DataView(scratch.buffer);
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      const byteOffset = dimension * count + rowIndex;
      for (let byteIndex = 0; byteIndex < 4; byteIndex++) {
        scratch[byteIndex] = bytes[byteOffset + stride * byteIndex];
      }
      values[rowIndex * dimensions + dimension] = scratchView.getFloat32(0, true);
    }
  }
  return values;
}

/** Decodes Spark's byte-plane reordered Float16 values. */
function decodeLeBytesFloat16(bytes: Uint8Array, dimensions: number, count: number): Float32Array {
  const values = new Float32Array(count * dimensions);
  const stride = count * dimensions;
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      const byteOffset = dimension * count + rowIndex;
      values[rowIndex * dimensions + dimension] = decodeFloat16(
        bytes[byteOffset] | (bytes[byteOffset + stride] << 8)
      );
    }
  }
  return values;
}

/** Decodes R8 quantized planar float values. */
function decodeR8(
  bytes: Uint8Array,
  dimensions: number,
  count: number,
  min: number,
  max: number
): Float32Array {
  const values = new Float32Array(count * dimensions);
  const range = max - min;
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      values[rowIndex * dimensions + dimension] =
        (bytes[dimension * count + rowIndex] / 255) * range + min;
    }
  }
  return values;
}

/** Decodes delta-compressed R8 quantized planar float values. */
function decodeR8Delta(
  bytes: Uint8Array,
  dimensions: number,
  count: number,
  min: number,
  max: number
): Float32Array {
  const values = new Float32Array(count * dimensions);
  const range = max - min;
  const last = new Uint8Array(dimensions);
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      const byteOffset = dimension * count + rowIndex;
      const value = (last[dimension] + bytes[byteOffset]) & 0xff;
      last[dimension] = value;
      values[rowIndex * dimensions + dimension] = (value / 255) * range + min;
    }
  }
  return values;
}

/** Decodes S8 quantized planar float values. */
function decodeS8(bytes: Uint8Array, dimensions: number, count: number, max: number): Float32Array {
  const values = new Float32Array(count * dimensions);
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      const byte = bytes[dimension * count + rowIndex];
      values[rowIndex * dimensions + dimension] = (((byte << 24) >> 24) / 127) * max;
    }
  }
  return values;
}

/** Decodes delta-compressed S8 quantized planar float values. */
function decodeS8Delta(
  bytes: Uint8Array,
  dimensions: number,
  count: number,
  max: number
): Float32Array {
  const values = new Float32Array(count * dimensions);
  const last = new Uint8Array(dimensions);
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      const byteOffset = dimension * count + rowIndex;
      const value = (last[dimension] + bytes[byteOffset]) & 0xff;
      last[dimension] = value;
      values[rowIndex * dimensions + dimension] = (((value << 24) >> 24) / 127) * max;
    }
  }
  return values;
}

/** Decodes Spark scale8 values to linear Gaussian standard deviations. */
function decodeScaleR8(
  bytes: Uint8Array,
  dimensions: number,
  count: number,
  min: number,
  max: number
): Float32Array {
  const values = new Float32Array(count * dimensions);
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      values[rowIndex * dimensions + dimension] = decodeScale8(
        bytes[dimension * count + rowIndex],
        min,
        max
      );
    }
  }
  return values;
}

/** Decodes Spark log-Float16 scale values to linear Gaussian standard deviations. */
function decodeLogFloat16(bytes: Uint8Array, dimensions: number, count: number): Float32Array {
  const logValues = decodePlanarFloat16(bytes, dimensions, count);
  for (let valueIndex = 0; valueIndex < logValues.length; valueIndex++) {
    logValues[valueIndex] = Math.exp(logValues[valueIndex]);
  }
  return logValues;
}

/** Decodes Spark oct88r8 quaternion values into `[w, x, y, z]` rotations. */
function decodeRADOct88R8Rotations(bytes: Uint8Array, count: number): Float32Array {
  const rotations = new Float32Array(count * 4);
  for (let splatIndex = 0; splatIndex < count; splatIndex++) {
    const byteOffset = splatIndex * 3;
    const [x, y, z, w] = decodeQuatOct888(
      bytes[byteOffset],
      bytes[byteOffset + 1],
      bytes[byteOffset + 2]
    );
    rotations.set(normalizeQuaternion(w, x, y, z), splatIndex * 4);
  }
  return rotations;
}

/** Converts decoded RGB floats to loaders.gl color and SH DC columns. */
function convertRgbToColorColumns(rgb: Float32Array): {
  colors: Uint8Array;
  sphericalHarmonicDcs: Float32Array;
} {
  const colors = new Uint8Array(rgb.length);
  const sphericalHarmonicDcs = new Float32Array(rgb.length);
  for (let componentIndex = 0; componentIndex < rgb.length; componentIndex++) {
    const component = rgb[componentIndex];
    colors[componentIndex] = normalizeColorByte(component);
    sphericalHarmonicDcs[componentIndex] = (component - 0.5) / SH_C0;
  }
  return {colors, sphericalHarmonicDcs};
}

/** Returns an identity rotation array. */
function makeIdentityRotations(count: number): Float32Array {
  const rotations = new Float32Array(count * 4);
  for (let splatIndex = 0; splatIndex < count; splatIndex++) {
    rotations[splatIndex * 4] = 1;
  }
  return rotations;
}

/** Decodes Spark's scale8 byte encoding. */
function decodeScale8(scale: number, min: number, max: number): number {
  if (scale === 0) {
    return 0;
  }
  const logScaleStep = (max - min) / 254;
  return Math.exp(min + (scale - 1) * logScaleStep);
}

/** Decodes Spark's oct888 quaternion encoding into `[x, y, z, w]`. */
function decodeQuatOct888(u: number, v: number, r: number): [number, number, number, number] {
  let x = (u / 255) * 2 - 1;
  let y = (v / 255) * 2 - 1;
  const z = 1 - Math.abs(x) - Math.abs(y);
  const t = Math.max(-z, 0);
  x = x >= 0 ? x - t : x + t;
  y = y >= 0 ? y - t : y + t;
  const length = Math.hypot(x, y, z);
  const axisX = length > Number.EPSILON ? x / length : 1;
  const axisY = length > Number.EPSILON ? y / length : 0;
  const axisZ = length > Number.EPSILON ? z / length : 0;
  const halfTheta = (r / 255) * 0.5 * Math.PI;
  const sinHalfTheta = Math.sin(halfTheta);
  return [axisX * sinHalfTheta, axisY * sinHalfTheta, axisZ * sinHalfTheta, Math.cos(halfTheta)];
}

/** Returns a named property or throws. */
function requireRADProperty(metadata: RADChunkMetadata, propertyName: string): RADChunkProperty {
  const property = findRADProperty(metadata, propertyName);
  if (!property) {
    throw new Error(`RADLoader: RADC chunk is missing ${propertyName} property.`);
  }
  return property;
}

/** Returns a named property when present. */
function findRADProperty(
  metadata: RADChunkMetadata,
  propertyName: string
): RADChunkProperty | undefined {
  return metadata.properties.find(property => property.property === propertyName);
}

/** Merges source-level splat encoding with chunk-local encoding. */
function getRADChunkDecodeMetadata(
  metadata: RADChunkMetadata,
  options?: RADChunkDecodeOptions
): RADChunkMetadata {
  const splatEncoding = options?.radChunk?.splatEncoding;
  if (!splatEncoding) {
    return metadata;
  }
  return {
    ...metadata,
    splatEncoding: {
      ...splatEncoding,
      ...metadata.splatEncoding
    }
  };
}

/** Returns a required quantization minimum. */
function getPropertyMin(metadata: RADChunkMetadata, property: RADChunkProperty): number {
  if (property.min === undefined) {
    const fallback = getSplatEncodingMinimum(metadata.splatEncoding, property.property);
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`RADLoader: RADC property ${property.property} is missing min.`);
  }
  return property.min;
}

/** Returns a required quantization maximum. */
function getPropertyMax(metadata: RADChunkMetadata, property: RADChunkProperty): number {
  if (property.max === undefined) {
    const fallback = getSplatEncodingMaximum(metadata.splatEncoding, property.property);
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`RADLoader: RADC property ${property.property} is missing max.`);
  }
  return property.max;
}

/** Returns a source-level minimum value for a quantized RAD property. */
function getSplatEncodingMinimum(
  splatEncoding: RADSplatEncoding | undefined,
  propertyName: string
): number | undefined {
  switch (propertyName) {
    case 'rgb':
      return splatEncoding?.rgbMin;
    case 'scales':
      return splatEncoding?.lnScaleMin;
    default:
      return undefined;
  }
}

/** Returns a source-level maximum value for a quantized RAD property. */
function getSplatEncodingMaximum(
  splatEncoding: RADSplatEncoding | undefined,
  propertyName: string
): number | undefined {
  switch (propertyName) {
    case 'rgb':
      return splatEncoding?.rgbMax;
    case 'scales':
      return splatEncoding?.lnScaleMax;
    case 'sh1':
      return splatEncoding?.sh1Max;
    case 'sh2':
      return splatEncoding?.sh2Max;
    case 'sh3':
      return splatEncoding?.sh3Max;
    default:
      return undefined;
  }
}

/** Clamps a normalized color component into an unorm8 byte. */
function normalizeColorByte(value: number): number {
  return Math.round(Math.min(Math.max(value, 0), 1) * 255);
}

/** Copies a byte view into a standalone ArrayBuffer. */
function copyToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

/** Converts an ArrayBuffer-like value into a Uint8Array view. */
function getUint8Array(data: ArrayBuffer | ArrayBufferView): Uint8Array {
  return data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}
