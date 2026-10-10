// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BrotliDecompressor} from '@loaders.gl/compression';
import type {Mesh, MeshAttribute} from '@loaders.gl/schema';
import type {Potree2AttributeType, Potree2Metadata, Potree2HierarchyNode} from '../potree2-types';

/** Scalar constructors and little-endian readers for all Potree 2.0 wire types. */
export const POTREE2_TYPES = {
  int8: {
    bytes: 1,
    Constructor: Int8Array,
    read: (view: DataView, offset: number) => view.getInt8(offset)
  },
  uint8: {
    bytes: 1,
    Constructor: Uint8Array,
    read: (view: DataView, offset: number) => view.getUint8(offset)
  },
  int16: {
    bytes: 2,
    Constructor: Int16Array,
    read: (view: DataView, offset: number) => view.getInt16(offset, true)
  },
  uint16: {
    bytes: 2,
    Constructor: Uint16Array,
    read: (view: DataView, offset: number) => view.getUint16(offset, true)
  },
  int32: {
    bytes: 4,
    Constructor: Int32Array,
    read: (view: DataView, offset: number) => view.getInt32(offset, true)
  },
  uint32: {
    bytes: 4,
    Constructor: Uint32Array,
    read: (view: DataView, offset: number) => view.getUint32(offset, true)
  },
  int64: {
    bytes: 8,
    Constructor: BigInt64Array,
    read: (view: DataView, offset: number) => view.getBigInt64(offset, true)
  },
  uint64: {
    bytes: 8,
    Constructor: BigUint64Array,
    read: (view: DataView, offset: number) => view.getBigUint64(offset, true)
  },
  float: {
    bytes: 4,
    Constructor: Float32Array,
    read: (view: DataView, offset: number) => view.getFloat32(offset, true)
  },
  double: {
    bytes: 8,
    Constructor: Float64Array,
    read: (view: DataView, offset: number) => view.getFloat64(offset, true)
  }
} as const;

/** Validates a finite ordered XYZ tuple. */
function isTriple(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
}

/** Parses and validates Potree 2.0 metadata before any point allocation. */
export function parsePotree2Metadata(text: string): Potree2Metadata {
  const metadata = JSON.parse(text.replace(/^\uFEFF/, '')) as Potree2Metadata;
  if (
    !metadata ||
    metadata.version !== '2.0' ||
    !Number.isSafeInteger(metadata.points) ||
    metadata.points < 0 ||
    !Number.isFinite(metadata.spacing) ||
    metadata.spacing <= 0 ||
    !isTriple(metadata.scale) ||
    metadata.scale.some(value => value <= 0) ||
    !isTriple(metadata.offset) ||
    !isTriple(metadata.boundingBox?.min) ||
    !isTriple(metadata.boundingBox?.max) ||
    metadata.boundingBox.min.some((value, axis) => value > metadata.boundingBox.max[axis]) ||
    !['DEFAULT', 'BROTLI'].includes(metadata.encoding) ||
    !Array.isArray(metadata.attributes) ||
    !Number.isSafeInteger(metadata.hierarchy?.firstChunkSize) ||
    metadata.hierarchy.firstChunkSize < 22 ||
    metadata.hierarchy.firstChunkSize % 22 ||
    !Number.isSafeInteger(metadata.hierarchy.stepSize) ||
    metadata.hierarchy.stepSize < 1 ||
    !Number.isSafeInteger(metadata.hierarchy.depth) ||
    metadata.hierarchy.depth < 0 ||
    metadata.hierarchy.depth > 64 ||
    !Number.isFinite(
      Math.hypot(
        ...metadata.boundingBox.min.map((value, axis) => metadata.boundingBox.max[axis] - value)
      )
    )
  )
    throw new Error('Invalid Potree 2.0 metadata');
  const names = new Set<string>();
  for (const attribute of metadata.attributes) {
    const type = POTREE2_TYPES[attribute.type as Potree2AttributeType];
    if (
      !type ||
      typeof attribute.name !== 'string' ||
      !attribute.name ||
      ['__proto__', 'constructor', 'prototype', 'POSITION', 'COLOR_0'].includes(attribute.name) ||
      names.has(attribute.name) ||
      !Number.isSafeInteger(attribute.numElements) ||
      attribute.numElements < 1 ||
      attribute.numElements > 16 ||
      attribute.elementSize !== type.bytes ||
      attribute.size !== type.bytes * attribute.numElements
    )
      throw new Error('Invalid Potree 2.0 attribute layout');
    names.add(attribute.name);
  }
  if (names.has('rgb') && names.has('rgba')) throw new Error('Duplicate Potree RGB attributes');
  const position = metadata.attributes.find(attribute => attribute.name === 'position');
  if (!position || position.type !== 'int32' || position.numElements !== 3)
    throw new Error('Potree 2.0 requires int32 XYZ position');
  const color = metadata.attributes.find(
    attribute => attribute.name === 'rgb' || attribute.name === 'rgba'
  );
  if (color && (color.type !== 'uint16' || ![3, 4].includes(color.numElements)))
    throw new Error('Potree 2.0 RGB requires uint16 components');
  return metadata;
}

