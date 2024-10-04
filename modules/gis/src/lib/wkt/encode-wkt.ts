// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)

import type {Feature, Geometry} from '@loaders.gl/schema';

/**
 * Stringifies a GeoJSON object into WKT
 * @param geojson
 * @returns string
 */
export function encodeWKT(geometry: Geometry | Feature): string {
  if (geometry.type === 'Feature') {
    geometry = geometry.geometry;
  }

  switch (geometry.type) {
    case 'Point':
      return `POINT ${wrapParens(pairWKT(geometry.coordinates))}`;
    case 'LineString':
      return `LINESTRING ${wrapParens(ringWKT(geometry.coordinates))}`;
    case 'Polygon':
      return `POLYGON ${wrapParens(ringsWKT(geometry.coordinates))}`;
    case 'MultiPoint':
      return `MULTIPOINT ${wrapParens(ringWKT(geometry.coordinates))}`;
    case 'MultiPolygon':
      return `MULTIPOLYGON ${wrapParens(multiRingsWKT(geometry.coordinates))}`;
    case 'MultiLineString':
      return `MULTILINESTRING ${wrapParens(ringsWKT(geometry.coordinates))}`;
    case 'GeometryCollection':
      return `GEOMETRYCOLLECTION ${wrapParens(geometry.geometries.map(encodeWKT).join(', '))}`;
    default:
      throw new Error('stringify requires a valid GeoJSON Feature or geometry object as input');
  }
}

function pairWKT(c: number[]): string {
  return c.join(' ');
}

function ringWKT(r: number[][]): string {
  return r.map(pairWKT).join(', ');
}

function ringsWKT(r: number[][][]): string {
  return r.map(ringWKT).map(wrapParens).join(', ');
}

function multiRingsWKT(r: number[][][][]): string {
  return r.map(ringsWKT).map(wrapParens).join(', ');
}

function wrapParens(s: string): string {
  return `(${s})`;
}
