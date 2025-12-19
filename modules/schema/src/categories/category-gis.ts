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
} from '../geometry/flat-geometries';

// BINARY FORMAT GEOMETRY
export type {
  BinaryGeometryType,
  BinaryFixedSizeList,
  BinaryGeometry,
  BinaryPointGeometry,
  BinaryLineGeometry,
  BinaryPolygonGeometry
} from '../geometry/binary-geometries';
export type {
  BinaryAttribute,
  BinaryProperties,
  BinaryFeatureCollection,
  BinaryFeature,
  BinaryPointFeature,
  BinaryLineFeature,
  BinaryPolygonFeature
} from '../geometry/binary-features';
