// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageType} from './utils/image-type';
import type {TileSource, TileSourceMetadata} from './tile-source';
import type {GetTileParameters} from './tile-source';

/**
 * MapTileSource - data sources that allow data to be queried by (geospatial) tile
 * @note If geospatial, bounding box is expected to be in web mercator coordinates
 */
export interface ImageTileSource<MetadataT extends TileSourceMetadata = TileSourceMetadata>
  extends TileSource<MetadataT> {
  getImageTile(parameters: GetTileParameters): Promise<ImageType | null>;
}
