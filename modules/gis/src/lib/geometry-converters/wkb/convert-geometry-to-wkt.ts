// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)

import type {Geometry, GeoArrowDimension} from '@loaders.gl/schema';
import {formatWKT} from '@math.gl/wkb';

/** Options controlling dimensional tokens in WKT output. */
export type WKTGeometryOptions = {
  /** Exact WKT coordinate dimension. */
  dimension?: GeoArrowDimension;
  /** Legacy flag for Z output when `dimension` is omitted. */
  hasZ?: boolean;
  /** Legacy flag for M output when `dimension` is omitted. */
  hasM?: boolean;
};

/**
 * Stringifies a GeoJSON object into WKT
 * @param geojson
 * @returns string
 */
export function convertGeometryToWKT(geometry: Geometry, options?: WKTGeometryOptions): string {
  const dimension = getWKTDimension(geometry, options);
  if (
    geometry.type === 'GeometryCollection' &&
    !options?.dimension &&
    !options?.hasZ &&
    !options?.hasM &&
    hasMixedChildDimensions(geometry)
  ) {
    if (geometry.geometries.length === 0) return 'GEOMETRYCOLLECTION EMPTY';
    return `GEOMETRYCOLLECTION (${geometry.geometries
      .map(child => convertGeometryToWKT(child))
      .join(', ')})`;
  }
  return formatWKT(normalizeGeometryDimension(geometry, dimension), dimension);
}

/** Normalizes every coordinate tuple to the dimension requested by the loaders.gl API. */
function normalizeGeometryDimension(geometry: Geometry, dimension: GeoArrowDimension): Geometry {
  if (geometry.type === 'GeometryCollection') {
    return {
      type: 'GeometryCollection',
      geometries: geometry.geometries.map(child => normalizeGeometryDimension(child, dimension))
    };
  }

  return {
    ...geometry,
    coordinates: normalizeCoordinateNesting(geometry.coordinates, getDimensionSize(dimension))
  } as Geometry;
}

/** Recursively normalizes coordinate tuples while preserving empty coordinate arrays. */
function normalizeCoordinateNesting(value: unknown[], dimensionSize: number): unknown[] {
  if (value.length === 0) return value;
  if (typeof value[0] === 'number') {
    const coordinate = (value as number[]).slice(0, dimensionSize);
    while (coordinate.length < dimensionSize) coordinate.push(0);
    return coordinate;
  }
  return value.map(child => normalizeCoordinateNesting(child as unknown[], dimensionSize));
}

function hasMixedChildDimensions(
  geometry: Extract<Geometry, {type: 'GeometryCollection'}>
): boolean {
  const dimensions = geometry.geometries.map(child => getCoordinateDimension(child));
  return dimensions.some(dimension => dimension !== dimensions[0]);
}

function getWKTDimension(geometry: Geometry, options?: WKTGeometryOptions): GeoArrowDimension {
  if (options?.dimension) return options.dimension;
  if (options?.hasZ && options?.hasM) return 'xyzm';
  if (options?.hasZ) return 'xyz';
  if (options?.hasM) return 'xym';
  const declaredDimension = (geometry as Geometry & {__geoarrowDimension?: GeoArrowDimension})
    .__geoarrowDimension;
  if (declaredDimension) return declaredDimension;
  return getCoordinateDimension(geometry);
}

function getCoordinateDimension(geometry: Geometry): GeoArrowDimension {
  const declaredDimension = (geometry as Geometry & {__geoarrowDimension?: GeoArrowDimension})
    .__geoarrowDimension;
  if (declaredDimension) return declaredDimension;
  if (geometry.type === 'GeometryCollection') {
    const childDimensions = geometry.geometries.map(getCoordinateDimension);
    return childDimensions.length > 0 &&
      childDimensions.every(dimension => dimension === childDimensions[0])
      ? childDimensions[0]
      : 'xy';
  }
  const coordinate = getFirstCoordinate(geometry);
  return coordinate && coordinate.length >= 4
    ? 'xyzm'
    : coordinate && coordinate.length >= 3
      ? 'xyz'
      : 'xy';
}

function getDimensionSize(dimension: GeoArrowDimension): number {
  return dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
}

function getFirstCoordinate(geometry: Geometry): number[] | null {
  if (geometry.type === 'Point') return geometry.coordinates;
  if (geometry.type === 'GeometryCollection') return null;
  const coordinates = geometry.coordinates as unknown;
  let value = coordinates;
  while (Array.isArray(value) && Array.isArray(value[0])) value = value[0];
  return Array.isArray(value) ? (value as number[]) : null;
}
