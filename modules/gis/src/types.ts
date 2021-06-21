type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

export type BinaryAttribute = {value: TypedArray; size: number};
export type BinaryGeometryType = 'Point' | 'LineString' | 'Polygon';

// GEOJSON GEOMETRY

export type Feature = {
  type: 'Feature';
  geometry;
  // properties can be undefined if dbfResponse above was empty
  properties;
};

// BINARY GEOMETRY

type NumericProps = {[key: string]: BinaryAttribute};
type Properties = object[];

/**
 * Represent a single Geometry, similar to a GeoJSON Geometry
 */
export type BinaryGeometryData = {
  positions: BinaryAttribute;
  pathIndices?: BinaryAttribute;
  polygonIndices?: BinaryAttribute;
  primitivePolygonIndices?: BinaryAttribute;
  // Can be passed separately
  type?: BinaryGeometryType;
};

/**
 * Represent a collection of Features, similar to a GeoJSON FeatureCollection
 */
export type BinaryFeaturesData = {
  points?: {
    positions: BinaryAttribute;
    featureIds: BinaryAttribute;
    globalFeatureIds: BinaryAttribute;
    numericProps: NumericProps;
    properties: Properties;
  };
  lines?: {
    positions: BinaryAttribute;
    pathIndices: BinaryAttribute;
    featureIds: BinaryAttribute;
    globalFeatureIds: BinaryAttribute;
    numericProps: NumericProps;
    properties: Properties;
  };
  polygons?: {
    positions: BinaryAttribute;
    polygonIndices: BinaryAttribute;
    primitivePolygonIndices: BinaryAttribute;
    featureIds: BinaryAttribute;
    globalFeatureIds: BinaryAttribute;
    numericProps: NumericProps;
    properties: Properties;
  };
};
