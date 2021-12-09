export type MvtOptions = {
  coordinates: string | number[];
  tileIndex: {x: number; y: number; z: number};
  layerProperty: string | number;
  layerName: string;
};

export type MvtBinaryGeometry = {
  data: number[];
  lines: any[];
  areas?: number[];
  type?: string;
  id?: string | number;
};

export type MvtMapboxGeometry = {
  type?: string;
  id?: number;
  length: number;
  coordinates?: any[];
};

export type MvtBinaryCoordinates = {
  type: string;
  geometry: MvtBinaryGeometry;
  properties: {[x: string]: string | number | boolean | null} | null;
  id?: string | number;
};

export type MvtMapboxCoordinates = {
  type: string;
  geometry: {
    type: string;
    coordinates: MvtMapboxGeometry;
  };
  properties: {[x: string]: string | number | boolean | null};
  id?: number;
};

export type MvtPropArrayConstructor =
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  | ArrayConstructor;

export type MvtBinaryOptions = {
  coordLength?: number;
  numericPropKeys?: string[];
  PositionDataType?: Float32ArrayConstructor | Float64ArrayConstructor;
};

export type MvtFirstPassedData = {
  coordLength?: number;

  pointPositionsCount: number;
  pointFeaturesCount: number;
  linePositionsCount: number;
  linePathsCount: number;
  lineFeaturesCount: number;
  polygonPositionsCount: number;
  polygonObjectsCount: number;
  polygonRingsCount: number;
  polygonFeaturesCount: number;
};

export type MvtPoints = {
  type: 'Point';
  positions: Float32Array | Float64Array;
  globalFeatureIds: Uint16Array | Uint32Array;
  featureIds: Uint16Array | Uint32Array;
  numericProps: object;
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
  numericProps: object;
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
  numericProps: object;
  properties: {}[];
  fields: {
    id?: string | number;
  }[];
};

export type MvtGeometries = MvtPoints | MvtLines | MvtPolygons;
