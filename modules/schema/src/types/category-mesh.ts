// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from './schema';
import type {TypedArray} from './types';
import type {ColumnarTable, ArrowTable} from './category-table';

/** Mesh as columnar table */
export interface MeshTable extends ColumnarTable {
  // shape: 'mesh-table';
  topology: 'point-list' | 'triangle-list' | 'triangle-strip';
  indices?: MeshAttribute;
}

/** Mesh as arrow table */
export interface MeshArrowTable extends ArrowTable {
  // shape: 'mesh-arrow-table';
  topology: 'point-list' | 'triangle-list' | 'triangle-strip';
  indices?: MeshAttribute;
}

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
