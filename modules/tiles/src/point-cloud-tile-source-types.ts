// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSourceOptions} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import type {PointCloudTilerOptions} from '@loaders.gl/schema-utils';
import type {TilesetSpatialReference} from './spatial/spatial-types';

/** Decoded points supplied to the dynamic point-cloud source. */
export type PointCloudTileSourceInput = Mesh | MeshArrowTable;

/** Options for native-coordinate, additive dynamic point tiling. */
export type PointCloudTileSourceOptions = DataSourceOptions & {
  /** Point indexing, output and lifetime controls. No CRS is inferred. */
  pointCloudTiler?: PointCloudTilerOptions & {
    /** Spatial metadata for the input coordinates; retained without reprojection. */
    readonly spatialReference?: TilesetSpatialReference;
  };
};
