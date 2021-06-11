import type {GeoTIFFImage, RasterOptions} from 'geotiff';
import {getImageSize, isInterleaved, SIGNAL_ABORTED} from './utils/tiff-utils';

import type {
  PixelSource,
  PixelSourceSelection,
  PixelSourceMeta,
  Dtype,
  Labels,
  RasterSelection,
  TileSelection,
  PixelData
} from '../types';

class TiffPixelSource<S extends string[]> implements PixelSource<S> {
  private _indexer: (sel: PixelSourceSelection<S>) => Promise<GeoTIFFImage>;

  constructor(
    indexer: (sel: PixelSourceSelection<S>) => Promise<GeoTIFFImage>,
    public dtype: Dtype,
    public tileSize: number,
    public shape: number[],
    public labels: Labels<S>,
    public meta?: PixelSourceMeta
  ) {
    this._indexer = indexer;
  }

  async getRaster({selection, signal}: RasterSelection<S>) {
    const image = await this._indexer(selection);
    return this._readRasters(image, {signal});
  }

  async getTile({x, y, selection, signal}: TileSelection<S>) {
    const {height, width} = this._getTileExtent(x, y);
    const x0 = x * this.tileSize;
    const y0 = y * this.tileSize;
    const window = [x0, y0, x0 + width, y0 + height];

    const image = await this._indexer(selection);
    return this._readRasters(image, {window, width, height, signal});
  }

  private async _readRasters(image: GeoTIFFImage, props?: RasterOptions) {
    const interleave = isInterleaved(this.shape);
    const raster = await image.readRasters({interleave, ...props});

    if (props?.signal?.aborted) {
      throw SIGNAL_ABORTED;
    }

    /*
     * geotiff.js returns objects with different structure
     * depending on `interleave`. It's weird, but this seems to work.
     */
    const data = (interleave ? raster : raster[0]) as TypedArray;
    return {
      data,
      width: raster.width,
      height: raster.height
    } as PixelData;
  }

  /*
   * Computes tile size given x, y coord.
   */
  private _getTileExtent(x: number, y: number) {
    const {height: zoomLevelHeight, width: zoomLevelWidth} = getImageSize(this);
    let height = this.tileSize;
    let width = this.tileSize;
    const maxXTileCoord = Math.floor(zoomLevelWidth / this.tileSize);
    const maxYTileCoord = Math.floor(zoomLevelHeight / this.tileSize);
    if (x === maxXTileCoord) {
      width = zoomLevelWidth % this.tileSize;
    }
    if (y === maxYTileCoord) {
      height = zoomLevelHeight % this.tileSize;
    }
    return {height, width};
  }

  onTileError(err: Error) {
    console.error(err);
  }
}

export default TiffPixelSource;
