// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh, MeshArrowTable, MeshAttribute} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {PotreeAttribute, PotreeMetadata} from './types/potree-metadata';
import type {Potree2Attribute, Potree2AttributeType, Potree2Metadata} from './potree2-types';

/** One additive octree node supplied by an application or dynamic tiler. */
export type PotreeWriterNode = {
  /** Root r followed by XYZ octant digits 4/2/1. */
  readonly id: string;
  /** Decoded rows belonging exclusively to this node. */
  readonly mesh: Mesh | MeshArrowTable;
};

/** Complete typed file collection; applications own storage or archive packaging. */
export type PotreeDataset = {
  /** cloud.js for 1.x, metadata.json for 2.0. */
  readonly metadataPath: string;
  /** Dataset declaration. */
  readonly metadata: PotreeMetadata | Potree2Metadata;
  /** Relative filenames and complete bytes. */
  readonly files: ReadonlyMap<string, Uint8Array>;
};

/** Dataset authoring controls. Encoded output is bounded; input and temporary heap are caller-owned. */
export type PotreeWriterOptions = WriterOptions & {
  /** Wire-version, precision and hierarchy choices. */
  potree?: {
    /** Dataset version, 1.0 through 1.8 or 2.0; default 2.0. */
    version?: string;
    /** XYZ quantization scales; default 0.001 per axis. Legacy versions require equal scales. */
    scale?: [number, number, number];
    /** Maximum positional rounding error; defaults to half the largest scale. */
    maxPositionError?: number;
    /** Hierarchy page depth, 1–24; default 5. */
    hierarchyStepSize?: number;
    /** Root spacing in source units; defaults to cube width / 128 or 1 for empty/coincident input. */
    spacing?: number;
    /** Explicit CRS declaration; no CRS is inferred. */
    projection?: string;
    /** Maximum complete output bytes; default 256 MiB. */
    maxOutputBytes?: number;
    /** Maximum node count; default 100000. */
    maxNodes?: number;
    /** Cancellation between node encodes. */
    signal?: AbortSignal;
  };
};

// @ts-ignore __VERSION__ is injected by the package build.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Standard JSON metadata writer; use encodePotreeDataset for a complete dataset. */
export const PotreeWriter = {
  name: 'Potree metadata',
  id: 'potree',
  module: 'potree',
  version: VERSION,
  extensions: ['js', 'json'],
  mimeTypes: ['application/json'],
  dataType: null as unknown as PotreeMetadata | Potree2Metadata,
  batchType: null as never,
  options: {},
  /** Encodes one already validated dataset declaration. */
  encode: async (metadata: PotreeMetadata | Potree2Metadata) => encodeMetadata(metadata),
  encodeSync: encodeMetadata
} as const satisfies WriterWithEncoder<PotreeMetadata | Potree2Metadata>;

/** Encodes metadata as UTF-8 JSON. */
function encodeMetadata(metadata: PotreeMetadata | Potree2Metadata): ArrayBuffer {
  return new TextEncoder().encode(JSON.stringify(metadata, null, 2)).buffer;
}

/** Internal checked writer attribute accessor. */
type WriterAttribute = {
  /** Wire description. */
  description: Potree2Attribute;
  /** Source attribute name. */
  sourceName: string;
  /** Color conversion multiplier. */
  multiplier: number;
};

/** All scalar arrays representable by the modern wire layout. */
type WireArray = MeshAttribute['value'] | BigInt64Array | BigUint64Array;

/** Supported scalar constructors in declaration order. */
const WIRE_TYPES: [Potree2AttributeType, new (length: number) => WireArray, number][] = [
  ['int8', Int8Array, 1],
  ['uint8', Uint8Array, 1],
  ['int16', Int16Array, 2],
  ['uint16', Uint16Array, 2],
  ['int32', Int32Array, 4],
  ['uint32', Uint32Array, 4],
  ['int64', BigInt64Array, 8],
  ['uint64', BigUint64Array, 8],
  ['float', Float32Array, 4],
  ['double', Float64Array, 8]
];

