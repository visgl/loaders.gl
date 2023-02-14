// loaders.gl, MIT license

/** General data source class */
// export abstract class DataSource {};
// export type DataSourceMetadata = {};

// ImageSource

// Tile Source

/** Data source that serves data by tile index *
export abstract class TileDataSource extends DataSource {};

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

// Vector Tile Source

export type VectorTileDataSourceCapabilities = {
  // check tile.json
}

export type VectorTile = Record<string, any>;

export abstract class VectorTileDataSource extends TileDataSource {
  abstract getCapabilities(): Promise<VectorTileDataSourceCapabilities>;
  abstract getTile({x, y, z, width, height, layers, parameters}): Promise<VectorTile>;
}

*/
