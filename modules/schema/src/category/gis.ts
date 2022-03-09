// GIS
import type {TypedArray} from '../types';
import type {Feature, Geometry, Point, LineString, Polygon} from 'geojson';

// GEOJSON FORMAT GEOMETRY

// eslint-disable-next-line import/no-unresolved
export type {
  GeoJSON,
  Feature,
  FeatureCollection,
  Geometry,
  Position,
  GeoJsonProperties
} from 'geojson';
// eslint-disable-next-line import/no-unresolved
export type {
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeometryCollection
} from 'geojson';

// Aggregate information for converting GeoJSON into other formats
export type GeojsonGeometryInfo = {
  coordLength: number;
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

// FLAT GEOJSON FORMAT GEOMETRY
export type FlatGeometryType = 'Point' | 'LineString' | 'Polygon';
type RemoveCoordinatesField<Type> = {
  [Property in keyof Type as Exclude<Property, 'coordinates'>]: Type[Property];
};

/**
 * Generic flat geometry data storage type
 */
export type FlatIndexedGeometry = {
  data: number[];
  indices: number[];
};

/**
 * GeoJSON (Multi)Point geometry with coordinate data flattened into `data` array and indexed by `indices`
 */
export type FlatPoint = RemoveCoordinatesField<Point> & FlatIndexedGeometry;

/**
 * GeoJSON (Multi)LineString geometry with coordinate data flattened into `data` array and indexed by `indices`
 */
export type FlatLineString = RemoveCoordinatesField<LineString> & FlatIndexedGeometry;

/**
 * GeoJSON (Multi)Polygon geometry with coordinate data flattened into `data` array and indexed by 2D `indices`
 */
export type FlatPolygon = RemoveCoordinatesField<Polygon> & {
  data: number[];
  indices: number[][];
  areas: number[][];
};

export type FlatGeometry = FlatPoint | FlatLineString | FlatPolygon;

type FlattenGeometry<Type> = {
  [Property in keyof Type]: Type[Property] extends Geometry ? FlatGeometry : Type[Property];
};

/**
 * GeoJSON Feature with Geometry replaced by FlatGeometry
 */
export type FlatFeature = FlattenGeometry<Feature>;

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
  triangles?: BinaryAttribute;
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
