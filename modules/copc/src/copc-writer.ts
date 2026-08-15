// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  encodeLASzipVLR,
  encodeLAZChunk,
  encodeLAZChunkTable,
  type LAZChunkTableEntry,
  type WriterOptions,
  type WriterWithEncoder
} from '@loaders.gl/loader-utils';
import {LASWriter} from '@loaders.gl/las';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {COPCFormat} from './copc-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
const LAS_1_4_HEADER_LENGTH = 375;
const COPC_INFO_PAYLOAD_LENGTH = 160;
const VLR_HEADER_LENGTH = 54;
const EVLR_HEADER_LENGTH = 60;
const HIERARCHY_ENTRY_LENGTH = 32;
const VARIABLE_LAZ_CHUNK_SIZE = 0xffffffff;
const DEFAULT_NODE_POINT_LIMIT = 50_000;
const DEFAULT_MAXIMUM_DEPTH = 16;

/** Options for `COPCWriter`. */
export type COPCWriterOptions = WriterOptions & {
  copc?: {
    /** Target maximum number of points per COPC node. */
    nodePointLimit?: number;
    /** Maximum octree depth used when points remain spatially coincident. */
    maximumDepth?: number;
    /** LAS point data record format. */
    pointDataRecordFormat?: 6 | 7 | 8;
    /** Coordinate scale factors used to quantize positions. */
    scale?: [number, number, number];
    /** Coordinate offsets used to quantize positions. */
    offset?: [number, number, number];
    /** Color component depth used by source color attributes. */
    colorDepth?: number | string;
    /** Root-node point spacing stored in the COPC info VLR. */
    spacing?: number;
    /** Optional coordinate reference system encoded as an OGC WKT VLR. */
    wkt?: string;
  };
};

/** Writer metadata for COPC point cloud output. */
export const COPCWriter = {
  ...COPCFormat,
  dataType: null as unknown as Mesh | MeshArrowTable,
  batchType: null as never,
  version: VERSION,
  extensions: ['copc.laz', 'laz'],
  options: {
    copc: {}
  },
  encode: async (data, options) => encodeCOPCSync(data, options),
  encodeSync: encodeCOPCSync
} as const satisfies WriterWithEncoder<Mesh | MeshArrowTable, never, COPCWriterOptions>;

