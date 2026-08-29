// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)

import type {Geometry, GeoArrowDimension} from '@loaders.gl/schema';

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
  const dimensionToken = getDimensionToken(dimension);
  switch (geometry.type) {
    case 'Point':
      if (geometry.coordinates.length === 0) return `POINT${dimensionToken} EMPTY`;
      return `POINT${dimensionToken} ${wrapParens(pairWKT(geometry.coordinates, dimension))}`;
    case 'LineString':
      if (geometry.coordinates.length === 0) return `LINESTRING${dimensionToken} EMPTY`;
      return `LINESTRING${dimensionToken} ${wrapParens(ringWKT(geometry.coordinates, dimension))}`;
    case 'Polygon':
      if (geometry.coordinates.length === 0) return `POLYGON${dimensionToken} EMPTY`;
      return `POLYGON${dimensionToken} ${wrapParens(ringsWKT(geometry.coordinates, dimension))}`;
    case 'MultiPoint':
      if (geometry.coordinates.length === 0) return `MULTIPOINT${dimensionToken} EMPTY`;
      return `MULTIPOINT${dimensionToken} ${wrapParens(ringWKT(geometry.coordinates, dimension))}`;
    case 'MultiPolygon':
      if (geometry.coordinates.length === 0) return `MULTIPOLYGON${dimensionToken} EMPTY`;
      return `MULTIPOLYGON${dimensionToken} ${wrapParens(multiRingsWKT(geometry.coordinates, dimension))}`;
    case 'MultiLineString':
      if (geometry.coordinates.length === 0) return `MULTILINESTRING${dimensionToken} EMPTY`;
      return `MULTILINESTRING${dimensionToken} ${wrapParens(ringsWKT(geometry.coordinates, dimension))}`;
    case 'GeometryCollection':
      if (geometry.geometries.length === 0) return `GEOMETRYCOLLECTION${dimensionToken} EMPTY`;
      return `GEOMETRYCOLLECTION${dimensionToken} ${wrapParens(geometry.geometries.map(child => convertGeometryToWKT(child, options)).join(', '))}`;
    default:
      throw new Error(
        'convertGeometryToWKT requires a valid GeoJSON Geometry (not Feature) as input'
      );
  }
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

function getFirstCoordinate(geometry: Geometry): number[] | null {
  if (geometry.type === 'Point') return geometry.coordinates;
  if (geometry.type === 'GeometryCollection') return null;
  const coordinates = geometry.coordinates as unknown;
  let value = coordinates;
  while (Array.isArray(value) && Array.isArray(value[0])) value = value[0];
  return Array.isArray(value) ? (value as number[]) : null;
}

function getDimensionSize(dimension: GeoArrowDimension): number {
  return dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
}

function getDimensionToken(dimension: GeoArrowDimension): string {
  return dimension === 'xy'
    ? ''
    : ` ${dimension === 'xyzm' ? 'ZM' : dimension.slice(2).toUpperCase()}`;
}

function pairWKT(c: number[], dimension: GeoArrowDimension): string {
  const coordinateSize = getDimensionSize(dimension);
  const values = c.slice(0, coordinateSize);
  while (values.length < coordinateSize) values.push(0);
  return values.join(' ');
}

function ringWKT(r: number[][], dimension: GeoArrowDimension): string {
  return r.map(coordinate => pairWKT(coordinate, dimension)).join(', ');
}

function ringsWKT(r: number[][][], dimension: GeoArrowDimension): string {
  return r
    .map(ring => ringWKT(ring, dimension))
    .map(wrapParens)
    .join(', ');
}

function multiRingsWKT(r: number[][][][], dimension: GeoArrowDimension): string {
  return r
    .map(rings => ringsWKT(rings, dimension))
    .map(wrapParens)
    .join(', ');
}

function wrapParens(s: string): string {
  return `(${s})`;
}
