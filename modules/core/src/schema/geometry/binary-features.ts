// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GIS
import type {TypedArray} from '../types/types';
import type {
  BinaryPointGeometry,
  BinaryLineGeometry,
  BinaryPolygonGeometry
} from './binary-geometries';

export type BinaryAttribute = {
  value: TypedArray;
  size: number;
};

/**
 * Represent a collection of Features, similar to a GeoJSON FeatureCollection
 * But in columnar format, with binary columns when possible
 */
export type BinaryFeatureCollection = {
  shape: 'binary-feature-collection';
  points?: BinaryPointFeature;
  lines?: BinaryLineFeature;
  polygons?: BinaryPolygonFeature;
};

/** Binary feature + binary attributes */
export type BinaryFeature = BinaryPointFeature | BinaryLineFeature | BinaryPolygonFeature;

export type BinaryPointFeature = BinaryPointGeometry & BinaryProperties;
export type BinaryLineFeature = BinaryLineGeometry & BinaryProperties;
export type BinaryPolygonFeature = BinaryPolygonGeometry & BinaryProperties;

/** Common properties for binary geometries */
export type BinaryProperties = {
  featureIds: BinaryAttribute;
  globalFeatureIds: BinaryAttribute;
  numericProps: Record<string, BinaryAttribute>;
  properties: Record<string, any>[];
  fields?: Record<string, any>[];
};
