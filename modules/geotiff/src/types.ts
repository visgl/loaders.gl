// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@loaders.gl/loader-utils';
import type {RasterChannelDataType} from '@loaders.gl/loader-utils';

/** Backwards-compatible alias for raster sample data types used by TIFF pixel helpers. */
export type Dtype = RasterChannelDataType;
/** Re-exported typed-array union used by TIFF pixel helpers. */
export type {TypedArray};

/** Typed pixel payload returned by low-level TIFF raster and tile reads. */
export interface PixelData {
  /** Raster sample buffer. */
  data: TypedArray;
  /** Raster width in pixels. */
  width: number;
  /** Raster height in pixels. */
  height: number;
}

/** Index selection for a labeled TIFF pixel source. */
export type PixelSourceSelection<S extends string[]> = {
  [K in S[number]]: number;
};

/** Arguments for loading one TIFF raster plane. */
export interface RasterSelection<S extends string[]> {
  /** Coordinate selection for non-spatial dimensions. */
  selection: PixelSourceSelection<S>;
  /** Abort signal forwarded to the underlying TIFF read. */
  signal?: AbortSignal;
}

/** Arguments for loading one TIFF tile. */
export interface TileSelection<S extends string[]> {
  /** Tile x index. */
  x: number;
  /** Tile y index. */
  y: number;
  /** Coordinate selection for non-spatial dimensions. */
  selection: PixelSourceSelection<S>;
  /** Abort signal forwarded to the underlying TIFF read. */
  signal?: AbortSignal;
}

/** Physical pixel size metadata for one image axis. */
interface PhysicalSize {
  /** Numeric physical size. */
  size: number;
  /** Unit string as reported by OME metadata. */
  unit: string;
}

/** Optional metadata exposed by low-level TIFF pixel sources. */
export interface PixelSourceMeta {
  /** Physical sizes keyed by axis name when available. */
  physicalSizes?: Record<string, PhysicalSize>;
  /** TIFF photometric interpretation code when available. */
  photometricInterpretation?: number;
}

/** Dimension labels reported by a TIFF pixel source, including spatial axes. */
export type Labels<S extends string[]> = [...S, 'y', 'x'] | [...S, 'y', 'x', '_c'];

/**
 * Interface implemented by low-level TIFF pixel sources.
 */
export interface PixelSource<S extends string[]> {
  /** Loads a 2D plane. */
  getRaster(sel: RasterSelection<S>): Promise<PixelData>;
  /** Loads a tile. */
  getTile(sel: TileSelection<S>): Promise<PixelData>;
  /** Handles tile-read errors surfaced by the backing source. */
  onTileError(err: Error): void;
  /** Full source shape, including non-spatial dimensions. */
  shape: number[];
  /** Numeric sample data type. */
  dtype: Dtype;
  /** Dimension labels aligned with {@link PixelSource.shape}. */
  labels: Labels<S>;
  /** Native square tile size in pixels. */
  tileSize: number;
  /** Optional source metadata. */
  meta?: PixelSourceMeta;
}
