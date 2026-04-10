// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type TileContentState =
  | 'unloaded' // Has never been requested
  | 'loading' // Is waiting on a pending request
  | 'processing' // Request received.  Contents are being processed for rendering.  Depending on the content, it might make its own requests for external data.
  | 'ready' // Ready to render.
  | 'expired' // Is expired and will be unloaded once new content is loaded.
  | 'failed'; // Request failed.

export const TILE_CONTENT_STATE = {
  UNLOADED: 0, // Has never been requested
  LOADING: 1, // Is waiting on a pending request
  PROCESSING: 2, // Request received.  Contents are being processed for rendering.  Depending on the content, it might make its own requests for external data.
  READY: 3, // Ready to render.
  EXPIRED: 4, // Is expired and will be unloaded once new content is loaded.
  FAILED: 5 // Request failed.
};

export type TileRefinement = 'add' | 'replace';

export enum TILE_REFINEMENT {
  ADD = 1, // Render tile and, if screen space error exceeded, also refine to its children.
  REPLACE = 2 // Render tile or, if screen space error exceeded, refine to its descendants instead.
}

export type TileType = 'empty' | 'scenegraph' | 'pointcloud' | 'mesh';

export enum TILE_TYPE {
  EMPTY = 'empty',
  SCENEGRAPH = 'scenegraph',
  POINTCLOUD = 'pointcloud',
  MESH = 'mesh'
}

export type TilesetType = 'I3S' | 'TILES3D';

export enum TILESET_TYPE {
  I3S = 'I3S',
  TILES3D = 'TILES3D'
}

export type LODMetricType = 'geometricError' | 'maxScreenThreshold';

export enum LOD_METRIC_TYPE {
  GEOMETRIC_ERROR = 'geometricError',
  MAX_SCREEN_THRESHOLD = 'maxScreenThreshold'
}

// Cesium 3D Tiles Specific
export type Tile3DOptimizationHint = 'NOT_COMPUTED' | 'USE_OPTIMIZATION' | 'SKIP_OPTIMIZATION';

export const TILE3D_OPTIMIZATION_HINT = {
  NOT_COMPUTED: -1,
  USE_OPTIMIZATION: 1,
  SKIP_OPTIMIZATION: 0
};
