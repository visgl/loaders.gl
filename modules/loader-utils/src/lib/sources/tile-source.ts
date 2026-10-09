// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CRSIdentifier} from '@math.gl/crs';
import type {TileMatrixSet} from '@math.gl/geospatial';

/**
 * Props for a TileSource
 */
export type TileSourceProps = {};

/**
 * MapTileSource - data sources that allow data to be queried by (geospatial) extents
 * @note
 * - If geospatial, bounding box is expected to be in web mercator coordinates
 */
export interface TileSource {
  /** MIME type of decoded tile payloads, when known. */
  readonly mimeType?: string | null;
  /** Whether decoded vector coordinates are local to each tile. */
  readonly localCoordinates?: boolean;
  // extends DataSource {
  getMetadata(): Promise<TileSourceMetadata>;
  /** Flat parameters */
  getTile(parameters: GetTileParameters): Promise<unknown | null>;
  /** Flat parameters, batched */
  getTileBatch?(parameters: readonly GetTileParameters[]): readonly Promise<unknown | null>[];
  /** deck.gl compatibility: TileLayer and MTVLayer */
  getTileData(parameters: GetTileDataParameters): Promise<unknown | null>;
  /** deck.gl compatibility: batched tile data */
  getTileDataBatch?(
    parameters: readonly GetTileDataParameters[]
  ): readonly Promise<unknown | null>[];
}

// HELPER TYPES

/**
 * Normalized capabilities of an tile service
 * Sources are expected to normalize the response to capabilities
 */
export type TileSourceMetadata = {
  format?: string;
  formatHeader?: unknown;

  /** Name of the tileset (extracted from JSON metadata if available) */
  name?: string;
  title?: string;
  abstract?: string;
  keywords?: string[];
  /** Attribution string (extracted from JSON metadata if available) */
  attributions?: string[];

  /** Minimal zoom level of tiles in this tileset */
  minZoom?: number;
  /** Maximal zoom level of tiles in this tileset */
  maxZoom?: number;
  /** Bounding box of tiles in this tileset `[[w, s], [e, n]]`  */
  boundingBox?: [min: [x: number, y: number], max: [x: number, y: number]];
  /** Advertised tile grid, when the service exposes matrix or level metadata. */
  tileGrid?: TileGrid;

  /** Layer information */
  layer?: {
    name: string;
    title?: string;
    srs?: CRSIdentifier[];
    boundingBox?: [number, number, number, number];
    layers: TileSourceLayer[];
  };
};

/**
 * Normalized tile matrix information shared by WMTS and vendor tile services.
 *
 * `tileMatrixSet` is the authoritative geometry when present. The grid-wide fields are kept for
 * compatibility; when `tileMatrixSet` is set they are derived from it and describe its first level.
 */
export type TileGrid = {
  /** Coordinate reference system used by the grid. */
  crs?: CRSIdentifier;
  /** Tile width and height in pixels. */
  tileSize?: [number, number];
  /** Top-left origin in grid coordinates. */
  origin?: [number, number];
  /** Coordinate units per pixel in matrix order, when CRS units are known. */
  resolutions?: number[];
  /** Matrix identifiers in zoom order. */
  matrixIds?: string[];
  /** Matrix width and height in tile units in zoom order. */
  matrixSizes?: Array<[number, number]>;
  /**
   * Complete per-level geometry in advertised order, set only when every advertised level has a
   * resolution, origin, tile size and matrix size that pass math.gl `validateTileMatrix()`. Use it
   * with the `@math.gl/geospatial` tile-matrix utilities. Origins are in XY order.
   */
  tileMatrixSet?: TileMatrixSet;
  /**
   * Per-level metadata as the service advertises it, aligned with `matrixIds`. Entries may be
   * incomplete, for example without a resolution when the CRS unit is unknown, so this is not
   * usable geometry on its own; prefer `tileMatrixSet`.
   */
  matrices?: TileGridMatrix[];
};

/** One advertised level of a tile grid. Fields the service does not advertise are omitted. */
export type TileGridMatrix = {
  /** Matrix identifier used in tile requests. */
  id: string;
  /** Coordinate units per pixel, when CRS units are known. */
  resolution?: number;
  /** Top-left origin in grid coordinates, with the same axis handling as `TileGrid.origin`. */
  origin?: [number, number];
  /** Tile width and height in pixels. */
  tileSize?: [number, number];
  /** Matrix width and height in tile units. */
  matrixSize?: [number, number];
};

/**
 * Description of one data layer in the image source
 */
export type TileSourceLayer = {
  name: string;
  title?: string;
  srs?: CRSIdentifier[];
  boundingBox?: [number, number, number, number];
  layers: TileSourceLayer[];
};

/**
 * Generic parameters for requesting an tile from an tile source
 */
export type GetTileParameters = {
  /** bounding box of the requested map image */
  z: number;
  /** tile x coordinate */
  x: number;
  /** tile y coordinate */
  y: number;
  /**
   * Identifier of the tile matrix to request, used verbatim. Sources that know their matrix set
   * reject an unknown identifier. When omitted, `z` selects the matrix whose identifier is that
   * number, otherwise the matrix at that index.
   */
  tileMatrix?: string;
  /** Coordinate reference system for the tile */
  crs?: CRSIdentifier;
  /** Layers to render */
  layers?: string | string[];
  /** Styling */
  styles?: unknown;
  /** requested format for the return image (in case of bitmap tiles) */
  format?: 'image/png';
  /** Abort signal for canceling metadata, range, and tile-content requests. */
  signal?: AbortSignal;
};

/** deck.gl compatibility: parameters for TileSource.getTileData() */
export type GetTileDataParameters = {
  /** Tile index */
  index: {x: number; y: number; z: number};
  id: string;
  /** Bounding Box */
  bbox: TileBoundingBox;
  /** Zoom level */
  zoom?: number;
  url?: string | null;
  signal?: AbortSignal;
  userData?: Record<string, any>;
};

export type GetTileDataBatchResult<T = unknown> = readonly Promise<T | null>[];

/** deck.gl compatibility: bounding box */
export type TileBoundingBox = NonGeoBoundingBox | GeoBoundingBox;
/** deck.gl compatibility: bounding box */
export type GeoBoundingBox = {west: number; north: number; east: number; south: number};
/** deck.gl compatibility: bounding box */
export type NonGeoBoundingBox = {left: number; top: number; right: number; bottom: number};