/** Validates decoded rows and layouts before writing any point bytes. */
function getMesh(input: Mesh | MeshArrowTable): Mesh {
  if ('shape' in input) {
    /** Rejects null rows and components before Arrow conversion can replace them. */
    type NullableColumn = {nullCount: number; children: readonly NullableColumn[]};
    const checkNulls = (data: NullableColumn): void => {
      if (data.nullCount) throw new Error('Potree writer cannot preserve null point attributes');
      for (const child of data.children) checkNulls(child);
    };
    for (const batch of input.data.batches) checkNulls(batch.data);
  }
  const mesh = 'shape' in input ? convertTableToMesh(input) : input;
  const position = mesh.attributes.POSITION;
  if (
    mesh.topology !== 'point-list' ||
    mesh.indices ||
    !position ||
    position.size !== 3 ||
    !(position.value instanceof Float32Array || position.value instanceof Float64Array) ||
    position.normalized ||
    position.transform
  )
    throw new Error('Potree writer requires decoded unindexed floating XYZ points');
  if (!mesh.header && (position.byteStride || position.byteOffset))
    throw new Error('Strided Potree input requires vertexCount');
  const count = getCount(mesh);
  if (!Number.isSafeInteger(count) || count < 0 || count > 0xffffffff)
    throw new Error('Invalid Potree point count');
  for (const attribute of Object.values(mesh.attributes)) {
    const bytes = attribute.value?.BYTES_PER_ELEMENT;
    const stride = attribute.byteStride || attribute.size * bytes;
    const offset = attribute.byteOffset || 0;
    if (
      !bytes ||
      !WIRE_TYPES.some(([, Constructor]) => attribute.value instanceof Constructor) ||
      !Number.isSafeInteger(attribute.size) ||
      attribute.size < 1 ||
      attribute.size > 16 ||
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      offset % bytes ||
      !Number.isSafeInteger(stride) ||
      stride < attribute.size * bytes ||
      stride % bytes ||
      attribute.transform ||
      attribute.componentType === 'float16' ||
      (count && offset + (count - 1) * stride + attribute.size * bytes > attribute.value.byteLength)
    )
      throw new Error('Invalid or unsupported Potree attribute layout');
  }
  return mesh;
}

/** Returns the validated source row count. */
function getCount(mesh: Mesh): number {
  return mesh.header?.vertexCount ?? mesh.attributes.POSITION.value.length / 3;
}

/** Reads one component without converting integer IDs through Number. */
function readComponent(attribute: MeshAttribute, row: number, component: number): number | bigint {
  return attribute.value[
    (attribute.byteOffset || 0) / attribute.value.BYTES_PER_ELEMENT +
      (row * (attribute.byteStride || attribute.size * attribute.value.BYTES_PER_ELEMENT)) /
        attribute.value.BYTES_PER_ELEMENT +
      component
  ];
}

