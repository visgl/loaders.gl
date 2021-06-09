import type {DTYPE_VALUES} from './constants';

export type SupportedDtype = keyof typeof DTYPE_VALUES;
export type SupportedTypedArray = InstanceType<typeof globalThis[`${SupportedDtype}Array`]>;

export interface PixelData {
  data: SupportedTypedArray;
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

export interface PixelSource<S extends string[]> {
  getRaster(sel: RasterSelection<S>): Promise<PixelData>;
  getTile(sel: TileSelection<S>): Promise<PixelData>;
  onTileError(err: Error): void;
  shape: number[];
  dtype: SupportedDtype;
  labels: Labels<S>;
  tileSize: number;
  meta?: PixelSourceMeta;
}
