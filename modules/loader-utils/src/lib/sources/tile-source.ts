// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSourceProps} from './data-source';
import {DataSource} from './data-source';

/**
 * Props for a TileSource
 */
export type TileSourceProps = DataSourceProps;

/**
 * MapTileSource - data sources that allow data to be queried by (geospatial) extents
 * @note
 * - If geospatial, bounding box is expected to be in web mercator coordinates
 */
export interface TileSource<
  PropsT extends TileSourceProps = TileSourceProps,
  MetadataT extends TileSourceMetadata = TileSourceMetadata
> extends DataSource<PropsT> {
  // extends DataSource {
  getMetadata(): Promise<MetadataT>;
  /** Flat parameters */
  getTile(parameters: GetTileParameters): Promise<unknown | null>;
  /** deck.gl compatibility: TileLayer and MTVLayer */
  getTileData(parameters: GetTileDataParameters): Promise<unknown | null>;
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

  /** Layer information */
  layer?: {
    name: string;
    title?: string;
    srs?: string[];
    boundingBox?: [number, number, number, number];
    layers: TileSourceLayer[];
  };
};

/**
 * Description of one data layer in the image source
 */
export type TileSourceLayer = {
  name: string;
  title?: string;
  srs?: string[];
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
  /** Coordinate reference system for the tile */
  crs?: string;
  /** Layers to render */
  layers?: string | string[];
  /** Styling */
  styles?: unknown;
  /** requested format for the return image (in case of bitmap tiles) */
  format?: 'image/png';
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

/** deck.gl compatibility: bounding box */
export type TileBoundingBox = NonGeoBoundingBox | GeoBoundingBox;
/** deck.gl compatibility: bounding box */
export type GeoBoundingBox = {west: number; north: number; east: number; south: number};
/** deck.gl compatibility: bounding box */
export type NonGeoBoundingBox = {left: number; top: number; right: number; bottom: number};