/** Creates a canonical 2.0 layout, retaining custom scalar types and normalization metadata. */
function getAttributes(mesh: Mesh): WriterAttribute[] {
  const attributes: WriterAttribute[] = [];
  for (const [name, attribute] of Object.entries(mesh.attributes).sort(
    ([left], [right]) =>
      (left === 'POSITION' ? -2 : left === 'COLOR_0' ? -1 : 0) -
        (right === 'POSITION' ? -2 : right === 'COLOR_0' ? -1 : 0) || left.localeCompare(right)
  )) {
    if (
      name !== 'POSITION' &&
      attribute.value === mesh.attributes.POSITION.value &&
      ['position', 'POSITION_CARTESIAN'].includes(name)
    )
      continue;
    if (
      name !== 'COLOR_0' &&
      attribute.value === mesh.attributes.COLOR_0?.value &&
      ['rgb', 'rgba', 'RGB_PACKED', 'RGBA_PACKED', 'COLOR_PACKED'].includes(name)
    )
      continue;
    const position = name === 'POSITION';
    const color = name === 'COLOR_0';
    if (
      !position &&
      !color &&
      ['position', 'rgb', 'rgba', '__proto__', 'constructor', 'prototype'].includes(name)
    )
      throw new Error('Reserved Potree attribute name requires an explicit mapping');
    if (
      color &&
      (![3, 4].includes(attribute.size) ||
        !(attribute.value instanceof Uint8Array || attribute.value instanceof Uint16Array))
    )
      throw new Error('Potree RGB requires three or four uint8/uint16 components');
    const [type, , elementSize] = position
      ? WIRE_TYPES[4]
      : color
        ? WIRE_TYPES[3]
        : WIRE_TYPES.find(([, Constructor]) => attribute.value instanceof Constructor)!;
    const multiplier = color && attribute.value instanceof Uint8Array ? 257 : 1;
    const minimum = Array.from({length: attribute.size}, () => Infinity);
    const maximum = Array.from({length: attribute.size}, () => -Infinity);
    for (let row = 0; row < getCount(mesh); row++)
      for (let axis = 0; axis < attribute.size; axis++) {
        const value = Number(readComponent(attribute, row, axis)) * multiplier;
        if (!Number.isFinite(value)) throw new Error('Nonfinite Potree point attribute');
        minimum[axis] = Math.min(minimum[axis], value);
        maximum[axis] = Math.max(maximum[axis], value);
      }
    if (!getCount(mesh)) {
      minimum.fill(0);
      maximum.fill(0);
    }
    attributes.push({
      sourceName: name,
      multiplier,
      description: {
        name: position ? 'position' : color ? (attribute.size === 3 ? 'rgb' : 'rgba') : name,
        type,
        numElements: attribute.size,
        elementSize,
        size: attribute.size * elementSize,
        min: minimum,
        max: maximum,
        normalized: color || Boolean(attribute.normalized)
      }
    });
  }
  return attributes;
}

/** Writes one scalar in the format's required little-endian order. */
function writeComponent(
  view: DataView,
  offset: number,
  type: Potree2AttributeType,
  value: number | bigint
): void {
  switch (type) {
    case 'int8':
      view.setInt8(offset, Number(value));
      break;
    case 'uint8':
      view.setUint8(offset, Number(value));
      break;
    case 'int16':
      view.setInt16(offset, Number(value), true);
      break;
    case 'uint16':
      view.setUint16(offset, Number(value), true);
      break;
    case 'int32':
      view.setInt32(offset, Number(value), true);
      break;
    case 'uint32':
      view.setUint32(offset, Number(value), true);
      break;
    case 'int64':
      view.setBigInt64(offset, BigInt(value), true);
      break;
    case 'uint64':
      view.setBigUint64(offset, BigInt(value), true);
      break;
    case 'float':
      view.setFloat32(offset, Number(value), true);
      break;
    case 'double':
      view.setFloat64(offset, Number(value), true);
      break;
  }
}

/** Resolves the published dataset family independently from converter/viewer release numbers. */
function getVersion(version: string): number {
  const legacy = /^1\.([0-8])(?:\.\d+)?(?:RC\d*)?$/.exec(version);
  if (version === '2.0') return 20;
  if (!legacy) throw new Error('Potree writer supports dataset versions 1.0–1.8 and 2.0');
  return Number(legacy[1]);
}

/** Converts native coordinates to checked quantized components, or legacy absolute float32. */
function encodePosition(
  value: number,
  axis: number,
  origin: number[],
  scale: number[],
  version: number,
  maxError: number
): number {
  const encoded =
    version <= 3 ? Math.fround(value) : Math.round((value - origin[axis]) / scale[axis]);
  const decoded = version <= 3 ? encoded : encoded * scale[axis] + origin[axis];
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(encoded) ||
    Math.abs(decoded - value) > maxError + Number.EPSILON * Math.abs(value) ||
    (version > 3 &&
      (!Number.isSafeInteger(encoded) ||
        encoded < 0 ||
        encoded > (version === 20 ? 0x7fffffff : 0xffffffff)))
  )
    throw new Error('Potree position exceeds precision or quantization range');
  return encoded;
}

