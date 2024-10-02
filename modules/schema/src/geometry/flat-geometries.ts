// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// FLAT GEOJSON FORMAT GEOMETRY
import type {Feature, Geometry, Point, LineString, Polygon} from 'geojson';

/** Flat geometry type */
export type FlatGeometryType = 'Point' | 'LineString' | 'Polygon';

type RemoveCoordinatesField<Type> = {
  [Property in keyof Type as Exclude<Property, 'coordinates'>]: Type[Property];
};

/** Generic flat geometry data storage type */
export type FlatIndexedGeometry = {
  data: number[];
  indices: number[];
};

/** GeoJSON (Multi)Point geometry with coordinate data flattened into `data` array and indexed by `indices` */
export type FlatPoint = RemoveCoordinatesField<Point> & FlatIndexedGeometry;

/** GeoJSON (Multi)LineString geometry with coordinate data flattened into `data` array and indexed by `indices` */
export type FlatLineString = RemoveCoordinatesField<LineString> & FlatIndexedGeometry;

/** GeoJSON (Multi)Polygon geometry with coordinate data flattened into `data` array and indexed by 2D `indices` */
export type FlatPolygon = RemoveCoordinatesField<Polygon> & {
  data: number[];
  indices: number[][];
  areas: number[][];
};

/** GeoJSON geometry with coordinate data flattened into `data` array and indexed by 2D `indices` */
export type FlatGeometry = FlatPoint | FlatLineString | FlatPolygon;

type FlattenGeometry<Type> = {
  [Property in keyof Type]: Type[Property] extends Geometry ? FlatGeometry : Type[Property];
};

/** GeoJSON Feature with Geometry replaced by FlatGeometry */
export type FlatFeature = FlattenGeometry<Feature>;
