// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)
/* eslint-disable prefer-template */

/**
 * Stringifies a GeoJSON object into WKT
 */

/**
 * @param geojson
 * @returns string
 */

export default function encodeWKT(gj: {
  type: string;
  properties?: {};
  geometry?: any;
  coordinates?: any[];
  geometries?: any;
}): string {
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
    return '(' + s + ')';
  }

  switch (gj.type) {
    case 'Point':
      return 'POINT (' + pairWKT(gj.coordinates as any[]) + ')';
    case 'LineString':
      return 'LINESTRING (' + ringWKT(gj.coordinates as any[]) + ')';
    case 'Polygon':
      return 'POLYGON (' + ringsWKT(gj.coordinates as any[]) + ')';
    case 'MultiPoint':
      return 'MULTIPOINT (' + ringWKT(gj.coordinates as any[]) + ')';
    case 'MultiPolygon':
      return 'MULTIPOLYGON (' + multiRingsWKT(gj.coordinates as any[]) + ')';
    case 'MultiLineString':
      return 'MULTILINESTRING (' + ringsWKT(gj.coordinates as any[]) + ')';
    case 'GeometryCollection':
      return 'GEOMETRYCOLLECTION (' + gj.geometries.map(encodeWKT).join(', ') + ')';
    default:
      throw new Error('stringify requires a valid GeoJSON Feature or geometry object as input');
  }
}
