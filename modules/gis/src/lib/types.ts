import type {TypedArray} from '@loaders.gl/schema';

export type MvtOptions = {
  coordinates: string | number[];
  tileIndex: {x: number; y: number; z: number};
  layerProperty: string | number;
  layerName: string;
};

export type MvtPropArrayConstructor =
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  | ArrayConstructor;

export type MvtPoints = {
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

export type MvtLines = {
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

export type MvtPolygons = {
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

export type MvtGeometries = MvtPoints | MvtLines | MvtPolygons;
