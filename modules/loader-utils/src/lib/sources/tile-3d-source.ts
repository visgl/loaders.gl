// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSourceProps} from './data-source';
import {DataSource} from './data-source';


/**
 * Generic parameters for requesting an node from a tile3d source
 */
export type GetNodeParameters = {
  path: number[];
};

/**
 * Props for a Tile3DSource
 */
export type Tile3DSourceProps = DataSourceProps;

/**
 * MapTile3DSource - data sources that allow data to be queried by (geospatial) extents
 * @note
 * - If geospatial, bounding box is expected to be in web mercator coordinates
 */
export interface Tile3DSource<
  PropsT extends Tile3DSourceProps = Tile3DSourceProps,
  MetadataT extends Tile3DSourceMetadata = any // Tile3DSourceMetadata
> extends DataSource<PropsT> {
  // extends DataSource {
  getMetadata(): Promise<MetadataT>;
  /** */
  getNode(parameters: GetNodeParameters): Promise<unknown | null>;
  /** Flat parameters */
  getTile3D(parameters: GetNodeParameters): Promise<unknown | null>;
}

// HELPER TYPES

/**
 * Normalized capabilities of an tile service
 * Sources are expected to normalize the response to capabilities
 */
export type Tile3DSourceMetadata = {
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

};

/** deck.gl compatibility: bounding box */
export type TileBoundingBox = NonGeoBoundingBox | GeoBoundingBox;
/** deck.gl compatibility: bounding box */
export type GeoBoundingBox = {west: number; north: number; east: number; south: number};
/** deck.gl compatibility: bounding box */
export type NonGeoBoundingBox = {left: number; top: number; right: number; bottom: number};
