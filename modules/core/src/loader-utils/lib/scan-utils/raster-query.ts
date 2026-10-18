// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RasterBoundingBox} from '../sources/raster-source';

/** A bounded raster request shared by GeoTIFF, Zarr, and multidimensional sources. */
export type RasterQueryOptions = Readonly<{
  /** Source-coordinate bounds to read, in `[min, max]` form. */
  bounds?: RasterBoundingBox;
  /** Requested output width in pixels. */
  width?: number;
  /** Requested output height in pixels. */
  height?: number;
  /** Overview or multiscale level to read. */
  level?: number;
  /** Named variables or bands to include in the result. */
  variables?: readonly string[];
  /** Numeric channel indices to include in the result. */
  channels?: readonly number[];
  /** Non-spatial dimension indices or half-open `[start, stop)` ranges. */
  slices?: Readonly<Record<string, number | readonly [number, number]>>;
}>;

/** Operator support advertised by a raster source. */
export type RasterQueryCapabilities = Readonly<{
  /** Whether bounds avoid reading unrelated tiles or chunks. */
  bounds: 'unsupported' | 'residual' | 'pushdown';
  /** Whether levels or overviews avoid reading full resolution data. */
  level: 'unsupported' | 'residual' | 'pushdown';
  /** Whether variables or channels avoid decoding unrelated values. */
  variables: 'unsupported' | 'residual' | 'pushdown';
  /** Whether named dimensions are selected before decoding. */
  slices: 'unsupported' | 'residual' | 'pushdown';
  /** Whether requests stream bounded tile or chunk tasks. */
  streaming: boolean;
  /** Whether range, chunk, and decode work observes cancellation. */
  cancellation: boolean;
}>;

/** Validates a raster query without opening or decoding source data. */
export function validateRasterQueryOptions(options: RasterQueryOptions): void {
  if (options.width !== undefined) validatePositiveInteger(options.width, 'width');
  if (options.height !== undefined) validatePositiveInteger(options.height, 'height');
  if (options.level !== undefined) validateNonNegativeInteger(options.level, 'level');
  if (options.bounds) {
    for (let axis = 0; axis < 2; axis++) {
      const minimum = options.bounds[0][axis];
      const maximum = options.bounds[1][axis];
      if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum > maximum) {
        throw new Error('Raster query bounds must contain finite, ordered coordinates.');
      }
    }
  }
  for (const channel of options.channels || []) {
    validateNonNegativeInteger(channel, 'channel');
  }
  for (const [name, slice] of Object.entries(options.slices || {})) {
    if (!name) throw new Error('Raster query slice names must be non-empty.');
    if (Array.isArray(slice)) {
      if (slice.length !== 2 || !slice.every(Number.isFinite) || slice[0] > slice[1]) {
        throw new Error(`Raster query slice ${name} must be an ordered finite range.`);
      }
    } else if (!Number.isFinite(slice)) {
      throw new Error(`Raster query slice ${name} must be finite.`);
    }
  }
}

/** Validates a positive raster dimension. */
function validatePositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Raster query ${name} must be a positive safe integer.`);
  }
}

/** Validates a non-negative raster index. */
function validateNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Raster query ${name} must be a non-negative safe integer.`);
  }
}
