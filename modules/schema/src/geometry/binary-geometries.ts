// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GIS
import type {TypedArray} from '../types/types';

// BINARY FORMAT GEOMETRY

export type BinaryGeometryType = 'Point' | 'LineString' | 'Polygon';

/**
 * Similar to an apache arrow FixedSizeList,
 * contains the contiguous array and the number of values in each element  */
export type BinaryFixedSizeList = {
  value: TypedArray;
  size: number;
};

/**
 * Represent a single Geometry, similar to a GeoJSON Geometry
 */
export type BinaryGeometry = BinaryPointGeometry | BinaryLineGeometry | BinaryPolygonGeometry;

/** Binary point geometry: an array of positions */
export type BinaryPointGeometry = {
  type: 'Point';
  positions: BinaryFixedSizeList;
};

/** Binary line geometry, array of positions and indices to the start of each line */
export type BinaryLineGeometry = {
  type: 'LineString';
  positions: BinaryFixedSizeList;
  pathIndices: BinaryFixedSizeList;
};

/** Binary polygon geometry, an array of positions to each primitite polygon and polygon */
export type BinaryPolygonGeometry = {
  type: 'Polygon';
  positions: BinaryFixedSizeList;
  polygonIndices: BinaryFixedSizeList;
  primitivePolygonIndices: BinaryFixedSizeList;
  triangles?: BinaryFixedSizeList;
};