/** Encode a mesh or Arrow table as COPC. */
function encodeCOPCSync(data: Mesh | MeshArrowTable, options: COPCWriterOptions = {}): ArrayBuffer {
  const nodePointLimit = options.copc?.nodePointLimit ?? DEFAULT_NODE_POINT_LIMIT;
  const maximumDepth = options.copc?.maximumDepth ?? DEFAULT_MAXIMUM_DEPTH;
  validateOptions(nodePointLimit, maximumDepth, options.copc?.spacing);

  const rawLAS = encodeRawLAS(data, options);
  if (rawLAS.pointCount === 0) {
    throw new Error('COPCWriter: at least one point is required');
  }
  const cube = createCube(rawLAS.bounds, Math.max(...rawLAS.scale));
  const nodes = createOctreeNodes(rawLAS, cube, nodePointLimit, maximumDepth);
  compressNodes(nodes, rawLAS);

  const laszipVLR = encodeLASzipVLR({
    pointDataRecordFormat: rawLAS.pointDataRecordFormat,
    pointDataRecordLength: rawLAS.pointDataRecordLength,
    chunkSize: VARIABLE_LAZ_CHUNK_SIZE
  });
  const wktVLR = options.copc?.wkt
    ? encodeVLR(
        'LASF_Projection',
        2112,
        'OGC WKT coordinate system',
        encodeNullTerminatedString(options.copc.wkt)
      )
    : null;
  const pointDataOffset =
    LAS_1_4_HEADER_LENGTH +
    VLR_HEADER_LENGTH +
    COPC_INFO_PAYLOAD_LENGTH +
    laszipVLR.byteLength +
    (wktVLR?.byteLength || 0);

  let pointDataByteOffset = pointDataOffset + 8;
  const chunkTableEntries: LAZChunkTableEntry[] = [];
  for (const node of nodes) {
    node.pointDataOffset = pointDataByteOffset;
    pointDataByteOffset += node.compressed.byteLength;
    chunkTableEntries.push({
      pointCount: node.pointIndices.length,
      byteLength: node.compressed.byteLength
    });
  }

  const chunkTablePayload = encodeLAZChunkTable(chunkTableEntries, {variable: true});
  const chunkTableOffset = pointDataByteOffset;
  const evlrOffset = chunkTableOffset + 8 + chunkTablePayload.byteLength;
  const hierarchyOffset = evlrOffset + EVLR_HEADER_LENGTH;
  const hierarchyPayload = encodeHierarchy(nodes);
  const hierarchyEVLR = encodeEVLR('copc', 1000, 'COPC hierarchy', hierarchyPayload);
  const spacing =
    options.copc?.spacing ||
    Math.max((cube[3] - cube[0]) / 128, rawLAS.scale[0], rawLAS.scale[1], rawLAS.scale[2]);
  const infoVLR = encodeVLR(
    'copc',
    1,
    'COPC info VLR',
    encodeCOPCInfo(cube, spacing, hierarchyOffset, hierarchyPayload.byteLength)
  );
  const vlrs = [infoVLR, laszipVLR, ...(wktVLR ? [wktVLR] : [])];
  const arrayBuffer = new ArrayBuffer(evlrOffset + hierarchyEVLR.byteLength);
  const bytes = new Uint8Array(arrayBuffer);
  const dataView = new DataView(arrayBuffer);

  bytes.set(rawLAS.header, 0);
  dataView.setUint16(6, dataView.getUint16(6, true) | 16, true);
  dataView.setUint32(96, pointDataOffset, true);
  dataView.setUint32(100, vlrs.length, true);
  dataView.setUint8(104, rawLAS.pointDataRecordFormat | 0x80);
  writeUint64(dataView, 235, evlrOffset);
  dataView.setUint32(243, 1, true);

  let outputOffset = LAS_1_4_HEADER_LENGTH;
  for (const vlr of vlrs) {
    bytes.set(vlr, outputOffset);
    outputOffset += vlr.byteLength;
  }
  writeUint64(dataView, pointDataOffset, chunkTableOffset);
  outputOffset = pointDataOffset + 8;
  for (const node of nodes) {
    bytes.set(node.compressed, outputOffset);
    outputOffset += node.compressed.byteLength;
  }
  dataView.setUint32(chunkTableOffset, 0, true);
  dataView.setUint32(chunkTableOffset + 4, nodes.length, true);
  bytes.set(chunkTablePayload, chunkTableOffset + 8);
  bytes.set(hierarchyEVLR, evlrOffset);
  return arrayBuffer;
}

/** Raw LAS point records and metadata used by the COPC organizer. */
type RawLASData = {
  /** LAS 1.4 public header. */
  header: Uint8Array;
  /** Contiguous uncompressed point records. */
  pointData: Uint8Array;
  /** Number of point records. */
  pointCount: number;
  /** LAS point data record format. */
  pointDataRecordFormat: number;
  /** Byte length of one point record. */
  pointDataRecordLength: number;
  /** Coordinate scale factors. */
  scale: [number, number, number];
  /** Coordinate offsets. */
  offset: [number, number, number];
  /** Data bounds as minimum and maximum coordinates. */
  bounds: Bounds3D;
};

/** Six-value axis-aligned 3D bounds. */
type Bounds3D = [number, number, number, number, number, number];

/** Four-value COPC octree key. */
type COPCKey = [number, number, number, number];

/** One point-bearing COPC octree node. */
type COPCNode = {
  /** Octree key as depth, X, Y, and Z. */
  key: COPCKey;
  /** Spatial cube represented by the key. */
  bounds: Bounds3D;
  /** Source point indices assigned to this level of detail. */
  pointIndices: number[];
  /** Compressed LAZ chunk. */
  compressed: Uint8Array;
  /** Absolute file offset of the compressed chunk. */
  pointDataOffset: number;
};

/** State shared while recursively partitioning point indices. */
type OctreeContext = {
  /** Raw LAS records and coordinate metadata. */
  rawLAS: RawLASData;
  /** Target maximum points retained at each node. */
  nodePointLimit: number;
  /** Maximum permitted node depth. */
  maximumDepth: number;
  /** Nodes in deterministic pre-order. */
  nodes: COPCNode[];
  /** View used to read quantized point positions. */
  pointDataView: DataView;
};

