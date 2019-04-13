export const TILE3D_TYPE = {
  COMPOSITE: 'cmpt',
  POINT_CLOUD: 'pnts',
  MODEL_BATCHED: 'b3dm',
  MODEL_INSTANCED: 'i3dm',
  GEOMETRY: 'geom',
  VECTOR: 'vect'
};

export const MAGIC = {
  COMPOSITE: 'cmpt',
  BATCHED_3D_MODEL: 'b3dm',
  INSTANCED_3D_MODEL: 'i3dm',
  POINT_CLOUD: 'pnts'
};

export const MAGIC_ARRAY = {
  BATCHED_MODEL: [98, 51, 100, 109],
  INSTANCED_MODEL: [105, 51, 100, 109],
  POINT_CLOUD: [112, 110, 116, 115],
  COMPOSITE: [99, 109, 112, 116]
};

// subset of GL constants
export const GL = {
  BYTE: 5120,
  UNSIGNED_BYTE: 5121,
  SHORT: 5122,
  UNSIGNED_SHORT: 5123,
  UNSIGNED_INT: 5125,
  FLOAT: 5126
};