/** Gets a legacy attribute name and required layout, rejecting unrepresentable attributes. */
function getLegacyAttribute(
  attribute: WriterAttribute,
  mesh: Mesh,
  version: number
): {name: PotreeAttribute; type: Potree2AttributeType; size: number} {
  const source = mesh.attributes[attribute.sourceName];
  if (attribute.sourceName === 'POSITION')
    return {name: 'POSITION_CARTESIAN', type: 'uint32', size: 12};
  if (attribute.sourceName === 'COLOR_0') {
    if (!(source.value instanceof Uint8Array))
      throw new Error('Legacy Potree RGB requires explicit uint8 mapping');
    return {
      name: version <= 3 ? 'COLOR_PACKED' : source.size === 3 ? 'RGB_PACKED' : 'RGBA_PACKED',
      type: 'uint8',
      size: version <= 3 ? 4 : source.size
    };
  }
  if (version <= 3) throw new Error('Early Potree binary output supports positions and RGBA only');
  const layouts: Partial<Record<string, [Potree2AttributeType, number, number]>> = {
    INTENSITY: ['uint16', 1, 2],
    CLASSIFICATION: ['uint8', 1, 1],
    NORMAL: ['float', 3, 12],
    NORMAL_FLOATS: ['float', 3, 12],
    NORMAL_SPHEREMAPPED: ['uint8', 2, 2],
    NORMAL_OCT16: ['uint16', 1, 2],
    FILLER_1B: ['uint8', 1, 1]
  };
  const layout = layouts[attribute.sourceName];
  if (
    !layout ||
    layout[0] !== attribute.description.type ||
    layout[1] !== source.size ||
    source.normalized
  )
    throw new Error(
      `Legacy Potree cannot preserve attribute ${attribute.sourceName}; map it explicitly`
    );
  return {name: attribute.sourceName as PotreeAttribute, type: layout[0], size: layout[2]};
}

/** Encodes one checked node under a shared declared layout. */
function encodePoints(
  mesh: Mesh,
  attributes: WriterAttribute[],
  version: number,
  origin: number[],
  scale: number[],
  maxError: number,
  limit: number
): Uint8Array {
  const legacy =
    version !== 20
      ? attributes.map(attribute => getLegacyAttribute(attribute, mesh, version))
      : null;
  const pointSize = attributes.reduce(
    (size, attribute, index) => size + (legacy ? legacy[index].size : attribute.description.size),
    0
  );
  const byteLength = getCount(mesh) * pointSize;
  if (!Number.isSafeInteger(byteLength) || byteLength > limit)
    throw new Error('Potree output byte budget exceeded');
  const bytes = new Uint8Array(byteLength);
  const view = new DataView(bytes.buffer);
  for (let row = 0; row < getCount(mesh); row++) {
    let offset = row * pointSize;
    for (let index = 0; index < attributes.length; index++) {
      const attribute = attributes[index];
      const source = mesh.attributes[attribute.sourceName];
      const type =
        attribute.sourceName === 'POSITION'
          ? version <= 3
            ? 'float'
            : version === 20
              ? 'int32'
              : 'uint32'
          : legacy
            ? legacy[index].type
            : attribute.description.type;
      const bytesPerElement = legacy
        ? WIRE_TYPES.find(([wireType]) => wireType === type)![2]
        : attribute.description.elementSize;
      for (let axis = 0; axis < source.size; axis++) {
        let value = readComponent(source, row, axis);
        if (attribute.sourceName === 'POSITION')
          value = encodePosition(Number(value), axis, origin, scale, version, maxError);
        else if (!legacy && attribute.multiplier !== 1)
          value = Number(value) * attribute.multiplier;
        writeComponent(view, offset + axis * bytesPerElement, type, value);
      }
      if (legacy && version <= 3 && attribute.sourceName === 'COLOR_0' && source.size === 3)
        view.setUint8(offset + 3, 255);
      offset += legacy ? legacy[index].size : attribute.description.size;
    }
  }
  return bytes;
}