/** Encode input data once as uncompressed LAS 1.4 point records. */
function encodeRawLAS(data: Mesh | MeshArrowTable, options: COPCWriterOptions): RawLASData {
  const arrayBuffer = LASWriter.encodeSync(data, {
    las: {
      version: '1.4',
      pointDataRecordFormat: options.copc?.pointDataRecordFormat,
      scale: options.copc?.scale,
      offset: options.copc?.offset,
      colorDepth: options.copc?.colorDepth
    }
  });
  const dataView = new DataView(arrayBuffer);
  const pointDataOffset = dataView.getUint32(96, true);
  const pointCount = readUint64(dataView, 247);
  const pointDataRecordFormat = dataView.getUint8(104) & 0x3f;
  const pointDataRecordLength = dataView.getUint16(105, true);
  return {
    header: new Uint8Array(arrayBuffer, 0, LAS_1_4_HEADER_LENGTH).slice(),
    pointData: new Uint8Array(
      arrayBuffer,
      pointDataOffset,
      pointCount * pointDataRecordLength
    ).slice(),
    pointCount,
    pointDataRecordFormat,
    pointDataRecordLength,
    scale: [
      dataView.getFloat64(131, true),
      dataView.getFloat64(139, true),
      dataView.getFloat64(147, true)
    ],
    offset: [
      dataView.getFloat64(155, true),
      dataView.getFloat64(163, true),
      dataView.getFloat64(171, true)
    ],
    bounds: [
      dataView.getFloat64(187, true),
      dataView.getFloat64(203, true),
      dataView.getFloat64(219, true),
      dataView.getFloat64(179, true),
      dataView.getFloat64(195, true),
      dataView.getFloat64(211, true)
    ]
  };
}

/** Create a deterministic point-bearing COPC octree. */
function createOctreeNodes(
  rawLAS: RawLASData,
  cube: Bounds3D,
  nodePointLimit: number,
  maximumDepth: number
): COPCNode[] {
  const context: OctreeContext = {
    rawLAS,
    nodePointLimit,
    maximumDepth,
    nodes: [],
    pointDataView: new DataView(
      rawLAS.pointData.buffer,
      rawLAS.pointData.byteOffset,
      rawLAS.pointData.byteLength
    )
  };
  appendOctreeNode(
    context,
    [0, 0, 0, 0],
    cube,
    Array.from({length: rawLAS.pointCount}, (_, pointIndex) => pointIndex)
  );
  return context.nodes;
}

/** Retain a level-of-detail sample and recursively partition remaining points. */
function appendOctreeNode(
  context: OctreeContext,
  key: COPCKey,
  bounds: Bounds3D,
  pointIndices: number[]
): void {
  const canSplit = pointIndices.length > context.nodePointLimit && key[0] < context.maximumDepth;
  const {sample, remaining} = canSplit
    ? samplePointIndices(pointIndices, context.nodePointLimit)
    : {sample: pointIndices, remaining: []};
  context.nodes.push({
    key,
    bounds,
    pointIndices: sample,
    compressed: new Uint8Array(0),
    pointDataOffset: 0
  });
  if (remaining.length === 0) {
    return;
  }

  const middle: [number, number, number] = [
    (bounds[0] + bounds[3]) / 2,
    (bounds[1] + bounds[4]) / 2,
    (bounds[2] + bounds[5]) / 2
  ];
  const buckets = Array.from({length: 8}, () => [] as number[]);
  for (const pointIndex of remaining) {
    const position = readPointPosition(context, pointIndex);
    const childX = position[0] >= middle[0] ? 1 : 0;
    const childY = position[1] >= middle[1] ? 1 : 0;
    const childZ = position[2] >= middle[2] ? 1 : 0;
    buckets[childX * 4 + childY * 2 + childZ].push(pointIndex);
  }

  for (let childX = 0; childX < 2; childX++) {
    for (let childY = 0; childY < 2; childY++) {
      for (let childZ = 0; childZ < 2; childZ++) {
        const childIndices = buckets[childX * 4 + childY * 2 + childZ];
        if (childIndices.length === 0) {
          continue;
        }
        appendOctreeNode(
          context,
          [key[0] + 1, key[1] * 2 + childX, key[2] * 2 + childY, key[3] * 2 + childZ],
          createChildBounds(bounds, childX, childY, childZ),
          childIndices
        );
      }
    }
  }
}

/** Select evenly spaced source-order samples for one octree level. */
function samplePointIndices(
  pointIndices: number[],
  sampleCount: number
): {sample: number[]; remaining: number[]} {
  const sample: number[] = [];
  const remaining: number[] = [];
  let sampleIndex = 0;
  let nextSamplePosition = Math.floor(((sampleIndex + 0.5) * pointIndices.length) / sampleCount);
  for (let position = 0; position < pointIndices.length; position++) {
    if (sampleIndex < sampleCount && position === nextSamplePosition) {
      sample.push(pointIndices[position]);
      sampleIndex++;
      nextSamplePosition = Math.floor(((sampleIndex + 0.5) * pointIndices.length) / sampleCount);
    } else {
      remaining.push(pointIndices[position]);
    }
  }
  return {sample, remaining};
}