/** Reads a checked hierarchy page, keeping 64-bit ranges exact and validating BFS ownership. */
export function parsePotree2Hierarchy(
  data: ArrayBuffer,
  rootId = 'r',
  maxNodes = 100000
): Potree2HierarchyNode[] {
  if (
    !/^r[0-7]*$/.test(rootId) ||
    rootId.length > 65 ||
    !Number.isSafeInteger(maxNodes) ||
    maxNodes < 1 ||
    !data.byteLength ||
    data.byteLength % 22 ||
    data.byteLength / 22 > maxNodes
  )
    throw new Error('Invalid Potree 2.0 hierarchy page');
  const view = new DataView(data);
  const queue = [rootId];
  const nodes: Potree2HierarchyNode[] = [];
  for (let offset = 0; offset < data.byteLength; offset += 22) {
    const id = queue[nodes.length];
    const type = view.getUint8(offset);
    const childMask = view.getUint8(offset + 1);
    if (!id || id.length > 65 || type > 2 || (type === 1 && childMask))
      throw new Error('Invalid Potree 2.0 hierarchy topology');
    const node = {
      id,
      type: type as 0 | 1 | 2,
      childMask,
      pointCount: view.getUint32(offset + 2, true),
      byteOffset: view.getBigUint64(offset + 6, true),
      byteSize: view.getBigUint64(offset + 14, true)
    };
    if (type === 2 && (!node.byteSize || node.byteSize % 22n))
      throw new Error('Invalid Potree 2.0 hierarchy proxy');
    // PotreeConverter can report stale counts for empty inner nodes (upstream issue #1125).
    if (type !== 2 && node.byteSize === 0n) node.pointCount = 0;
    nodes.push(node);
    if (type !== 2)
      for (let octant = 0; octant < 8; octant++)
        if (childMask & (1 << octant)) queue.push(`${id}${octant}`);
    if (queue.length > maxNodes) throw new Error('Potree 2.0 hierarchy node budget exceeded');
  }
  if (queue.length !== nodes.length) throw new Error('Truncated Potree 2.0 hierarchy page');
  return nodes;
}

/** Decodes one Morton component without rounding 64-bit words through Number. */
function decodeMorton(value: bigint, bits: number, axis: number): bigint {
  let component = 0n;
  for (let bit = 0; bit < bits; bit++)
    component |= ((value >> BigInt(bit * 3 + axis)) & 1n) << BigInt(bit);
  return component;
}

/** Gets the uncompressed wire row width for a declared encoding. */
export function getPotree2PointSize(metadata: Potree2Metadata): number {
  return metadata.attributes.reduce(
    (size, attribute) =>
      size +
      (metadata.encoding === 'BROTLI' && attribute.name === 'position'
        ? 16
        : metadata.encoding === 'BROTLI' && ['rgb', 'rgba'].includes(attribute.name)
          ? 8
          : attribute.size),
    0
  );
}

