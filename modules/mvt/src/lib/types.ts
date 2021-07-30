export type MvtOptions = {
  coordinates: string | any[];
  tileIndex: {x: number; y: number; z: number};
  layerProperty: string | number;
  layerName: any;
};

export type MvtBinaryGeometry = {
  data: number[];
  lines: number[];
  type?: string;
  id?: any;
};

export type MvtMapboxGeometry = {
  type?: string;
  id?: any;
  length: number;
  coordinates: any;
};

export type MvtBinaryCoordinates = {
  type: string;
  geometry: MvtBinaryGeometry;
  properties: {};
  id?: any;
};

export type MvtMapboxCoordinates = {
  type: string;
  geometry: {
    type?: string;
    id?: any;
    coordinates: any;
  };
  properties: {};
  id?: any;
};

export type MvtBinaryOptions = {
  numericPropKeys: string | string[];
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
  positions: any;
  globalFeatureIds: any;
  featureIds: Uint32Array | Uint16Array;
  numericProps: {};
  properties: {}[];
};

export type MvtLines = {
  pathIndices: Uint32Array | Uint16Array;
  positions: any;
  globalFeatureIds: any;
  featureIds: Uint32Array | Uint16Array;
  numericProps: {};
  properties: {}[];
};

export type MvtPolygons = {
  polygonIndices: Uint32Array | Uint16Array;
  primitivePolygonIndices: Uint32Array | Uint16Array;
  positions: any;
  triangles: any;
  globalFeatureIds: any;
  featureIds: Uint32Array | Uint16Array;
  numericProps: {[x: string]: Float32Array};
  properties: {}[];
};
