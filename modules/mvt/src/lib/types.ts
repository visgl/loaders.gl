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
  id?: number;
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
  properties: {[x: string]: string | number | boolean | null};
  id?: number;
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
  numericPropKeys: string[];
  propArrayTypes: {[key: string]: MvtPropArrayConstructor};
  PositionDataType: Float32ArrayConstructor;
};

export type MvtFirstPassedData = {
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
  positions: Float32Array;
  globalFeatureIds: Uint16Array | Uint32Array;
  featureIds: Uint16Array | Uint32Array;
  numericProps: object;
  properties: {}[];
  fields: {
    id?: number;
  }[];
};

export type MvtLines = {
  pathIndices: Uint16Array | Uint32Array;
  positions: Float32Array;
  globalFeatureIds: Uint16Array | Uint32Array;
  featureIds: Uint16Array | Uint32Array;
  numericProps: object;
  properties: {}[];
  fields: {
    id?: number;
  }[];
};

export type MvtPolygons = {
  polygonIndices: Uint16Array | Uint32Array;
  primitivePolygonIndices: Uint16Array | Uint32Array;
  positions: Float32Array;
  triangles: number[];
  globalFeatureIds: Uint16Array | Uint32Array;
  featureIds: Uint16Array | Uint32Array;
  numericProps: object;
  properties: {}[];
  fields: {
    id?: number;
  }[];
};
