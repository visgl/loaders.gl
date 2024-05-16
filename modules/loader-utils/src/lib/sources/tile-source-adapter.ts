// loaders.gl
// SPDX-License-Identifier: MIT

import {TileSource, GetTileParameters, GetTileDataParameters} from './tile-source';
import {ImageSource, ImageSourceMetadata} from './image-source';

/**
 * MapTileSource - data sources that allow data to be queried by (geospatial) extents
 * @note
 * - If geospatial, bounding box is expected to be in web mercator coordinates
 */
// @ts-expect-error TODO - does not implement all DataSource members
export class TileSourceAdapter implements TileSource<ImageSourceMetadata> {
  readonly viewportSource: ImageSource;
  constructor(source: ImageSource) {
    this.viewportSource = source;
  }
  async getMetadata(): Promise<ImageSourceMetadata> {
    return await this.viewportSource.getMetadata();
  }

  /** Flat parameters */
  getTile(parameters: GetTileParameters): Promise<unknown> {
    const width = 512;
    const height = 512;
    const boundingBox = this.getTileBoundingBox(parameters);
    return this.viewportSource.getImage({boundingBox, layers: [], width, height});
  }

  /** deck.gl style parameters */
  getTileData(parameters: GetTileDataParameters): Promise<unknown | null> {
    return this.getTile(parameters.index);
  }

  /** Bounding box of tiles in this tileset `[[w, s], [e, n]]`  */
  protected getTileBoundingBox(
    parameters: GetTileParameters
  ): [min: [x: number, y: number], max: [x: number, y: number]] {
    if (parameters.crs && parameters.crs !== 'ESPG3758') {
      throw new Error('SRS not ESPG3758');
    }
    const {x, y, z: zoom} = parameters;

    return [
      /** Bounding box of tile in this tileset `[[w, s], ...]`  */
      this.getTileLowerLeftCorner(x, y, zoom),
      /** Bounding box of tile in this tileset `[..., [e, n]]`  */
      this.getTileLowerLeftCorner(x + 1, y - 1, zoom)
    ];
  }

  getTileLowerLeftCorner(x: number, y: number, zoom: number): [number, number] {
    const tiles = 2 ^ zoom;
    const longitude = (x / tiles) * 360.0 - 180.0;
    const latitudeRadians = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / tiles)));
    const latitude = (180.0 * latitudeRadians) / Math.PI;
    return [longitude, latitude];
  }
}
