// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Scalar wire types in Potree 2.0 attributes. */
export type Potree2AttributeType =
  | 'int8'
  | 'uint8'
  | 'int16'
  | 'uint16'
  | 'int32'
  | 'uint32'
  | 'int64'
  | 'uint64'
  | 'float'
  | 'double';

/** Description of an interleaved or Brotli attribute column. */
export interface Potree2Attribute {
  /** Attribute name, including the mandatory position column. */
  name: string;
  /** Scalar wire representation. */
  type: Potree2AttributeType;
  /** Number of components per point. */
  numElements: number;
  /** Bytes per component. */
  elementSize: number;
  /** Bytes per point in this attribute. */
  size: number;
  /** Optional component minima. */
  min?: number[];
  /** Optional component maxima. */
  max?: number[];
  /** Additional converter metadata is retained. */
  [key: string]: unknown;
}

/** Three-file Potree dataset metadata emitted by PotreeConverter 2.x. */
export interface Potree2Metadata {
  /** Dataset wire version; converter 2.x emits 2.0. */
  version: '2.0';
  /** Optional dataset label. */
  name?: string;
  /** Complete dataset point count. */
  points: number;
  /** Explicit source CRS declaration, if supplied. */
  projection?: string;
  /** Root point spacing in source units. */
  spacing: number;
  /** Position quantization scales for XYZ. */
  scale: [number, number, number];
  /** Position origin in native XYZ coordinates. */
  offset: [number, number, number];
  /** Root octree cube in source coordinates. */
  boundingBox: {min: [number, number, number]; max: [number, number, number]};
  /** Initial hierarchy page length and paging configuration. */
  hierarchy: {firstChunkSize: number; stepSize: number; depth: number};
  /** Interleaved bytes or Brotli-compressed attribute-major bytes. */
  encoding: 'DEFAULT' | 'BROTLI';
  /** Ordered point attribute layout. */
  attributes: Potree2Attribute[];
  /** Additional converter metadata is retained. */
  [key: string]: unknown;
}

/** One breadth-first hierarchy entry. Proxy ranges refer to hierarchy.bin. */
export interface Potree2HierarchyNode {
  /** Root r followed by XYZ octant digits 4/2/1. */
  id: string;
  /** Normal, leaf or hierarchy proxy. */
  type: 0 | 1 | 2;
  /** Declared child octant mask. */
  childMask: number;
  /** Content rows owned by this additive node. */
  pointCount: number;
  /** BigInt wire offset, checked before conversion to a JavaScript index. */
  byteOffset: bigint;
  /** Byte range length. */
  byteSize: bigint;
}
