// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)
// eslint-disable-next-line import/no-unresolved
import type {Feature, Geometry} from 'geojson';
/**
 * Stringifies a GeoJSON object into WKT
 * @param geojson
 * @returns string
 */

export default function encodeWKT(gj: Geometry | Feature): string {
  if (gj.type === 'Feature') {
    gj = gj.geometry;
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

  switch (gj.type) {
    case 'Point':
      return `POINT ${wrapParens(pairWKT(gj.coordinates))}`;
    case 'LineString':
      return `LINESTRING ${wrapParens(ringWKT(gj.coordinates))}`;
    case 'Polygon':
      return `POLYGON ${wrapParens(ringsWKT(gj.coordinates))}`;
    case 'MultiPoint':
      return `MULTIPOINT ${wrapParens(ringWKT(gj.coordinates))}`;
    case 'MultiPolygon':
      return `MULTIPOLYGON ${wrapParens(multiRingsWKT(gj.coordinates))}`;
    case 'MultiLineString':
      return `MULTILINESTRING ${wrapParens(ringsWKT(gj.coordinates))}`;
    case 'GeometryCollection':
      return `GEOMETRYCOLLECTION ${wrapParens(gj.geometries.map(encodeWKT).join(', '))}`;
    default:
      return ((_x: never): never => {
        throw new Error('stringify requires a valid GeoJSON Feature or geometry object as input');
      })(gj);
  }
}