/** Read one point's dequantized XYZ position. */
function readPointPosition(context: OctreeContext, pointIndex: number): [number, number, number] {
  const byteOffset = pointIndex * context.rawLAS.pointDataRecordLength;
  return [
    context.pointDataView.getInt32(byteOffset, true) * context.rawLAS.scale[0] +
      context.rawLAS.offset[0],
    context.pointDataView.getInt32(byteOffset + 4, true) * context.rawLAS.scale[1] +
      context.rawLAS.offset[1],
    context.pointDataView.getInt32(byteOffset + 8, true) * context.rawLAS.scale[2] +
      context.rawLAS.offset[2]
  ];
}

/** Return the child cube selected by three octant bits. */
function createChildBounds(
  bounds: Bounds3D,
  childX: number,
  childY: number,
  childZ: number
): Bounds3D {
  const middleX = (bounds[0] + bounds[3]) / 2;
  const middleY = (bounds[1] + bounds[4]) / 2;
  const middleZ = (bounds[2] + bounds[5]) / 2;
  return [
    childX ? middleX : bounds[0],
    childY ? middleY : bounds[1],
    childZ ? middleZ : bounds[2],
    childX ? bounds[3] : middleX,
    childY ? bounds[4] : middleY,
    childZ ? bounds[5] : middleZ
  ];
}

/** Compress each node as one independent LAZ chunk. */
function compressNodes(nodes: COPCNode[], rawLAS: RawLASData): void {
  for (const node of nodes) {
    const pointData = new Uint8Array(node.pointIndices.length * rawLAS.pointDataRecordLength);
    for (let index = 0; index < node.pointIndices.length; index++) {
      const sourceOffset = node.pointIndices[index] * rawLAS.pointDataRecordLength;
      pointData.set(
        rawLAS.pointData.subarray(sourceOffset, sourceOffset + rawLAS.pointDataRecordLength),
        index * rawLAS.pointDataRecordLength
      );
    }
    node.compressed = encodeLAZChunk(pointData, {
      pointDataRecordFormat: rawLAS.pointDataRecordFormat,
      pointDataRecordLength: rawLAS.pointDataRecordLength,
      pointCount: node.pointIndices.length,
      point14ItemVersion: 3,
      rgb14ItemVersion: 3,
      byte14ItemVersion: 3
    });
  }
}

/** Encode a single-page COPC hierarchy. */
function encodeHierarchy(nodes: COPCNode[]): Uint8Array {
  const sortedNodes = [...nodes].sort((left, right) => compareKeys(left.key, right.key));
  const bytes = new Uint8Array(sortedNodes.length * HIERARCHY_ENTRY_LENGTH);
  const dataView = new DataView(bytes.buffer);
  for (let nodeIndex = 0; nodeIndex < sortedNodes.length; nodeIndex++) {
    const node = sortedNodes[nodeIndex];
    const byteOffset = nodeIndex * HIERARCHY_ENTRY_LENGTH;
    dataView.setInt32(byteOffset, node.key[0], true);
    dataView.setInt32(byteOffset + 4, node.key[1], true);
    dataView.setInt32(byteOffset + 8, node.key[2], true);
    dataView.setInt32(byteOffset + 12, node.key[3], true);
    writeUint64(dataView, byteOffset + 16, node.pointDataOffset);
    dataView.setInt32(byteOffset + 24, node.compressed.byteLength, true);
    dataView.setInt32(byteOffset + 28, node.pointIndices.length, true);
  }
  return bytes;
}

