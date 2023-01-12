// loaders.gl, MIT license

/*
import {ImageType} from '@loaders.gl/images';

/** General data source class *
export abstract class DataSource {};

/** Data source that serves data by tile index *
export abstract class TileDataSource extends DataSource {};

export type ImageFeatureInfo = {};

export type ImageLayerInfo = {};

export type ImageDataSourceCapabilities = {}

/**
 * ImageDataSource - data sources that allow data to be queried by (geospatial) extents
 * @note
 * - If geospatial, bounding box is expected to be in web mercator coordinates
 *
export abstract class ImageDataSource extends DataSource {
  abstract getCapabilities(): Promise<ImageDataSourceCapabilities>;
  abstract getImage({boundingBox, width, height, layers, parameters}): Promise<ImageType>;
  getFeatureInfo({layers, parameters}): Promise<ImageFeatureInfo> {
    throw new Error('not implemented');
  }
  getLayerInfo({layers, parameters}): Promise<ImageLayerInfo> {
    throw new Error('not implemented');
  }
  getLegendImage({layers, parameters}): Promise<ImageType> {
    throw new Error('not implemented');
  }
}

// Vector Tile Data Source

export type VectorTileDataSourceCapabilities = {
  // check tile.json
}

export type VectorTile = Record<string, any>;

export abstract class VectorTileDataSource extends TileDataSource {
  abstract getCapabilities(): Promise<VectorTileDataSourceCapabilities>;
  abstract getTile({x, y, z, width, height, layers, parameters}): Promise<VectorTile>;
}

// Image Tile Data Source

export type ImageTileDataSourceCapabilities = {
}

export type ImageTile = Record<string, any>;

export type FeatureInfo = {};

export abstract class ImageTileDataSource extends TileDataSource {
  source: ImageDataSource;
  
  constructor(source: ImageDataSource) {
    super();
    this.source = source;
  }

  getCapabilities(): Promise<ImageTileDataSourceCapabilities> {
    return this.source.getCapabilities();
  }

  getTile({x, y, z, width, height, layers, parameters}): Promise<ImageType> {
    const boundingBox = this.getBoundingBoxFromTileIndex(x, y, z);
    return this.source.getImage({boundingBox, width, height, layers, parameters});
  }

  getFeatureInfo(): FeatureInfo | null {
    return null;
  }

  getBoundingBoxFromTileIndex(x: number, y: number, z: number): [number, number, number, number] {
    return [0, 0, 1, 1];
  }
}
*/
