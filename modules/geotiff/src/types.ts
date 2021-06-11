import {DTYPE_LOOKUP} from './lib/ome/ome-utils';

export type Dtype = typeof DTYPE_LOOKUP[keyof typeof DTYPE_LOOKUP];
export type TypedArray = InstanceType<typeof globalThis[`${Dtype}Array`]>;

export interface PixelData {
  data: TypedArray;
  width: number;
  height: number;
}

export type PixelSourceSelection<S extends string[]> = {
  [K in S[number]]: number;
};

export interface RasterSelection<S extends string[]> {
  selection: PixelSourceSelection<S>;
  signal?: AbortSignal;
}

export interface TileSelection<S extends string[]> {
  x: number;
  y: number;
  selection: PixelSourceSelection<S>;
  signal?: AbortSignal;
}

interface PhysicalSize {
  size: number;
  unit: string;
}

export interface PixelSourceMeta {
  physicalSizes?: Record<string, PhysicalSize>;
  photometricInterpretation?: number;
}

export type Labels<S extends string[]> = [...S, 'y', 'x'] | [...S, 'y', 'x', '_c'];

/**
 * Interface to load tiles from a data source
 */
export interface PixelSource<S extends string[]> {
  /** Loads a 2D plane */
  getRaster(sel: RasterSelection<S>): Promise<PixelData>;
  /** Loads a tile */
  getTile(sel: TileSelection<S>): Promise<PixelData>;
  onTileError(err: Error): void;
  shape: number[];
  dtype: Dtype;
  labels: Labels<S>;
  tileSize: number;
  meta?: PixelSourceMeta;
}
