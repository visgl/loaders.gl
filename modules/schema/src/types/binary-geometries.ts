// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GIS
import type {TypedArray} from './types';

// BINARY FORMAT GEOMETRY

export type BinaryAttribute = {value: TypedArray; size: number};
export type BinaryGeometryType = 'Point' | 'LineString' | 'Polygon';

type NumericProps = {[key: string]: BinaryAttribute};
type Properties = object[];

/**
 * Represent a single Geometry, similar to a GeoJSON Geometry
 */
export type BinaryGeometry = BinaryPointGeometry | BinaryLineGeometry | BinaryPolygonGeometry;

/** Binary point geometry: an array of positions */
export type BinaryPointGeometry = {
  type: 'Point';
  positions: BinaryAttribute;
};

/** Binary line geometry, array of positions and indices to the start of each line */
export type BinaryLineGeometry = {
  type: 'LineString';
  positions: BinaryAttribute;
  pathIndices: BinaryAttribute;
};

/** Binary polygon geometry, an array of positions to each primitite polygon and polygon */
export type BinaryPolygonGeometry = {
  type: 'Polygon';
  positions: BinaryAttribute;
  polygonIndices: BinaryAttribute;
  primitivePolygonIndices: BinaryAttribute;
  triangles?: BinaryAttribute;
};

/** Common properties for binary geometries */
export type BinaryProperties = {
  featureIds: BinaryAttribute;
  globalFeatureIds: BinaryAttribute;
  numericProps: NumericProps;
  properties: Properties;
  fields?: Properties;
};

/** Binary feature + binary attributes */
export type BinaryFeature = BinaryPointFeature | BinaryLineFeature | BinaryPolygonFeature;

export type BinaryPointFeature = BinaryPointGeometry & BinaryProperties;
export type BinaryLineFeature = BinaryLineGeometry & BinaryProperties;
export type BinaryPolygonFeature = BinaryPolygonGeometry & BinaryProperties;

/**
 * Represent a collection of Features, similar to a GeoJSON FeatureCollection
 */
export type BinaryFeatureCollection = {
  shape: 'binary-feature-collection';
  points?: BinaryPointFeature;
  lines?: BinaryLineFeature;
  polygons?: BinaryPolygonFeature;
};