/** Gets node bounds from the dataset cube without reprojecting points. */
function getBounds(id: string, minimum: number[], maximum: number[]): [number[], number[]] {
  const bounds = [[...minimum], [...maximum]] as [number[], number[]];
  for (const digit of id.slice(1))
    for (let axis = 0; axis < 3; axis++) {
      const midpoint = bounds[0][axis] + (bounds[1][axis] - bounds[0][axis]) / 2;
      bounds[Number(digit) & (4 >> axis) ? 0 : 1][axis] = midpoint;
    }
  return bounds;
}

/** Resolves a legacy paged node's directory. */
function getDirectory(id: string, step: number): string {
  const digits = id.slice(1);
  let directory = 'data/r';
  for (let offset = 0; offset + step <= digits.length; offset += step)
    directory += `/${digits.slice(offset, offset + step)}`;
  return directory;
}

/**
 * Writes complete Potree 1.x or 2.0 file collections using typed arrays only.
 * A Mesh/Arrow input creates a single root. Supply connected additive nodes for an existing octree.
 * This preserves point ownership supplied by the caller; it does not sample or duplicate points.
 * Version 2.0 output uses DEFAULT encoding; readers also accept upstream BROTLI data.
 */
export async function encodePotreeDataset(
  input: Mesh | MeshArrowTable | readonly PotreeWriterNode[],
  options: PotreeWriterOptions = {}
): Promise<PotreeDataset> {
  const settings = options.potree || {};
  const versionString = settings.version || '2.0';
  const version = getVersion(versionString);
  const scale = settings.scale || [0.001, 0.001, 0.001];
  const step = settings.hierarchyStepSize ?? 5;
  const maxError = settings.maxPositionError ?? Math.max(...scale) / 2;
  const maxBytes = settings.maxOutputBytes ?? 256 * 1024 * 1024;
  const maxNodes = settings.maxNodes ?? 100000;
  if (
    scale.length !== 3 ||
    scale.some(value => !Number.isFinite(value) || value <= 0) ||
    !Number.isFinite(maxError) ||
    maxError < 0 ||
    !Number.isSafeInteger(step) ||
    step < 1 ||
    step > 24 ||
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < 1 ||
    !Number.isSafeInteger(maxNodes) ||
    maxNodes < 1 ||
    (version !== 20 && scale.some(value => value !== scale[0])) ||
    (settings.spacing !== undefined &&
      (!Number.isFinite(settings.spacing) || settings.spacing <= 0))
  )
    throw new Error('Invalid Potree writer options');
  settings.signal?.throwIfAborted();
  const supplied = Array.isArray(input)
    ? (input as readonly PotreeWriterNode[])
    : [{id: 'r', mesh: input as Mesh | MeshArrowTable}];
  if (!supplied.length || supplied.length > maxNodes)
    throw new Error('Potree writer node budget exceeded');
  const nodes = supplied
    .map(node => ({id: node.id, mesh: getMesh(node.mesh)}))
    .sort((left, right) => left.id.length - right.id.length || left.id.localeCompare(right.id));
  if (version <= 3)
    for (const node of nodes)
      if (!node.mesh.attributes.COLOR_0) {
        if (getCount(node.mesh) * 16 > maxBytes)
          throw new Error('Potree output byte budget exceeded');
        node.mesh = {
          ...node.mesh,
          attributes: {
            ...node.mesh.attributes,
            COLOR_0: {
              size: 4,
              value: new Uint8Array(getCount(node.mesh) * 4).fill(255),
              normalized: true
            }
          }
        };
      }
  const ids = new Set(nodes.map(node => node.id));
  if (
    ids.size !== nodes.length ||
    nodes[0].id !== 'r' ||
    nodes.some(
      node => !/^r[0-7]{0,24}$/.test(node.id) || (node.id !== 'r' && !ids.has(node.id.slice(0, -1)))
    )
  )
    throw new Error('Potree writer requires a unique connected octree rooted at r');
  if (nodes.reduce((bytes, node) => bytes + getCount(node.mesh) * 12, 0) > maxBytes)
    throw new Error('Potree output byte budget exceeded');
  const attributes = getAttributes(nodes[0].mesh);
  for (const attribute of attributes) {
    attribute.description.min!.fill(Infinity);
    attribute.description.max!.fill(-Infinity);
  }
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  let pointCount = 0;
  for (const node of nodes) {
    const layout = getAttributes(node.mesh);
    if (
      JSON.stringify(
        layout.map(attribute => [
          attribute.sourceName,
          attribute.description.type,
          attribute.description.numElements,
          attribute.multiplier,
          attribute.description.normalized
        ])
      ) !==
      JSON.stringify(
        attributes.map(attribute => [
          attribute.sourceName,
          attribute.description.type,
          attribute.description.numElements,
          attribute.multiplier,
          attribute.description.normalized
        ])
      )
    )
      throw new Error('Potree nodes require the same attribute layout');
    pointCount += getCount(node.mesh);
    for (let index = 0; index < attributes.length; index++)
      for (let axis = 0; axis < attributes[index].description.numElements; axis++)
        if (getCount(node.mesh)) {
          attributes[index].description.min![axis] = Math.min(
            attributes[index].description.min![axis],
            layout[index].description.min![axis]
          );
          attributes[index].description.max![axis] = Math.max(
            attributes[index].description.max![axis],
            layout[index].description.max![axis]
          );
        }
    for (let row = 0; row < getCount(node.mesh); row++)
      for (let axis = 0; axis < 3; axis++) {
        const value = Number(readComponent(node.mesh.attributes.POSITION, row, axis));
        minimum[axis] = Math.min(minimum[axis], value);
        maximum[axis] = Math.max(maximum[axis], value);
      }
  }
  if (!Number.isSafeInteger(pointCount)) throw new Error('Potree dataset point count overflow');
  if (!pointCount) {
    for (const attribute of attributes) {
      attribute.description.min!.fill(0);
      attribute.description.max!.fill(0);
    }
    minimum.fill(0);
    maximum.fill(0);
  }
  const width = Math.max(...minimum.map((value, axis) => maximum[axis] - value));
  if (!Number.isFinite(width)) throw new Error('Potree coordinate extent overflow');
  for (let axis = 0; axis < 3; axis++) maximum[axis] = minimum[axis] + width;
  if (!maximum.every(Number.isFinite)) throw new Error('Potree coordinate extent overflow');
  const spacing = settings.spacing ?? (width / 128 || 1);
  const files = new Map<string, Uint8Array>();
  let consumed = 0;
  /** Commits one complete resource against the aggregate output ceiling. */
  const addFile = (name: string, bytes: Uint8Array): void => {
    if (bytes.byteLength > maxBytes - consumed)
      throw new Error('Potree output byte budget exceeded');
    consumed += bytes.byteLength;
    files.set(name, bytes);
  };
  const ranges = new Map<string, {offset: number; size: number}>();
  const contents: Uint8Array[] = [];
  let octreeSize = 0;
  for (const node of nodes) {
    settings.signal?.throwIfAborted();
    const bounds = getBounds(node.id, minimum, maximum);
    for (let row = 0; row < getCount(node.mesh); row++)
      for (let axis = 0; axis < 3; axis++) {
        const value = Number(readComponent(node.mesh.attributes.POSITION, row, axis));
        if (value < bounds[0][axis] || value > bounds[1][axis])
          throw new Error('Potree node points lie outside their octant');
      }
    const bytes = encodePoints(
      node.mesh,
      attributes,
      version,
      version === 20 ? minimum : bounds[0],
      scale,
      maxError,
      maxBytes - consumed - octreeSize
    );
    if (version === 20) {
      ranges.set(node.id, {offset: octreeSize, size: bytes.byteLength});
      contents.push(bytes);
      octreeSize += bytes.byteLength;
    } else
      addFile(
        version >= 5
          ? `${getDirectory(node.id, step)}/${node.id}.bin`
          : `data/${node.id}${version >= 4 ? '.bin' : ''}`,
        bytes
      );
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
  settings.signal?.throwIfAborted();
  /** Declares actual immediate children, including hierarchy page boundaries. */
  const getMask = (id: string): number => {
    let mask = 0;
    for (let octant = 0; octant < 8; octant++) if (ids.has(`${id}${octant}`)) mask |= 1 << octant;
    return mask;
  };
  let metadata: PotreeMetadata | Potree2Metadata;
  if (version === 20) {
    const hierarchyLength = nodes.length * 22;
    if (hierarchyLength > maxBytes - consumed - octreeSize)
      throw new Error('Potree output byte budget exceeded');
    const hierarchy = new Uint8Array(hierarchyLength);
    const view = new DataView(hierarchy.buffer);
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      const mask = getMask(node.id);
      const range = ranges.get(node.id)!;
      const offset = index * 22;
      view.setUint8(offset, mask ? 0 : 1);
      view.setUint8(offset + 1, mask);
      view.setUint32(offset + 2, getCount(node.mesh), true);
      view.setBigUint64(offset + 6, BigInt(range.offset), true);
      view.setBigUint64(offset + 14, BigInt(range.size), true);
    }
    addFile('hierarchy.bin', hierarchy);
    const octree = new Uint8Array(octreeSize);
    let offset = 0;
    for (const bytes of contents) {
      octree.set(bytes, offset);
      offset += bytes.byteLength;
    }
    addFile('octree.bin', octree);
    metadata = {
      version: '2.0',
      points: pointCount,
      projection: settings.projection,
      spacing,
      scale: [...scale] as [number, number, number],
      offset: [...minimum] as [number, number, number],
      boundingBox: {
        min: minimum as [number, number, number],
        max: maximum as [number, number, number]
      },
      hierarchy: {
        firstChunkSize: hierarchyLength,
        stepSize: step,
        depth: nodes[nodes.length - 1].id.length - 1
      },
      encoding: 'DEFAULT',
      attributes: attributes.map(attribute => attribute.description)
    };
  } else {
    if (version >= 5)
      for (const pageRoot of nodes)
        if (
          (pageRoot.id.length - 1) % step === 0 &&
          (pageRoot.id === 'r' || getMask(pageRoot.id))
        ) {
          const page = nodes.filter(
            node => node.id.startsWith(pageRoot.id) && node.id.length <= pageRoot.id.length + step
          );
          if (page.length * 5 > maxBytes - consumed)
            throw new Error('Potree output byte budget exceeded');
          const bytes = new Uint8Array(page.length * 5);
          const view = new DataView(bytes.buffer);
          for (let index = 0; index < page.length; index++) {
            view.setUint8(index * 5, getMask(page[index].id));
            view.setUint32(index * 5 + 1, getCount(page[index].mesh), true);
          }
          addFile(`${getDirectory(pageRoot.id, step)}/${pageRoot.id}.hrc`, bytes);
        }
    const box = {
      lx: minimum[0],
      ly: minimum[1],
      lz: minimum[2],
      ux: maximum[0],
      uy: maximum[1],
      uz: maximum[2]
    };
    metadata = {
      version: versionString,
      octreeDir: 'data',
      points: pointCount,
      projection: settings.projection,
      boundingBox: box,
      tightBoundingBox: {...box},
      spacing,
      scale: scale[0],
      hierarchyStepSize: step,
      pointAttributes: attributes.map(
        attribute => getLegacyAttribute(attribute, nodes[0].mesh, version).name
      ),
      ...(version < 5
        ? {hierarchy: nodes.map(node => [node.id, getCount(node.mesh)] as [string, number])}
        : {})
    };
  }
  const metadataPath = version === 20 ? 'metadata.json' : 'cloud.js';
  addFile(metadataPath, new Uint8Array(encodeMetadata(metadata)));
  return {metadataPath, metadata, files};
}
