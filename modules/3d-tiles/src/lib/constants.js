// TILE TYPES

export const TILE3D_TYPE = {
  COMPOSITE: 'cmpt',
  POINT_CLOUD: 'pnts',
  BATCHED_3D_MODEL: 'b3dm',
  INSTANCED_3D_MODEL: 'i3dm',
  GEOMETRY: 'geom',
  VECTOR: 'vect'
};

export const TILE3D_TYPES = Object.keys(TILE3D_TYPE);

export const MAGIC_ARRAY = {
  BATCHED_MODEL: [98, 51, 100, 109],
  INSTANCED_MODEL: [105, 51, 100, 109],
  POINT_CLOUD: [112, 110, 116, 115],
  COMPOSITE: [99, 109, 112, 116]
};

// TILE CONSTANTS

// TODO - do we need this?
export const TILE3D_CONTENT_STATE = {
  UNLOADED: 0, // Has never been requested
  LOADING: 1, // Is waiting on a pending request
  PROCESSING: 2, // Request received.  Contents are being processed for rendering.  Depending on the content, it might make its own requests for external data.
  READY: 3, // Ready to render.
  EXPIRED: 4, // Is expired and will be unloaded once new content is loaded.
  FAILED: 5 // Request failed.
};

export const TILE3D_OPTIMIZATION_HINT = {
  NOT_COMPUTED: -1,
  USE_OPTIMIZATION: 1,
  SKIP_OPTIMIZATION: 0
};

export const TILE3D_COLOR_BLEND_MODE = {
  HIGHLIGHT: 0, // Multiplies the source color by the feature color.
  REPLACE: 1, // Replaces the source color with the feature color.
  MIX: 2 // Blends the source color and feature color together
};

export const TILE3D_REFINEMENT = {
  ADD: 0, // Render tile and, if screen space error exceeded, also refine to its children.
  REPLACE: 1 // Render tile or, if screen space error exceeded, refine to its descendants instead.
};
// SUBSET OF GL CONSTANTS - CAN BE USED DIRECTLY WITH WEBGL
