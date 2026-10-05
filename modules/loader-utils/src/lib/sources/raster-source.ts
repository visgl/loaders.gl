// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TypedArray} from '../../types';
import type {CRSDefinition, CRSIdentifier} from '@math.gl/crs';

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
  crs?: CRSIdentifier;
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
  crs?: CRSDefinition;
  /** Per-band raw-domain interpretation, in payload order. */
  bands?: RasterBandMetadata[];
  /** Affine [a, b, c, d, e, f]: x = a*column + b*row + c; y = d*column + e*row + f. */
  transform?: RasterAffineTransform;
  /** Area samples are centered at grid coordinates +0.5; point samples at integer coordinates. */
  pixelRegistration?: 'area' | 'point';
  /** Masks use zero for invalid samples; values do not override nodata. */
  validityMasks?: RasterValidityMask[];
  /** Actual selected native overview. */
  overview?: number;
  /** Effective source units per output pixel, on both axes. */
  resolution?: [number, number];
  /** Resolution of the selected native source overview, when available. */
  nativeResolution?: [number, number];
  /** Whether requested pixels are finer than the selected native overview. */
  overzoom?: boolean;
  /** Structured provenance without credentials or authorization headers. */
  provenance?: {sourceType: string; revision?: string};
  /** Computed statistics, separate from format-declared metadata. */
  statistics?: RasterBandStatistics[];
  /** Buffer ownership; sampling never mutates buffers. */
  ownership?: 'borrowed' | 'owned' | 'transferred';
  /** Format-specific metadata retained for styling or upload configuration. */
  metadata?: Record<string, unknown>;
};

/**
 * Named indices selected from non-spatial raster dimensions.
 *
 * Sources define the supported dimension names in their source-specific metadata.
 */
export type RasterSelection = Readonly<Record<string, number>>;

/**
 * Parameters for {@link RasterSource.getRaster}.
 */
export type GetRasterParameters = {
  /** Requested output viewport. */
  viewport: RasterViewport;
  /** Optional named indices for non-spatial dimensions such as time or vertical level. */
  selection?: RasterSelection;
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
  crs?: CRSDefinition;
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
  /** Original band interpretation in source order. */
  bands?: RasterBandMetadata[];
  /** Native source-grid affine, when known. */
  transform?: RasterAffineTransform;
  /** Native grid registration. */
  pixelRegistration?: 'area' | 'point';
  /** Whether explicit numeric region requests are available. */
  supportsRegion?: boolean;
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
 *
 * @typeParam DataT Raster payload returned by the source.
 * @typeParam ParametersT Request parameters accepted by the source.
 * @typeParam MetadataT Metadata returned by the source.
 */
export interface RasterSource<
  DataT extends NumericRasterData = RasterData,
  ParametersT extends GetRasterParameters = GetRasterParameters,
  MetadataT extends RasterSourceMetadata = RasterSourceMetadata
> {
  /** Additive explicit region capability, absent on legacy sources. */
  readonly supportsRegion?: boolean;
  /** Returns normalized dataset metadata without loading raster samples. */
  getMetadata(options?: {
    /** Optional metadata transport cancellation. */ signal?: AbortSignal;
  }): Promise<MetadataT>;
  /** Loads raster samples for the supplied viewport request. */
  getRaster(parameters: ParametersT): Promise<DataT>;
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

/** Source grid to source-coordinate affine transform. */
export type RasterAffineTransform = [number, number, number, number, number, number];

/** Interpretation of one band, without modifying raw samples. */
export type RasterBandMetadata = {
  /** Original zero-based source index. */
  index: number;
  /** Actual array representation for this band. */
  dtype: RasterChannelDataType;
  /** Human-readable band name. */
  name?: string;
  /** Physical units. */
  units?: string;
  /** Raw-to-physical multiplier. */
  scale?: number;
  /** Raw-to-physical additive offset. */
  offset?: number;
  /** Raw-domain nodata value. */
  noData?: number | null;
  /** Source-declared statistics, separate from computed payload statistics. */
  declaredStatistics?: RasterDeclaredBandStatistics;
  /** Whether interpolation is inappropriate for this band. */
  categorical?: boolean;
};

/** Explicit mask indexing: offset + row*rowStride + column*pixelStride. */
export type RasterValidityMask = {
  /** Mask bytes; zero means invalid. */
  data: Uint8Array;
  /** Payload band index, or all bands when omitted. */
  band?: number;
  /** Number of columns. */
  width: number;
  /** Number of rows. */
  height: number;
  /** Byte offset, default zero. */
  offset?: number;
  /** Byte stride between columns, default one. */
  pixelStride?: number;
  /** Byte stride between rows, default width. */
  rowStride?: number;
};

/** Statistics over a bounded set of valid samples. */
export type RasterBandStatistics = {
  /** Original source band index. */
  band: number;
  /** Value interpretation. */
  domain: 'raw' | 'physical';
  /** Minimum valid value, absent for all-invalid samples. */
  min?: number;
  /** Maximum valid value, absent for all-invalid samples. */
  max?: number;
  /** Number of valid inspected samples. */
  validCount: number;
  /** Statistical scope. */
  scope: 'payload';
  /** Whether every pixel was inspected. */
  method: 'exact' | 'sampled';
};

/** Source declarations whose domain or valid count may be unavailable. */
export type RasterDeclaredBandStatistics = {
  /** Original source band index. */
  band: number;
  /** Declared interpretation; unknown means callers must not assume raw or physical values. */
  domain: 'raw' | 'physical' | 'unknown';
  /** Finite declared minimum, when available. */
  min?: number;
  /** Finite declared maximum, when available. */
  max?: number;
  /** Declared valid sample count, omitted when unavailable; never inferred from rounded percentages. */
  validCount?: number;
  /** Scope of the declaration, independent of the returned payload window. */
  scope: 'source' | 'overview';
  /** Source-provided values; no assertion that this implementation computed exact extrema. */
  method: 'declared';
};

/** Explicit non-wrapped source-coordinate request. */
export type RasterRegionParameters = Omit<GetRasterParameters, 'viewport'> & {
  /** Ordered finite bounds in canonical x/y order. */
  bounds: RasterBoundingBox;
  /** Explicit request CRS; conversion is the caller's responsibility. */
  crs: CRSDefinition;
  /** Positive integer output width. */
  width: number;
  /** Positive integer output height. */
  height: number;
  /** Maximum output pixels, default 16 million. */
  maxPixels?: number;
  /** Maximum decoded bytes, default 256 MiB. */
  maxDecodedBytes?: number;
};

/** Additive region capability; sources without it retain their viewport contract. */
export interface RasterRegionSource extends RasterSource {
  /** Loads one independently georeferenced region. */
  getRasterForRegion(parameters: RasterRegionParameters): Promise<NumericRasterData>;
}

/** Additive mixed-representation payload; every band retains its own typed array and dtype. */
export type RasterMixedData = Omit<RasterData, 'data' | 'dtype' | 'interleaved' | 'bands'> & {
  /** Separate arrays in payload band order. */
  data: TypedArray[];
  /** Discriminator; there is no common numeric representation. */
  dtype: 'mixed';
  /** Mixed representations cannot be interleaved. */
  interleaved: false;
  /** Required per-band interpretation describes each actual array representation. */
  bands: RasterBandMetadata[];
};

/** Common or explicitly mixed numeric samples. */
export type NumericRasterData = RasterData | RasterMixedData;
