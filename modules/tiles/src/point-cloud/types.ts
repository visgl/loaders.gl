import type {DataSource, DataSourceOptions} from '@loaders.gl/loader-utils';

/**
 * An accessor-like description for point cloud attributes.
 */
export type PointCloudAttribute = {
  value: ArrayBufferView;
  size: number;
  normalized?: boolean;
};

/**
 * A normalized point cloud tile content payload.
 */
export type PointCloudTileContent = {
  attributes: {
    positions: PointCloudAttribute;
    colors?: PointCloudAttribute;
    normals?: PointCloudAttribute;
  };
  pointCount: number;
  cartographicOrigin: number[];
  coordinateSystem: number;
  constantRGBA?: number[];
};

/**
 * A cartographic bounding volume for a point cloud tile.
 */
export type PointCloudBoundingVolume = {
  cartographicBounds: [min: number[], max: number[]];
  center: number[];
  radius: number;
};

/**
 * A source-owned tile header used by the point cloud tileset.
 */
export type PointCloudTileHeader = {
  id: string;
  level: number;
  pointCount: number;
  geometricError: number;
  boundingVolume: PointCloudBoundingVolume;
};

/**
 * Optional tileset view metadata.
 */
export type PointCloudTilesetViewState = {
  cartographicCenter?: number[];
  zoom?: number;
  boundingVolume?: PointCloudBoundingVolume;
};

/**
 * Structural contract for point cloud sources that can back a PointCloudTileset.
 */
export type PointCloudTilesetSource<
  DataT = unknown,
  OptionsT extends DataSourceOptions = DataSourceOptions
> = DataSource<DataT, OptionsT> & {
  isReady: boolean;
  initialize(): Promise<void>;
  getMetadata?(): Promise<unknown>;
  getRootTile(): Promise<PointCloudTileHeader>;
  getChildren(tile: PointCloudTileHeader): Promise<PointCloudTileHeader[]>;
  loadTileContent(tile: PointCloudTileHeader): Promise<PointCloudTileContent | null>;
  getViewState?(): Promise<PointCloudTilesetViewState> | PointCloudTilesetViewState;
};
