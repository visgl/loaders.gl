// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, Feature, BinaryFeatureCollection} from '@loaders.gl/schema';
import {TileSource, TileSourceProps, TileSourceMetadata, GetTileParameters} from './tile-source';
import type {GetTileDataParameters} from './tile-source';

export type VectorTile = unknown;

export type VectorTileSourceProps = TileSourceProps;

/**
 * VectorTileSource - data sources that allow data to be queried by (geospatial) tile
 * @note If geospatial, bounding box is expected to be in web mercator coordinates
 */
export interface VectorTileSource<
  PropsT extends VectorTileSourceProps = VectorTileSourceProps,
  MetadataT extends TileSourceMetadata = TileSourceMetadata
> extends TileSource<PropsT, MetadataT> {
  getSchema(): Promise<Schema>;
  getVectorTile(parameters: GetTileParameters): Promise<VectorTile | null>;
  getTileData(
    parameters: GetTileDataParameters
  ): Promise<Feature[] | BinaryFeatureCollection | null>;
}