/** Decodes default interleaved or Brotli/Morton point bytes, preserving native Float64 positions and scalar widths. */
export async function parsePotree2Points(
  data: ArrayBuffer,
  metadata: Potree2Metadata,
  pointCount: number,
  maxDecodedBytes = 64 * 1024 * 1024
): Promise<Mesh> {
  const attributeBytes = metadata.attributes.reduce(
    (bytes, attribute) => bytes + (attribute.name === 'position' ? 24 : attribute.size),
    0
  );
  if (
    !Number.isSafeInteger(maxDecodedBytes) ||
    maxDecodedBytes < 1 ||
    pointCount * attributeBytes > maxDecodedBytes ||
    !Number.isSafeInteger(pointCount) ||
    pointCount < 0 ||
    pointCount * getPotree2PointSize(metadata) > maxDecodedBytes
  )
    throw new Error('Potree 2.0 decoded point budget exceeded');
  const decoded =
    metadata.encoding === 'BROTLI' && data.byteLength
      ? await new BrotliDecompressor().decompress(data)
      : data;
  const pointSize = getPotree2PointSize(metadata);
  if (decoded.byteLength !== pointCount * pointSize)
    throw new Error('Invalid Potree 2.0 point byte length');
  const view = new DataView(decoded);
  const attributes: Mesh['attributes'] = Object.create(null);
  const interleavedSize = metadata.attributes.reduce((size, attribute) => size + attribute.size, 0);
  let attributeOffset = 0;
  for (const attribute of metadata.attributes) {
    const position = attribute.name === 'position';
    const color = ['rgb', 'rgba'].includes(attribute.name);
    if (metadata.encoding === 'BROTLI' && color && attribute.numElements !== 3)
      throw new Error('Potree Brotli RGB requires three components');
    const Constructor = position ? Float64Array : POTREE2_TYPES[attribute.type].Constructor;
    const value = new Constructor(pointCount * attribute.numElements);
    for (let row = 0; row < pointCount; row++) {
      const offset =
        metadata.encoding === 'DEFAULT'
          ? row * interleavedSize + attributeOffset
          : attributeOffset + row * (position ? 16 : color ? 8 : attribute.size);
      const morton =
        metadata.encoding === 'BROTLI' && (position || color)
          ? position
            ? (view.getBigUint64(offset, true) << 48n) |
              (view.getBigUint64(offset + 8, true) & ((1n << 48n) - 1n))
            : view.getBigUint64(offset, true)
          : 0n;
      for (let axis = 0; axis < attribute.numElements; axis++) {
        const component =
          metadata.encoding === 'BROTLI' && (position || color)
            ? position
              ? Number(BigInt.asIntN(32, decodeMorton(morton, 32, axis)))
              : Number(decodeMorton(morton, 16, axis))
            : POTREE2_TYPES[attribute.type].read(view, offset + axis * attribute.elementSize);
        const target = value as unknown as {[index: number]: number | bigint};
        target[row * attribute.numElements + axis] = position
          ? Number(component) * metadata.scale[axis] + metadata.offset[axis]
          : component;
        if (position && !Number.isFinite(Number(target[row * 3 + axis])))
          throw new Error('Nonfinite Potree 2.0 position');
      }
    }
    const meshAttribute = {
      value,
      size: attribute.numElements,
      ...(color || attribute.normalized === true ? {normalized: true} : {})
    } as MeshAttribute;
    attributes[attribute.name] = meshAttribute;
    if (position) attributes.POSITION = meshAttribute;
    if (color) attributes.COLOR_0 = meshAttribute;
    attributeOffset +=
      metadata.encoding === 'DEFAULT'
        ? attribute.size
        : pointCount * (position ? 16 : color ? 8 : attribute.size);
  }
  return {
    loader: 'potree',
    topology: 'point-list',
    mode: 0,
    header: {vertexCount: pointCount},
    schema: {fields: [], metadata: {projection: metadata.projection || ''}},
    loaderData: {
      version: metadata.version,
      encoding: metadata.encoding,
      projection: metadata.projection
    },
    attributes
  };
}
