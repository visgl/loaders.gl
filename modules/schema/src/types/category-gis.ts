// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GIS

// NORMAL GEOJSON FORMAT GEOMETRY
export type {
  GeoJSON,
  Feature,
  FeatureCollection,
  Geometry,
  Position,
  GeoJsonProperties
} from 'geojson';

export type {
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeometryCollection
} from 'geojson';

// FLAT GEOJSON FORMAT GEOMETRY
export type {
  FlatGeometryType,
  FlatIndexedGeometry,
  FlatPoint,
  FlatLineString,
  FlatPolygon,
  FlatGeometry,
  FlatFeature
} from './flat-geometries';

// BINARY FORMAT GEOMETRY
export type {
  BinaryAttribute,
  BinaryGeometryType,
  BinaryGeometry,
  BinaryPointGeometry,
  BinaryLineGeometry,
  BinaryPolygonGeometry,
  BinaryProperties,
  BinaryFeatureCollection,
  BinaryFeature,
  BinaryPointFeature,
  BinaryLineFeature,
  BinaryPolygonFeature
} from './binary-geometries';

/** Aggregate information for converting GeoJSON into other formats */
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
