import type {TypedArray} from '../types';
import type {ColumnarTable, ArrowTable} from './table';

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

/** Standard luma.gl mesh */
export type Mesh = {
  loader?: string;
  loaderData?: {[key: string]: any};
  header?: {
    vertexCount: number;
    boundingBox?: [number[], number[]];
  };
  topology: 'point-list' | 'triangle-list' | 'triangle-strip';
  mode: number;
  attributes: {[attributeName: string]: MeshAttribute};
  indices?: MeshAttribute;
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
