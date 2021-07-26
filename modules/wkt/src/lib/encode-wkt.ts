// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)
/* eslint-disable prefer-template */

/**
 * Stringifies a GeoJSON object into WKT
 */

/**
 * @param gj
 * @returns string
 */

export default function encodeWKT(gj: {
  type: string;
  properties?: {};
  geometry?: any;
  coordinates?: any;
  geometries?: any;
}) {
  if (gj.type === 'Feature') {
    gj = gj.geometry;
  }

  function pairWKT(c: any[]) {
    return c.join(' ');
  }

  function ringWKT(r: any[]) {
    return r.map(pairWKT).join(', ');
  }

  function ringsWKT(r: any[]) {
    return r.map(ringWKT).map(wrapParens).join(', ');
  }

  function multiRingsWKT(r: any[]) {
    return r.map(ringsWKT).map(wrapParens).join(', ');
  }

  function wrapParens(s: string) {
    return '(' + s + ')';
  }

  switch (gj.type) {
    case 'Point':
      return 'POINT (' + pairWKT(gj.coordinates) + ')';
    case 'LineString':
      return 'LINESTRING (' + ringWKT(gj.coordinates) + ')';
    case 'Polygon':
      return 'POLYGON (' + ringsWKT(gj.coordinates) + ')';
    case 'MultiPoint':
      return 'MULTIPOINT (' + ringWKT(gj.coordinates) + ')';
    case 'MultiPolygon':
      return 'MULTIPOLYGON (' + multiRingsWKT(gj.coordinates) + ')';
    case 'MultiLineString':
      return 'MULTILINESTRING (' + ringsWKT(gj.coordinates) + ')';
    case 'GeometryCollection':
      return 'GEOMETRYCOLLECTION (' + gj.geometries.map(encodeWKT).join(', ') + ')';
    default:
      throw new Error('stringify requires a valid GeoJSON Feature or geometry object as input');
  }
}
