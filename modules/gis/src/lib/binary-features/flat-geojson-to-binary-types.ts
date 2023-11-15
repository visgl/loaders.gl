import type {TypedArray} from '@loaders.gl/schema';

/**
 * Permissable constructor for numeric props
 */
export type PropArrayConstructor =
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  | ArrayConstructor;

/**
 * Collection type for holding intermediate binary data before conversion to `BinaryPointGeometry`
 */
export type Points = {
  type: 'Point';
  positions: Float32Array | Float64Array;
  globalFeatureIds: Uint16Array | Uint32Array;
  featureIds: Uint16Array | Uint32Array;
  numericProps: {[key: string]: TypedArray};
  properties: {}[];
  fields: {
    id?: string | number;
  }[];
};

/**
 * Collection type for holding intermediate binary data before conversion to `BinaryLineStringGeometry`
 */
export type Lines = {
  type: 'LineString';
  positions: Float32Array | Float64Array;
  pathIndices: Uint16Array | Uint32Array;
  globalFeatureIds: Uint16Array | Uint32Array;
  featureIds: Uint16Array | Uint32Array;
  numericProps: {[key: string]: TypedArray};
  properties: {}[];
  fields: {
    id?: string | number;
  }[];
};

/**
 * Collection type for holding intermediate binary data before conversion to `BinaryPolygonGeometry`
 */
export type Polygons = {
  type: 'Polygon';
  positions: Float32Array | Float64Array;
  polygonIndices: Uint16Array | Uint32Array;
  primitivePolygonIndices: Uint16Array | Uint32Array;
  triangles?: number[];
  globalFeatureIds: Uint16Array | Uint32Array;
  featureIds: Uint16Array | Uint32Array;
  numericProps: {[key: string]: TypedArray};
  properties: {}[];
  fields: {
    id?: string | number;
  }[];
};
