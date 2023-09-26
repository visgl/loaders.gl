// loaders.gl, MIT license

import type {ImageType} from './image-source';
import {TileSource, TileSourceProps} from './tile-source';
import {GetTileParameters, TileLoadParameters} from './tile-source';

export type ImageTileSourceProps = TileSourceProps;

/**
 * MapTileSource - data sources that allow data to be queried by (geospatial) tile
 * @note If geospatial, bounding box is expected to be in web mercator coordinates
 */
export abstract class ImageTileSource<
  PropsT extends ImageTileSourceProps = ImageTileSourceProps
> extends TileSource<PropsT> {
  constructor(props: PropsT) {
    super(props);
    this.getTileData = this.getTileData.bind(this);
  }
  abstract getTile(parameters: GetTileParameters): Promise<ImageType | null>;
  abstract getTileData(props: TileLoadParameters): Promise<ImageType | null>;
}
