// loaders.gl, MIT license
// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)

import {Geometry} from '@loaders.gl/schema';

/* eslint-disable */
// @ts-nocheck

const numberRegexp = /[-+]?([0-9]*\.[0-9]+|[0-9]+)([eE][-+]?[0-9]+)?/;
// Matches sequences like '100 100' or '100 100 100'.
const tuples = new RegExp('^' + numberRegexp.source + '(\\s' + numberRegexp.source + '){1,}');

/**
 * Parse WKT and return GeoJSON.
 *
 * @param input A WKT geometry string
 * @return A GeoJSON geometry object
 **/
export function parseWKT(input: string): Geometry {
  const parts = input.split(';');
  let _ = parts.pop();
  const srid = (parts.shift() || '').split('=').pop();

  let i = 0;

  function $(re) {
    const match = _?.substring(i).match(re);
    if (!match) return null;
    else {
      i += match[0].length;
      return match[0];
    }
  }

  function crs(obj) {
    if (obj && srid?.match(/\d+/)) {
      obj.crs = {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::' + srid
        }
      };
    }

    return obj;
  }

  function white() {
    $(/^\s*/);
  }

  function multicoords(): number[][] | null {
    white();
    let depth = 0;
    const rings: number[][] = [];
    const stack = [rings];
    let pointer: any = rings;
    let elem;

    while ((elem = $(/^(\()/) || $(/^(\))/) || $(/^(,)/) || $(tuples))) {
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
      white();
    }

    if (depth !== 0) return null;

    return rings;
  }

  function coords(): number[][] | null {
    const list: number[][] = [];
    let item: any;
    let pt;
    while ((pt = $(tuples) || $(/^(,)/))) {
      if (pt === ',') {
        list.push(item);
        item = [];
      } else if (!pt.split(/\s/g).some(isNaN)) {
        if (!item) item = [];
        Array.prototype.push.apply(item, pt.split(/\s/g).map(parseFloat));
      }
      white();
    }

    if (item) list.push(item);
    else return null;

    return list.length ? list : null;
  }

  function point(): Geometry | null {
    if (!$(/^(point(\sz)?)/i)) return null;
    white();
    if (!$(/^(\()/)) return null;
    const c = coords();
    if (!c) return null;
    white();
    if (!$(/^(\))/)) return null;
    return {
      type: 'Point',
      coordinates: c[0]
    };
  }

  function multipoint(): Geometry | null {
    if (!$(/^(multipoint)/i)) return null;
    white();
    const newCoordsFormat = _?.substring(_?.indexOf('(') + 1, _.length - 1)
      .replace(/\(/g, '')
      .replace(/\)/g, '');
    _ = 'MULTIPOINT (' + newCoordsFormat + ')';
    const c = multicoords();
    if (!c) return null;
    white();
    return {
      type: 'MultiPoint',
      coordinates: c
    };
  }

  function multilinestring(): Geometry | null {
    if (!$(/^(multilinestring)/i)) return null;
    white();
    const c = multicoords();
    if (!c) return null;
    white();
    return {
      type: 'MultiLineString',
      // @ts-expect-error
      coordinates: c
    };
  }

  function linestring(): Geometry | null {
    if (!$(/^(linestring(\sz)?)/i)) return null;
    white();
    if (!$(/^(\()/)) return null;
    const c = coords();
    if (!c) return null;
    if (!$(/^(\))/)) return null;
    return {
      type: 'LineString',
      coordinates: c
    };
  }

  function polygon(): Geometry | null {
    if (!$(/^(polygon(\sz)?)/i)) return null;
    white();
    const c = multicoords();
    if (!c) return null;
    return {
      type: 'Polygon',
      // @ts-expect-error
      coordinates: c
    };
  }

  function multipolygon(): Geometry | null {
    if (!$(/^(multipolygon)/i)) return null;
    white();
    const c = multicoords();
    if (!c) return null;
    return {
      type: 'MultiPolygon',
      // @ts-expect-error
      coordinates: c
    };
  }

  function geometrycollection(): Geometry | null {
    const geometries: Geometry[] = [];
    let geometry: Geometry | null;

    if (!$(/^(geometrycollection)/i)) return null;
    white();

    if (!$(/^(\()/)) return null;
    while ((geometry = root())) {
      geometries.push(geometry);
      white();
      $(/^(,)/);
      white();
    }
    if (!$(/^(\))/)) return null;

    return {
      type: 'GeometryCollection',
      geometries: geometries
    };
  }

  function root(): Geometry | null {
    return (
      point() ||
      linestring() ||
      polygon() ||
      multipoint() ||
      multilinestring() ||
      multipolygon() ||
      geometrycollection()
    );
  }

  return crs(root());
}
