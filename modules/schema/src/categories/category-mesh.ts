// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '../types/schema';
import type {TypedArray} from '../types/types';
import type {ColumnarTable, ArrowTable} from './category-table';
import * as arrow from 'apache-arrow';

/** Mesh as columnar table */
export interface MeshTable extends ColumnarTable {
  // shape: 'mesh-table';
  topology: MeshTopology;
  indices?: MeshAttribute;
}

/** Mesh as arrow table */
export interface MeshArrowTable extends ArrowTable {
  // shape: 'mesh-arrow-table';
  /** Mesh topology represented by the Arrow table rows and indices. */
  topology: MeshTopology;
  /** Optional top-level primitive indices accessor for indexed meshes. */
  indices?: MeshAttribute;
  /** Raw Apache Arrow table data for Mesh or IndexedMesh columns. */
  data: MeshArrowTableData | IndexedMeshArrowTableData;
}

/** Apache Arrow columns for a mesh vertex table. */
export type MeshArrowColumns = {
  /** XYZ vertex positions as float32 tuples. */
  POSITION: arrow.FixedSizeList<arrow.Float32>;
  /** Loader-specific vertex attribute columns appended after predefined fields. */
  [attributeName: string]: arrow.DataType;
};

/** Primitive topology names shared by columnar and Arrow mesh representations. */
export type MeshTopology =
  | 'point-list'
  | 'line-list'
  | 'line-loop'
  | 'line-strip'
  | 'triangle-list'
  | 'triangle-strip'
  | 'triangle-fan';

/** Apache Arrow columns for an indexed mesh vertex table. */
export type IndexedMeshArrowColumns = MeshArrowColumns & {
  /** Primitive indices, stored in row 0 and null for remaining vertex rows. */
  indices: arrow.List<arrow.Int32>;
};

/** Raw Apache Arrow table data for a mesh vertex table. */
export type MeshArrowTableData = arrow.Table<MeshArrowColumns>;

/** Raw Apache Arrow table data for an indexed mesh vertex table. */
export type IndexedMeshArrowTableData = arrow.Table<IndexedMeshArrowColumns>;

/** Predefined Apache Arrow schema for common mesh vertex columns. */
export const meshArrowSchema = new arrow.Schema<MeshArrowColumns>([
  new arrow.Field(
    'POSITION',
    new arrow.FixedSizeList(3, new arrow.Field('value', new arrow.Float32(), false)),
    false
  )
]);

/** Predefined Apache Arrow schema for indexed mesh vertex tables. */
export const indexedMeshArrowSchema = new arrow.Schema<IndexedMeshArrowColumns>([
  ...meshArrowSchema.fields,
  new arrow.Field(
    'indices',
    new arrow.List(new arrow.Field('item', new arrow.Int32(), false)),
    true
  )
]);

/** Geometry part of a Mesh (compatible with a standard luma.gl "mesh") */
export type MeshGeometry = {
  attributes: {[attributeName: string]: MeshAttribute};
  indices?: MeshAttribute;
  topology: MeshTopology;
  mode: number;
};

/** Geometry and metadata for a Mesh (compatible with a standard luma.gl "mesh") */
export type Mesh = MeshGeometry & {
  loader?: string;
  loaderData?: {[key: string]: any};
  header?: {
    vertexCount: number;
    boundingBox?: [number[], number[]];
  };
  schema: Schema;
};

/** Quantization transform required to reconstruct floating-point attribute values. */
export type MeshAttributeQuantizationTransform = {
  /** Transform discriminator. */
  type: 'quantization';
  /** Number of quantization bits. */
  bits: number;
  /** Per-component quantization origin. */
  origin: number[];
  /** Quantization range shared by every component. */
  range: number;
};

/** Octahedral transform required to reconstruct directional attribute values. */
export type MeshAttributeOctahedronTransform = {
  /** Transform discriminator. */
  type: 'octahedron';
  /** Number of quantization bits. */
  bits: number;
};

/** Encoded transform retained on an attribute for deferred CPU or GPU reconstruction. */
export type MeshAttributeTransform =
  | MeshAttributeQuantizationTransform
  | MeshAttributeOctahedronTransform;

/**
 * luma.gl compatible attribute descriptors
 * Can be mapped to any WebGL framework
 */
export type MeshAttribute = {
  value: TypedArray;
  size: number;
  byteOffset?: number;
  byteStride?: number;
  normalized?: boolean;
  /** Transform required to reconstruct the logical attribute values. */
  transform?: MeshAttributeTransform;
};

/** A map of mesh attributes keyed by attribute names */
export type MeshAttributes = Record<string, MeshAttribute>;
