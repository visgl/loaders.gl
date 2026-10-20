// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Schema,
  Feature,
  GeoJSONTable,
  BinaryFeatureCollection,
  ArrowTable
} from '@loaders.gl/schema';
import {TileSource, TileSourceProps, GetTileParameters} from './tile-source';
import type {GetTileDataParameters} from './tile-source';

export type VectorTile = Feature[] | GeoJSONTable | BinaryFeatureCollection | ArrowTable;

export type VectorTileSourceProps = TileSourceProps;

/**
 * VectorTileSource - data sources that allow data to be queried by (geospatial) tile
 * @note If geospatial, bounding box is expected to be in web mercator coordinates
 */
export interface VectorTileSource extends TileSource {
  getSchema(): Promise<Schema>;
  getVectorTile(parameters: GetTileParameters): Promise<VectorTile | null>;
  getTileData(
    parameters: GetTileDataParameters
  ): Promise<Feature[] | GeoJSONTable | BinaryFeatureCollection | ArrowTable | null>;
}