/** Compare COPC keys lexicographically. */
function compareKeys(left: COPCKey, right: COPCKey): number {
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

/** Encode the fixed-length COPC info payload. */
function encodeCOPCInfo(
  cube: Bounds3D,
  spacing: number,
  hierarchyOffset: number,
  hierarchyByteLength: number
): Uint8Array {
  const bytes = new Uint8Array(COPC_INFO_PAYLOAD_LENGTH);
  const dataView = new DataView(bytes.buffer);
  dataView.setFloat64(0, (cube[0] + cube[3]) / 2, true);
  dataView.setFloat64(8, (cube[1] + cube[4]) / 2, true);
  dataView.setFloat64(16, (cube[2] + cube[5]) / 2, true);
  dataView.setFloat64(24, (cube[3] - cube[0]) / 2, true);
  dataView.setFloat64(32, spacing, true);
  writeUint64(dataView, 40, hierarchyOffset);
  writeUint64(dataView, 48, hierarchyByteLength);
  dataView.setFloat64(56, 0, true);
  dataView.setFloat64(64, 0, true);
  return bytes;
}

/** Encode a standard LAS variable-length record. */
function encodeVLR(
  userId: string,
  recordId: number,
  description: string,
  payload: Uint8Array
): Uint8Array {
  if (payload.byteLength > 0xffff) {
    throw new Error(`COPCWriter: VLR payload exceeds 65535 bytes (${payload.byteLength})`);
  }
  const bytes = new Uint8Array(VLR_HEADER_LENGTH + payload.byteLength);
  const dataView = new DataView(bytes.buffer);
  writeString(dataView, 2, userId, 16);
  dataView.setUint16(18, recordId, true);
  dataView.setUint16(20, payload.byteLength, true);
  writeString(dataView, 22, description, 32);
  bytes.set(payload, VLR_HEADER_LENGTH);
  return bytes;
}

/** Encode a LAS extended variable-length record. */
function encodeEVLR(
  userId: string,
  recordId: number,
  description: string,
  payload: Uint8Array
): Uint8Array {
  const bytes = new Uint8Array(EVLR_HEADER_LENGTH + payload.byteLength);
  const dataView = new DataView(bytes.buffer);
  writeString(dataView, 2, userId, 16);
  dataView.setUint16(18, recordId, true);
  writeUint64(dataView, 20, payload.byteLength);
  writeString(dataView, 28, description, 32);
  bytes.set(payload, EVLR_HEADER_LENGTH);
  return bytes;
}

/** Return the smallest non-degenerate cube centered on the data bounds. */
function createCube(bounds: Bounds3D, minimumWidth: number): Bounds3D {
  const center: [number, number, number] = [
    (bounds[0] + bounds[3]) / 2,
    (bounds[1] + bounds[4]) / 2,
    (bounds[2] + bounds[5]) / 2
  ];
  const radius =
    Math.max(bounds[3] - bounds[0], bounds[4] - bounds[1], bounds[5] - bounds[2], minimumWidth) / 2;
  return [
    center[0] - radius,
    center[1] - radius,
    center[2] - radius,
    center[0] + radius,
    center[1] + radius,
    center[2] + radius
  ];
}

/** Validate COPC organization options. */
function validateOptions(nodePointLimit: number, maximumDepth: number, spacing?: number): void {
  if (!Number.isInteger(nodePointLimit) || nodePointLimit <= 0 || nodePointLimit > 0x7fffffff) {
    throw new Error(`COPCWriter: invalid node point limit ${nodePointLimit}`);
  }
  if (!Number.isInteger(maximumDepth) || maximumDepth < 0 || maximumDepth > 30) {
    throw new Error(`COPCWriter: invalid maximum depth ${maximumDepth}`);
  }
  if (spacing !== undefined && (!Number.isFinite(spacing) || spacing <= 0)) {
    throw new Error(`COPCWriter: invalid spacing ${spacing}`);
  }
}

/** Encode a string with LAS-required null termination. */
function encodeNullTerminatedString(value: string): Uint8Array {
  const encoded = new TextEncoder().encode(value);
  const bytes = new Uint8Array(encoded.byteLength + 1);
  bytes.set(encoded);
  return bytes;
}

/** Write a fixed-length ASCII string into a DataView. */
function writeString(
  dataView: DataView,
  byteOffset: number,
  value: string,
  byteLength: number
): void {
  for (let characterIndex = 0; characterIndex < byteLength; characterIndex++) {
    dataView.setUint8(byteOffset + characterIndex, value.charCodeAt(characterIndex) || 0);
  }
}

/** Write a safe JavaScript integer as a little-endian UInt64. */
function writeUint64(dataView: DataView, byteOffset: number, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`COPCWriter: UInt64 value is outside the safe integer range (${value})`);
  }
  dataView.setUint32(byteOffset, value >>> 0, true);
  dataView.setUint32(byteOffset + 4, Math.floor(value / 2 ** 32), true);
}

/** Read a little-endian UInt64 known to fit in JavaScript's safe integer range. */
function readUint64(dataView: DataView, byteOffset: number): number {
  return dataView.getUint32(byteOffset, true) + dataView.getUint32(byteOffset + 4, true) * 2 ** 32;
}
