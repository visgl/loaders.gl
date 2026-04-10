// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// FLAT GEOJSON FORMAT GEOMETRY
import type {Feature, Geometry} from 'geojson';

/**
 * Generic flat geometry data storage type
 * (an intermediate "Flat GeoJSON"
 * data format, which maps closely to the binary data buffers.
 * It is similar to GeoJSON, but rather than storing the coordinates
 * in multidimensional arrays, we have a 1D `data` with all the
 * coordinates, and then index into this using the `indices`
 * parameter
 *
 * Thus the indices member lets us look up the relevant range
 * from the data array.
 * The Multi* versions of the above types share the same data
 * structure, just with multiple elements in the indices array
 *
 * @example
 *
 * geometry: {
 *   type: 'Point', data: [1,2], indices: [0]
 * }
 * geometry: {
 *   type: 'LineString', data: [1,2,3,4,...], indices: [0]
 * }
 * geometry: {
 *   type: 'Polygon', data: [1,2,3,4,...], indices: [[0, 2]]
 * }
 */
export type FlatIndexedGeometry = {
  data: number[];
  indices: number[];
};

/** Flat geometry type */
export type FlatGeometryType = 'Point' | 'LineString' | 'Polygon';

/** GeoJSON geometry with coordinate data flattened into `data` array and indexed by 2D `indices` */
export type FlatGeometry = FlatPoint | FlatLineString | FlatPolygon;

/** GeoJSON (Multi)Point geometry with coordinate data flattened into `data` array and indexed by `indices` */
export type FlatPoint = {
  type: 'Point';
  data: number[];
  indices: number[];
};

/** GeoJSON (Multi)LineString geometry with coordinate data flattened into `data` array and indexed by `indices` */
export type FlatLineString = {
  type: 'LineString';
  data: number[];
  indices: number[];
};

/** GeoJSON (Multi)Polygon geometry with coordinate data flattened into `data` array and indexed by 2D `indices` */
export type FlatPolygon = {
  type: 'Polygon';
  data: number[];
  indices: number[][];
  areas: number[][];
};

type FlattenGeometry<Type> = {
  [Property in keyof Type]: Type[Property] extends Geometry ? FlatGeometry : Type[Property];
};

/** GeoJSON Feature with Geometry replaced by FlatGeometry */
export type FlatFeature = FlattenGeometry<Feature>;
