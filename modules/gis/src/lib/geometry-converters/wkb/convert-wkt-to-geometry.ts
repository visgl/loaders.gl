// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)

import type {Geometry} from '@loaders.gl/schema';
import type {GeoArrowDimension} from '@loaders.gl/schema';

/* eslint-disable */
// @ts-nocheck

const numberRegexp = /[-+]?([0-9]*\.[0-9]+|[0-9]+)([eE][-+]?[0-9]+)?/;
// Matches sequences like '100 100' or '100 100 100'.
const tuples = new RegExp('^' + numberRegexp.source + '(\\s' + numberRegexp.source + '){1,}');

export type ParseWKTOptions = {
  wkt?: {
    /** Shape selection is handled by the caller; only GeoJSON geometry is currently supported. */
    shape?: 'geojson-geometry';
    /** Whether to add any CRS, if found, as undocumented CRS property on the return geometry */
    crs?: boolean;
  };
};

/** Returns the dimensional token declared by a WKT geometry, or `xy` for plain WKT. */
export function getWKTDimension(input: string): GeoArrowDimension | null {
  const match = input
    .trim()
    .match(
      /^(?:POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION)(?:\s+(ZM|Z|M))?(?:\s|\()/i
    );
  if (!match) return null;
  const dimensionToken = match[1]?.toUpperCase();
  return dimensionToken === 'Z'
    ? 'xyz'
    : dimensionToken === 'M'
      ? 'xym'
      : dimensionToken === 'ZM'
        ? 'xyzm'
        : 'xy';
}

/** State of parser, passed around between parser functions */
type ParseWKTState = {
  parts: string[];
  _: string | undefined;
  i: number;
};

/**
 * Parse WKT and return GeoJSON.
 * @param input A WKT geometry string
 * @return A GeoJSON geometry object
 *
 * @note We only support the "geojson" subset of the OGC simple features standard
 **/
export function convertWKTToGeometry(input: string, options?: ParseWKTOptions): Geometry | null {
  const parts = input.split(';');
  let _ = parts.pop();
  const srid = (parts.shift() || '').split('=').pop();

  const state: ParseWKTState = {parts, _, i: 0};

  const geometry = parseGeometry(state);
  white(state);
  if (!geometry || state.i !== state._?.length) {
    return null;
  }

  return options?.wkt?.crs ? addCRS(geometry, srid) : geometry;
}

function parseGeometry(state: ParseWKTState): Geometry | null {
  const startIndex = state.i;
  const geometry =
    parsePoint(state) ||
    parseLineString(state) ||
    parsePolygon(state) ||
    parseMultiPoint(state) ||
    parseMultiLineString(state) ||
    parseMultiPolygon(state) ||
    parseGeometryCollection(state);
  if (geometry) {
    const geometryText = state._?.substring(startIndex, state.i) || '';
    const dimension = getWKTDimension(geometryText);
    const hasExplicitDimension = /\s+(?:ZM|Z|M)\s*(?:\(|EMPTY\b)/i.test(geometryText);
    if (!hasValidCoordinateArity(geometry, hasExplicitDimension ? dimension : null)) {
      return null;
    }
    if (hasExplicitDimension && dimension && dimension !== 'xy') {
      Object.defineProperty(geometry, '__geoarrowDimension', {
        configurable: true,
        enumerable: false,
        value: dimension
      });
    }
  }
  return geometry;
}

/** Checks that every coordinate tuple matches the dimensional token on one WKT geometry. */
function hasValidCoordinateArity(geometry: Geometry, dimension: GeoArrowDimension | null): boolean {
  const coordinateSize =
    dimension === null ? null : dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
  let inferredCoordinateSize: number | null = null;
  const isValidCoordinate = (coordinate: number[]): boolean => {
    if (coordinate.length === 0) return true;
    if (coordinateSize !== null) return coordinate.length === coordinateSize;
    if (coordinate.length < 2 || coordinate.length > 4) return false;
    if (inferredCoordinateSize === null) inferredCoordinateSize = coordinate.length;
    return coordinate.length === inferredCoordinateSize;
  };
  switch (geometry.type) {
    case 'Point':
      return isValidCoordinate(geometry.coordinates);
    case 'LineString':
      return geometry.coordinates.every(isValidCoordinate);
    case 'Polygon':
      return geometry.coordinates.every(ring => ring.every(isValidCoordinate));
    case 'MultiPoint':
      return geometry.coordinates.every(isValidCoordinate);
    case 'MultiLineString':
      return geometry.coordinates.every(line => line.every(isValidCoordinate));
    case 'MultiPolygon':
      return geometry.coordinates.every(polygon =>
        polygon.every(ring => ring.every(isValidCoordinate))
      );
    case 'GeometryCollection':
      return true;
    default:
      return false;
  }
}

/** Adds a coordinate reference system as an undocumented  */
function addCRS(obj: Geometry | null, srid?: string): Geometry | null {
  if (obj && srid?.match(/\d+/)) {
    const crs = {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::' + srid
      }
    };
    // @ts-expect-error we assign an undocumented property on the geometry
    obj.crs = crs;
  }

  return obj;
}

// GEOMETRIES

function parsePoint(state: ParseWKTState): Geometry | null {
  if (!$(/^(POINT(?:\s+(?:ZM|Z|M))?)/i, state)) {
    return null;
  }
  white(state);
  if ($(/^(EMPTY)\b/i, state)) {
    return {type: 'Point', coordinates: []};
  }
  if (!$(/^(\()/, state)) {
    return null;
  }
  const c = coords(state);
  if (!c) {
    return null;
  }
  white(state);
  if (!$(/^(\))/, state)) {
    return null;
  }
  return {
    type: 'Point',
    coordinates: c[0]
  };
}

function parseMultiPoint(state: ParseWKTState): Geometry | null {
  if (!$(/^(MULTIPOINT(?:\s+(?:ZM|Z|M))?)/i, state)) {
    return null;
  }
  white(state);
  if ($(/^(EMPTY)\b/i, state)) {
    return {type: 'MultiPoint', coordinates: []};
  }
  if (!$(/^(\()/, state)) {
    return null;
  }

  const coordinates: number[][] = [];
  white(state);
  const isParenthesized = state._?.substring(state.i).startsWith('(');
  if (isParenthesized) {
    while (true) {
      if (!$(/^(\()/, state)) return null;
      const coordinate = coords(state);
      if (!coordinate || coordinate.length !== 1 || !$(/^(\))/, state)) return null;
      coordinates.push(coordinate[0]);
      white(state);
      if (!$(/^(,)/, state)) break;
      white(state);
    }
  } else {
    const coordinateList = coords(state);
    if (!coordinateList) return null;
    coordinates.push(...coordinateList);
  }

  white(state);
  if (!$(/^(\))/, state)) return null;
  return {
    type: 'MultiPoint',
    coordinates
  };
}

function parseLineString(state: ParseWKTState): Geometry | null {
  if (!$(/^(LINESTRING(?:\s+(?:ZM|Z|M))?)/i, state)) {
    return null;
  }
  white(state);
  if ($(/^(EMPTY)\b/i, state)) {
    return {type: 'LineString', coordinates: []};
  }
  if (!$(/^(\()/, state)) {
    return null;
  }
  const c = coords(state);
  if (!c) {
    return null;
  }
  if (!$(/^(\))/, state)) {
    return null;
  }
  return {
    type: 'LineString',
    coordinates: c
  };
}

function parseMultiLineString(state: ParseWKTState): Geometry | null {
  if (!$(/^(MULTILINESTRING(?:\s+(?:ZM|Z|M))?)/i, state)) return null;
  white(state);
  if ($(/^(EMPTY)\b/i, state)) {
    return {type: 'MultiLineString', coordinates: []};
  }
  const c = multicoords(state);
  if (!c) {
    return null;
  }
  white(state);
  return {
    // @ts-ignore
    type: 'MultiLineString',
    // @ts-expect-error
    coordinates: c
  };
}

function parsePolygon(state: ParseWKTState): Geometry | null {
  if (!$(/^(POLYGON(?:\s+(?:ZM|Z|M))?)/i, state)) {
    return null;
  }
  white(state);
  if ($(/^(EMPTY)\b/i, state)) {
    return {type: 'Polygon', coordinates: []};
  }
  const c = multicoords(state);
  if (!c) {
    return null;
  }
  return {
    // @ts-ignore
    type: 'Polygon',
    // @ts-expect-error
    coordinates: c
  };
}

function parseMultiPolygon(state: ParseWKTState): Geometry | null {
  if (!$(/^(MULTIPOLYGON(?:\s+(?:ZM|Z|M))?)/i, state)) {
    return null;
  }
  white(state);
  if ($(/^(EMPTY)\b/i, state)) {
    return {type: 'MultiPolygon', coordinates: []};
  }
  const c = multicoords(state);
  if (!c) {
    return null;
  }
  return {
    type: 'MultiPolygon',
    // @ts-expect-error
    coordinates: c
  };
}

function parseGeometryCollection(state: ParseWKTState): Geometry | null {
  const geometries: Geometry[] = [];
  let geometry: Geometry | null;

  if (!$(/^(GEOMETRYCOLLECTION(?:\s+(?:ZM|Z|M))?)/i, state)) {
    return null;
  }
  white(state);

  if ($(/^(EMPTY)\b/i, state)) {
    return {type: 'GeometryCollection', geometries: []};
  }

  if (!$(/^(\()/, state)) {
    return null;
  }
  geometry = parseGeometry(state);
  while (geometry) {
    geometries.push(geometry);
    white(state);
    $(/^(,)/, state);
    white(state);
    geometry = parseGeometry(state);
  }
  if (!$(/^(\))/, state)) {
    return null;
  }

  return {
    type: 'GeometryCollection',
    geometries: geometries
  };
}

// COORDINATES

function multicoords(state: ParseWKTState): number[][] | null {
  white(state);
  let depth = 0;
  const rings: number[][] = [];
  const stack = [rings];
  let pointer: any = rings;
  let elem;

  elem = $(/^(\()/, state) || $(/^(\))/, state) || $(/^(,)/, state) || $(tuples, state);
  while (elem) {
    if (elem === '(') {
      stack.push(pointer);
      pointer = [];
      stack[stack.length - 1].push(pointer);
      depth++;
    } else if (elem === ')') {
      // For the case: Polygon(), ...
      if (pointer.length === 0) return null;

      // @ts-ignore
      pointer = stack.pop();
      // the stack was empty, input was malformed
      if (!pointer) return null;
      depth--;
      if (depth === 0) break;
    } else if (elem === ',') {
      pointer = [];
      stack[stack.length - 1].push(pointer);
    } else if (!elem.split(/\s/g).some(Number.isNaN)) {
      Array.prototype.push.apply(pointer, elem.split(/\s/g).map(parseFloat));
    } else {
      return null;
    }
    white(state);
    elem = $(/^(\()/, state) || $(/^(\))/, state) || $(/^(,)/, state) || $(tuples, state);
  }

  if (depth !== 0) return null;

  return rings;
}

function coords(state: ParseWKTState): number[][] | null {
  const list: number[][] = [];
  let item: any;
  let pt;
  pt = $(tuples, state) || $(/^(,)/, state);
  while (pt) {
    if (pt === ',') {
      list.push(item);
      item = [];
    } else if (!pt.split(/\s/g).some(Number.isNaN)) {
      if (!item) item = [];
      Array.prototype.push.apply(item, pt.split(/\s/g).map(parseFloat));
    }
    white(state);
    pt = $(tuples, state) || $(/^(,)/, state);
  }

  if (item) list.push(item);
  else return null;

  return list.length ? list : null;
}

// HELPERS

function $(regexp: RegExp, state: ParseWKTState) {
  const match = state._?.substring(state.i).match(regexp);
  if (!match) return null;
  else {
    state.i += match[0].length;
    return match[0];
  }
}

function white(state: ParseWKTState) {
  $(/^\s*/, state);
}
