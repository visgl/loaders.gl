import type {TypedArray} from '@loaders.gl/schema';

export type PropArrayConstructor =
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  | ArrayConstructor;

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

export type Polygons = {
  type: 'Polygon';
  positions: Float32Array | Float64Array;
  polygonIndices: Uint16Array | Uint32Array;
  primitivePolygonIndices: Uint16Array | Uint32Array;
  triangles: number[];
  globalFeatureIds: Uint16Array | Uint32Array;
  featureIds: Uint16Array | Uint32Array;
  numericProps: {[key: string]: TypedArray};
  properties: {}[];
  fields: {
    id?: string | number;
  }[];
};
