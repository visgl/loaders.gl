// GIS
import type {TypedArray} from '../types';

// GEOJSON FORMAT GEOMETRY

// eslint-disable-next-line import/no-unresolved
export type {GeoJSON, Feature, Geometry, Position, GeoJsonProperties} from 'geojson';
// eslint-disable-next-line import/no-unresolved
export type {Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon} from 'geojson';

// BINARY FORMAT GEOMETRY

export type BinaryAttribute = {value: TypedArray; size: number};
export type BinaryGeometryType = 'Point' | 'LineString' | 'Polygon';

type NumericProps = {[key: string]: BinaryAttribute};
type Properties = object[];

/**
 * Represent a single Geometry, similar to a GeoJSON Geometry
 */
export type BinaryGeometry = BinaryPointGeometry | BinaryLineGeometry | BinaryPolygonGeometry;

export type BinaryPointGeometry = {
  type: 'Point';
  positions: BinaryAttribute;
};

export type BinaryLineGeometry = {
  type: 'LineString';
  positions: BinaryAttribute;
  pathIndices: BinaryAttribute;
};

export type BinaryPolygonGeometry = {
  type: 'Polygon';
  positions: BinaryAttribute;
  polygonIndices: BinaryAttribute;
  primitivePolygonIndices: BinaryAttribute;
};

export type BinaryProperties = {
  featureIds: BinaryAttribute;
  globalFeatureIds: BinaryAttribute;
  numericProps: NumericProps;
  properties: Properties;
  fields?: Properties;
};

export type BinaryPointFeatures = BinaryPointGeometry & BinaryProperties;
export type BinaryLineFeatures = BinaryLineGeometry & BinaryProperties;
export type BinaryPolygonFeatures = BinaryPolygonGeometry & BinaryProperties;

/**
 * Represent a collection of Features, similar to a GeoJSON FeatureCollection
 */
export type BinaryFeatures = {
  points?: BinaryPointFeatures;
  lines?: BinaryLineFeatures;
  polygons?: BinaryPolygonFeatures;
};
