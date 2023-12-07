// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)

import {Geometry} from '@loaders.gl/schema';

/* eslint-disable */
// @ts-nocheck

const numberRegexp = /[-+]?([0-9]*\.[0-9]+|[0-9]+)([eE][-+]?[0-9]+)?/;
// Matches sequences like '100 100' or '100 100 100'.
const tuples = new RegExp('^' + numberRegexp.source + '(\\s' + numberRegexp.source + '){1,}');

export const WKT_MAGIC_STRINGS = [
  'POINT(',
  'LINESTRING(',
  'POLYGON(',
  'MULTIPOINT(',
  'MULTILINESTRING(',
  'MULTIPOLYGON(',
  'GEOMETRYCOLLECTION('
  // We only support this "geojson" subset of the OGC simple features standard
];

export type ParseWKTOptions = {
  wkt?: {
    /** Whether to add any CRS, if found, as undocumented CRS property on the return geometry */
    crs?: boolean;
  };
};

/** 
 * Check if a string is WKT.
 * @param input A potential WKT geometry string
 * @return `true` if input appears to be a WKT geometry string, `false` otherwise

 * @note We only support the "geojson" subset of the OGC simple features standard
 * @todo Does not handle leading spaces which appear to be permitted per the spec:
 * "A WKT string contains no white space outside of double quotes. 
 * However padding with white space to improve human readability is permitted; 
 * the examples of WKT that are included in this document have 
 * spaces and line feeds inserted to improve clarity. Any padding is stripped out or ignored by parsers."
 */
export function isWKT(input: string): boolean {
  return WKT_MAGIC_STRINGS.some((magicString) => input.startsWith(magicString));
}

/**
 * Parse WKT and return GeoJSON.
 * @param input A WKT geometry string
 * @return A GeoJSON geometry object
 *
 * @note We only support the "geojson" subset of the OGC simple features standard
 **/
export function parseWKT(input: string, options?: ParseWKTOptions): Geometry {
  // TODO handle options.wkt.shape
  return parseWKTToGeometry(input, options)!;
}

/** State of parser, passed around between parser functions */
type ParseWKTState = {
  parts: string[];
  _: string | undefined;
  i: number;
};

/** Parse into GeoJSON geometry */
function parseWKTToGeometry(input: string, options?: ParseWKTOptions): Geometry | null {
  const parts = input.split(';');
  let _ = parts.pop();
  const srid = (parts.shift() || '').split('=').pop();

  const state: ParseWKTState = {parts, _, i: 0};

  const geometry = parseGeometry(state);

  return options?.wkt?.crs ? addCRS(geometry, srid) : geometry;
}

function parseGeometry(state: ParseWKTState): Geometry | null {
  return (
    parsePoint(state) ||
    parseLineString(state) ||
    parsePolygon(state) ||
    parseMultiPoint(state) ||
    parseMultiLineString(state) ||
    parseMultiPolygon(state) ||
    parseGeometryCollection(state)
  );
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
  if (!$(/^(POINT(\sz)?)/i, state)) {
    return null;
  }
  white(state);
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
  if (!$(/^(MULTIPOINT)/i, state)) {
    return null;
  }
  white(state);
  const newCoordsFormat = state._?.substring(state._?.indexOf('(') + 1, state._.length - 1)
    .replace(/\(/g, '')
    .replace(/\)/g, '');
  state._ = 'MULTIPOINT (' + newCoordsFormat + ')';
  const c = multicoords(state);
  if (!c) {
    return null;
  }
  white(state);
  return {
    type: 'MultiPoint',
    coordinates: c
  };
}

function parseLineString(state: ParseWKTState): Geometry | null {
  if (!$(/^(LINESTRING(\sz)?)/i, state)) {
    return null;
  }
  white(state);
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
  if (!$(/^(MULTILINESTRING)/i, state)) return null;
  white(state);
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
  if (!$(/^(POLYGON(\sz)?)/i, state)) {
    return null;
  }
  white(state);
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
  if (!$(/^(MULTIPOLYGON)/i, state)) {
    return null;
  }
  white(state);
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

  if (!$(/^(GEOMETRYCOLLECTION)/i, state)) {
    return null;
  }
  white(state);

  if (!$(/^(\()/, state)) {
    return null;
  }
  while ((geometry = parseGeometry(state))) {
    geometries.push(geometry);
    white(state);
    $(/^(,)/, state);
    white(state);
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

  while ((elem = $(/^(\()/, state) || $(/^(\))/, state) || $(/^(,)/, state) || $(tuples, state))) {
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
    } else if (!elem.split(/\s/g).some(isNaN)) {
      Array.prototype.push.apply(pointer, elem.split(/\s/g).map(parseFloat));
    } else {
      return null;
    }
    white(state);
  }

  if (depth !== 0) return null;

  return rings;
}

function coords(state: ParseWKTState): number[][] | null {
  const list: number[][] = [];
  let item: any;
  let pt;
  while ((pt = $(tuples, state) || $(/^(,)/, state))) {
    if (pt === ',') {
      list.push(item);
      item = [];
    } else if (!pt.split(/\s/g).some(isNaN)) {
      if (!item) item = [];
      Array.prototype.push.apply(item, pt.split(/\s/g).map(parseFloat));
    }
    white(state);
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
