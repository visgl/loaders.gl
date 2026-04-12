// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@loaders.gl/loader-utils';
import type {RasterChannelDataType} from '@loaders.gl/loader-utils';

export type Dtype = RasterChannelDataType;
export type {TypedArray};

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
