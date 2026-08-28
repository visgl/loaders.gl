// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSource, DataSourceOptions} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';

/**
 * An accessor-like description for point cloud attributes.
 */
export type PointCloudAttribute = {
  value: ArrayBufferView;
  size: number;
  normalized?: boolean;
};

/**
 * deck.gl coordinate system string values accepted by point cloud tile content.
 */
export type PointCloudCoordinateSystem =
  | 'default'
  | 'lnglat'
  | 'meter-offsets'
  | 'lnglat-offsets'
  | 'cartesian';

/**
 * A normalized point cloud tile content payload.
 */
export type PointCloudTileContent = {
  data: MeshArrowTable;
  pointCount: number;
  cartographicOrigin: number[];
  coordinateSystem: PointCloudCoordinateSystem;
  constantRGBA?: number[];
  modelMatrix?: number[] | Float32Array;
};

/**
 * A cartographic bounding volume for a point cloud tile.
 */
export type PointCloudBoundingVolume = {
  cartographicBounds: [min: number[], max: number[]];
  /** True when the longitude interval crosses the antimeridian. */
  wrapsDateline?: boolean;
  /** True when the longitude interval covers the full globe. */
  coversFullLongitude?: boolean;
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
  /** I3S LOD metric used to decide whether this node refines. */
  lodSelectionMetricType?: 'maxScreenThresholdSQ' | 'density-threshold';
  /** Source-provided LOD threshold for density or screen metrics. */
  lodThreshold?: number;
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
