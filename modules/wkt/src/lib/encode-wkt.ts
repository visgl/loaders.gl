// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)
// eslint-disable-next-line import/no-unresolved
import type {Feature, Geometry} from 'geojson';

/**
 * Stringifies a GeoJSON object into WKT
 * @param geojson
 * @returns string
 */
export default function encodeWKT(geometry: Geometry | Feature): string {
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

function pairWKT(c: number[]) {
  return c.join(' ');
}

function ringWKT(r: number[][]) {
  return r.map(pairWKT).join(', ');
}

function ringsWKT(r: number[][][]) {
  return r.map(ringWKT).map(wrapParens).join(', ');
}

function multiRingsWKT(r: number[][][][]) {
  return r.map(ringsWKT).map(wrapParens).join(', ');
}

function wrapParens(s: string) {
  return `(${s})`;
}
