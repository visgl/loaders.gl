// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '../../types';

/**
 * Numeric channel types supported by viewport-driven raster payloads.
 */
export type RasterChannelDataType =
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'int8'
  | 'int16'
  | 'int32'
  | 'float32'
  | 'float64';

/**
 * Bounding box in source coordinates.
 */
export type RasterBoundingBox = [min: [x: number, y: number], max: [x: number, y: number]];

/**
 * Minimal viewport shape accepted by {@link RasterSource}.
 *
 * This shape is intentionally compatible with deck.gl style 2D viewports without
 * introducing a dependency on deck.gl types into loader-utils.
 */
export type RasterViewport = {
  /** Stable viewport identifier used by higher-level loading managers. */
  id: string;
  /** Viewport pixel width. */
  width: number;
  /** Viewport pixel height. */
  height: number;
  /** Viewport zoom level. */
  zoom: number;
  /** Viewport center in source coordinates. */
  center: number[];
  /** Optional coordinate reference system for the requested raster view. */
  crs?: string;
  /** Optional explicit bounds in source coordinates. */
  bounds?: RasterBoundingBox;
  /** Optional callback used to derive bounds from a deck.gl compatible viewport. */
  getBounds?: () => [west: number, south: number, east: number, north: number];
  /** Project source coordinates into the viewport. */
  project: (coordinates: number[]) => number[];
  /** Unproject viewport coordinates into source coordinates. */
  unprojectPosition: (position: number[]) => [number, number, number];
};

/**
 * CPU-side raster payload that can be uploaded to a rendering texture.
 */
export type RasterData = {
  /** Raster sample buffer(s). */
  data: TypedArray | TypedArray[];
  /** Raster width in pixels. */
  width: number;
  /** Raster height in pixels. */
  height: number;
  /** Number of bands represented by this payload. */
  bandCount: number;
  /** Numeric channel type. */
  dtype: RasterChannelDataType;
  /** `true` when multiple bands are interleaved into one typed array. */
  interleaved?: boolean;
  /** Source no-data value when defined. */
  noData?: number | null;
  /** Bounds covered by this payload in source coordinates. */
  boundingBox?: RasterBoundingBox;
  /** Coordinate reference system for the payload bounds. */
  crs?: string;
  /** Format-specific metadata retained for styling or upload configuration. */
  metadata?: Record<string, unknown>;
};

/**
 * Parameters for {@link RasterSource.getRaster}.
 */
export type GetRasterParameters = {
  /** Requested output viewport. */
  viewport: RasterViewport;
  /** Optional sample indices to request. */
  bands?: number[];
  /** Whether to interleave multi-band output. Defaults to `false`. */
  interleaved?: boolean;
  /** Optional resampling method supported by the source implementation. */
  resampleMethod?: 'nearest' | 'bilinear';
  /** Abort signal forwarded to the underlying request. */
  signal?: AbortSignal;
};

/**
 * Description of one available overview level.
 */
export type RasterOverview = {
  /** Zero-based image index or resolution level. */
  index: number;
  /** Overview width in pixels. */
  width: number;
  /** Overview height in pixels. */
  height: number;
  /** Source resolution for the overview when available. */
  resolution?: [x: number, y: number];
};

/**
 * Normalized metadata exposed by a viewport-driven raster source.
 */
export type RasterSourceMetadata = {
  /** Name of the raster dataset. */
  name?: string;
  /** Human-readable title for the dataset. */
  title?: string;
  /** Dataset description. */
  abstract?: string;
  /** Dataset keywords. */
  keywords?: string[];
  /** Attribution strings. */
  attributions?: string[];
  /** Source coordinate reference system. */
  crs?: string;
  /** Dataset bounds in source coordinates. */
  boundingBox?: RasterBoundingBox;
  /** Full-resolution raster width. */
  width: number;
  /** Full-resolution raster height. */
  height: number;
  /** Number of raster bands. */
  bandCount: number;
  /** Numeric sample type. */
  dtype: RasterChannelDataType;
  /** Native tile dimensions when the source is tiled. */
  tileSize?: {width: number; height: number};
  /** Available overview levels. */
  overviews?: RasterOverview[];
  /** Source no-data value when defined. */
  noData?: number | null;
  /** Format-specific metadata. */
  metadata?: Record<string, unknown>;
};

/**
 * RasterSource - data sources that allow typed raster data to be queried by viewport.
 */
export abstract class RasterSource {
  static type: string = 'template';
  static testURL = (url: string): boolean => false;

  abstract getMetadata(): Promise<RasterSourceMetadata>;
  abstract getRaster(parameters: GetRasterParameters): Promise<RasterData>;
}

/**
 * Resolves viewport bounds from the local raster viewport shape.
 */
export function getRasterViewportBoundingBox(viewport: RasterViewport): RasterBoundingBox {
  if (viewport.bounds) {
    return viewport.bounds;
  }

  if (viewport.getBounds) {
    const [west, south, east, north] = viewport.getBounds();
    return [
      [west, south],
      [east, north]
    ];
  }

  throw new Error('Raster viewport must provide bounds or getBounds().');
}
