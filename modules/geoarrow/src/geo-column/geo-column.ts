// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GIS
import type {TypedArray} from '@math.gl/types';

// BINARY FORMAT GEOMETRY

export type GeoColumnType = 'Point' | 'LineString' | 'Polygon';

/** A geometry column can be built from list of geometry column data chunks */
export type GeoColumn<MetadataT = Record<string, unknown>> = {
  shape: 'geo-column';
  metadata?: MetadataT;
  data: GeoColumnData[];
};

export type GeoColumnData = GeoColumnPointData | GeoColumnLineData | GeoColumnPolygonData;

/**
 * Describes a single contiguous chunk of geometries in binary columnar format
 * Extracts the nested position and offset arrays from a GeoArrow column
 * @note Designed to be a cheap operation: does not create any new arrays, just holds extracted references the existing arrays
 */
export type GeoColumnCommonData = {
  shape: 'geo-column-data';

  /** Number of rows geometries (can be less than pointCount if representing multipoints) */
  numRows: number;
  /** Offset to the end of the next geometry (length = rowCount) */
  rowOffsets: Uint32Array;

  /** Number of positions */
  numPositions: number;
  /** Data for coordinates, either interleaved or separate arrays */
  positions: GeoColumnPositions;

  /** Stores the data for the respective geometry types */
  // points?: GeoColumnPointData;
  // lines?: GeoColumnLineData;
  // polygons?: GeoColumnPolygonData;
};

/** Columnar point geometry: an array of positions */
export type GeoColumnPointData = GeoColumnCommonData & {
  type: 'Point';
};

/** Columnar line geometry, array of positions and indices to the start of each line */
export type GeoColumnLineData = GeoColumnCommonData & {
  type: 'LineString';

  /** Offset to the next path within the multi feature */
  pathOffsets: Uint32Array;
};

/** Columnar polygon geometry, an array of positions to each primitite polygon and polygon */
export type GeoColumnPolygonData = GeoColumnCommonData & {
  type: 'Polygon';
  /** Offset to next polygon */
  polygonOffsets: Uint32Array;
  /** Offset to next primitive polygon */
  ringOffsets: Uint32Array;
};

export type GeoColumnPositions = GeoColumnInterleavedPositions | GeoColumnSeparatePositions;

/** Positions are in a single coordinate array */
export type GeoColumnInterleavedPositions = {
  layout: 'interleaved';
  /** Dimension, i.e. number of coordinates per position: 2, 3 or 4 */
  stride: 2 | 3 | 4;
  /** Flat array of position coordinates (length = positionCount * positionStride */
  coordinates: TypedArray;
};

/** Positions are in separate coordinate arrays */
export type GeoColumnSeparatePositions = {
  layout: 'separate';
  /** Dimension, i.e. number of coordinates per position: 2, 3 or 4 */
  stride: 2 | 3 | 4;
  /** Flat array of position coordinates (length = positionCount * positionStride */
  coordinates: TypedArray[];
};
