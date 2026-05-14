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
  topology: 'point-list' | 'triangle-list' | 'triangle-strip';
  indices?: MeshAttribute;
}

/** Mesh as arrow table */
export interface MeshArrowTable extends ArrowTable {
  // shape: 'mesh-arrow-table';
  /** Mesh topology represented by the Arrow table rows and indices. */
  topology: 'point-list' | 'triangle-list' | 'triangle-strip';
  /** Optional top-level primitive indices accessor for indexed meshes. */
  indices?: MeshAttribute;
  /** Raw Apache Arrow table data for Mesh, IndexedMesh, or packed mesh columns. */
  data: MeshArrowTableData | IndexedMeshArrowTableData | PackedMeshArrowTableData;
  /** Optional packed GPU buffer layout mirrored from Arrow schema metadata. */
  packedLayout?: PackedMeshArrowLayout;
}

/** Apache Arrow columns for a mesh vertex table. */
export type MeshArrowColumns = {
  /** XYZ vertex positions as float32 tuples. */
  POSITION: arrow.FixedSizeList<arrow.Float32>;
  /** Loader-specific vertex attribute columns appended after predefined fields. */
  [attributeName: string]: arrow.DataType;
};

/** Apache Arrow columns for an indexed mesh vertex table. */
export type IndexedMeshArrowColumns = MeshArrowColumns & {
  /** Primitive indices, stored in row 0 and null for remaining vertex rows. */
  indices: arrow.List<arrow.Int32>;
};

/** Apache Arrow columns for a packed interleaved mesh vertex table. */
export type PackedMeshArrowColumns = {
  /** One fixed-width packed GPU vertex record per Arrow row. */
  vertexData: arrow.FixedSizeBinary;
};

/** Raw Apache Arrow table data for a mesh vertex table. */
export type MeshArrowTableData = arrow.Table<MeshArrowColumns>;

/** Raw Apache Arrow table data for an indexed mesh vertex table. */
export type IndexedMeshArrowTableData = arrow.Table<IndexedMeshArrowColumns>;

/** Raw Apache Arrow table data for a packed interleaved mesh vertex table. */
export type PackedMeshArrowTableData = arrow.Table<PackedMeshArrowColumns>;

/** One shader-visible attribute view inside a packed mesh vertex record. */
export type PackedMeshArrowAttributeLayout = {
  /** Arrow/mesh attribute semantic. */
  attribute: string;
  /** GPU vertex format for this packed byte range. */
  format: string;
  /** Byte offset inside each packed vertex record. */
  byteOffset: number;
};

/** GPU buffer layout mirrored on packed Mesh Arrow wrappers for ergonomic access. */
export type PackedMeshArrowLayout = {
  /** Packed Arrow column name. */
  columnName: string;
  /** Logical GPU buffer name. */
  bufferName: string;
  /** Bytes between successive packed vertex records. */
  byteStride: number;
  /** Attribute views exposed from the packed bytes. */
  attributes: PackedMeshArrowAttributeLayout[];
};

/** Arrow schema metadata key that marks a packed-only Mesh Arrow table. */
export const PACKED_MESH_ARROW_LAYOUT_METADATA_KEY = 'mesh.packedLayout';

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
  topology: 'point-list' | 'triangle-list' | 'triangle-strip';
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
};

/** A map of mesh attributes keyed by attribute names */
export type MeshAttributes = Record<string, MeshAttribute>;
