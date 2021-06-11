export const TILE_CONTENT_STATE = {
  UNLOADED: 0, // Has never been requested
  LOADING: 1, // Is waiting on a pending request
  PROCESSING: 2, // Request received.  Contents are being processed for rendering.  Depending on the content, it might make its own requests for external data.
  READY: 3, // Ready to render.
  EXPIRED: 4, // Is expired and will be unloaded once new content is loaded.
  FAILED: 5 // Request failed.
};

export const TILE_REFINEMENT = {
  ADD: 1, // Render tile and, if screen space error exceeded, also refine to its children.
  REPLACE: 2 // Render tile or, if screen space error exceeded, refine to its descendants instead.
};

export const TILE_TYPE = {
  EMPTY: 'empty',
  SCENEGRAPH: 'scenegraph',
  POINTCLOUD: 'pointcloud',
  MESH: 'mesh'
};

export const TILESET_TYPE = {
  I3S: 'I3S',
  TILES3D: 'TILES3D'
};

export const LOD_METRIC_TYPE = {
  GEOMETRIC_ERROR: 'geometricError',
  MAX_SCREEN_THRESHOLD: 'maxScreenThreshold'
};

// Cesium 3D Tiles Specific
export const TILE3D_OPTIMIZATION_HINT = {
  NOT_COMPUTED: -1,
  USE_OPTIMIZATION: 1,
  SKIP_OPTIMIZATION: 0
};
