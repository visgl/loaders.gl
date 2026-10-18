// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageType} from './utils/image-type';
import type {
  TileSourceProps,
  TileSourceMetadata,
  GetTileParameters,
  TileSource
} from './tile-source';

export type ImageTileSourceProps = TileSourceProps;

/**
 * MapTileSource - data sources that allow data to be queried by (geospatial) tile
 * @note If geospatial, bounding box is expected to be in web mercator coordinates
 */
export interface ImageTileSource extends TileSource {
  getMetadata(): Promise<TileSourceMetadata>;
  getImageTile(parameters: GetTileParameters): Promise<ImageType | null>;
}
