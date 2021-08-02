// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)

/**
 * Stringifies a GeoJSON object into WKT
 * @param geojson
 * @returns string
 */

export default function encodeWKT(gj: {
  type: string;
  properties?: {};
  geometry?: {
    type: string;
    coordinates: any[];
  };
  coordinates?: any[];
  geometries?: {
    type: string;
    coordinates: any[];
  }[];
}): string {
  if (gj.type === 'Feature' && gj.geometry) {
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
      return `POINT (${pairWKT(gj.coordinates as number[])})`;
    case 'LineString':
      return `LINESTRING (${ringWKT(gj.coordinates as number[][])})`;
    case 'Polygon':
      return `POLYGON (${ringsWKT(gj.coordinates as number[][][])})`;
    case 'MultiPoint':
      return `MULTIPOINT (${ringWKT(gj.coordinates as number[][])})`;
    case 'MultiPolygon':
      return `MULTIPOLYGON (${multiRingsWKT(gj.coordinates as number[][][][])})`;
    case 'MultiLineString':
      return `MULTILINESTRING (${ringsWKT(gj.coordinates as number[][][])})`;
    case 'GeometryCollection':
      return `GEOMETRYCOLLECTION (${gj.geometries!.map(encodeWKT).join(', ')})`;
    default:
      throw new Error('stringify requires a valid GeoJSON Feature or geometry object as input');
  }
}
