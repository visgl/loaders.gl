// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TileSource, TileSourceProps, TileSourceMetadata} from './tile-source';
import type {GetTileParameters} from './tile-source';

export type VectorTile = unknown;

export type VectorTileSourceProps = TileSourceProps;

/**
 * VectorTileSource - data sources that allow data to be queried by (geospatial) tile
 * @note If geospatial, bounding box is expected to be in web mercator coordinates
 */
export interface VectorTileSource<MetadataT extends TileSourceMetadata = TileSourceMetadata>
  extends TileSource<MetadataT> {
  getVectorTile(parameters: GetTileParameters): Promise<VectorTile | null>;
}
