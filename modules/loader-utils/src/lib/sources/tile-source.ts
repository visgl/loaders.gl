// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Normalized capabilities of an Image service
 * Sources are expected to normalize the response to capabilities
 * @example
 *  A WMS service would normalize the response to the WMS `GetCapabilities` data structure extracted from WMS XML response
 *  into an TileSourceMetadata.
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
 * Generic parameters for requesting an image from an image source
 */
export type GetTileParameters = {
  /** Layers to render */
  layers: string | string[];
  /** Styling */
  styles?: unknown;
  /** bounding box of the requested map image */
  zoom: number;
  /** tile x coordinate */
  x: number;
  /** tile y coordinate */
  y: number;
  /** Coordinate reference system for the image (not the bounding box) */
  crs?: string;
  /** requested format for the return image */
  format?: 'image/png';
};

export type TileLoadParameters = {
  index: {x: number; y: number; z: number};
  id: string;
  bbox: TileBoundingBox;
  zoom?: number;
  url?: string | null;
  signal?: AbortSignal;
  userData?: Record<string, any>;
};

/** deck.gl compatible bounding box */
export type TileBoundingBox = NonGeoBoundingBox | GeoBoundingBox;
export type GeoBoundingBox = {west: number; north: number; east: number; south: number};
export type NonGeoBoundingBox = {left: number; top: number; right: number; bottom: number};

/**
 * Props for a TileSource
 */
export type TileSourceProps = {};

/**
 * MapTileSource - data sources that allow data to be queried by (geospatial) extents
 * @note
 * - If geospatial, bounding box is expected to be in web mercator coordinates
 */
export interface TileSource<MetadataT extends TileSourceMetadata> {
  getMetadata(): Promise<MetadataT>;
  /** Flat parameters */
  getTile(parameters: GetTileParameters): Promise<unknown>;
  /** deck.gl style parameters */
  getTileData?(parameters: TileLoadParameters): Promise<unknown | null>;
}
