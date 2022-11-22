// loaders.gl, MIT license
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import type {GeoJSONTileFeature} from './tile';
import {createFeature} from './feature';

/* eslint-disable no-continue */

/**
 * Clip features between two vertical or horizontal axis-parallel lines:
 *     |        |
 *  ___|___     |     /
 * /   |   \____|____/
 *     |        |
 *
 * @param k1 and k2 are the line coordinates
 * @param axis: 0 for x, 1 for y
 * @param minAll and maxAll: minimum and maximum coordinate value for all features
 */
// eslint-disable-next-line max-params, complexity, max-statements
export function clip(
  features: GeoJSONTileFeature[],
  scale: number,
  k1: number,
  k2: number,
  axis,
  minAll: number,
  maxAll: number,
  options: {lineMetrics: boolean}
): GeoJSONTileFeature[] | null {
  k1 /= scale;
  k2 /= scale;

  if (minAll >= k1 && maxAll < k2) {
    return features;
  }
  // trivial accept
  else if (maxAll < k1 || minAll >= k2) {
    return null; // trivial reject
  }

  const clipped: GeoJSONTileFeature[] = [];

  for (const feature of features) {
    const geometry = feature.geometry;
    let type = feature.type;

    const min = axis === 0 ? feature.minX : feature.minY;
    const max = axis === 0 ? feature.maxX : feature.maxY;

    if (min >= k1 && max < k2) {
      // trivial accept
      clipped.push(feature);
      continue;
    } else if (max < k1 || min >= k2) {
      // trivial reject
      continue;
    }

    let newGeometry: number[][][] | number[][] = [];

    if (type === 'Point' || type === 'MultiPoint') {
      clipPoints(geometry, newGeometry, k1, k2, axis);
    } else if (type === 'LineString') {
      clipLine(geometry, newGeometry, k1, k2, axis, false, options.lineMetrics);
    } else if (type === 'MultiLineString') {
      clipLines(geometry, newGeometry, k1, k2, axis, false);
    } else if (type === 'Polygon') {
      clipLines(geometry, newGeometry, k1, k2, axis, true);
    } else if (type === 'MultiPolygon') {
      for (const polygon of geometry) {
        const newPolygon = [];
        clipLines(polygon, newPolygon, k1, k2, axis, true);
        if (newPolygon.length) {
          newGeometry.push(newPolygon);
        }
      }
    }

    if (newGeometry.length) {
      if (options.lineMetrics && type === 'LineString') {
        for (const line of newGeometry) {
          clipped.push(createFeature(feature.id, type, line, feature.tags));
        }
        continue;
      }

      if (type === 'LineString' || type === 'MultiLineString') {
        if (newGeometry.length === 1) {
          type = 'LineString';
          // @ts-expect-error TODO - use proper GeoJSON geometry types
          newGeometry = newGeometry[0];
        } else {
          type = 'MultiLineString';
        }
      }
      if (type === 'Point' || type === 'MultiPoint') {
        type = newGeometry.length === 3 ? 'Point' : 'MultiPoint';
      }

      clipped.push(createFeature(feature.id, type, newGeometry, feature.tags));
    }
  }

  return clipped.length ? clipped : null;
}

function clipPoints(geom, newGeom, k1: number, k2: number, axis): void {
  for (let i = 0; i < geom.length; i += 3) {
    const a = geom[i + axis];

    if (a >= k1 && a <= k2) {
      addPoint(newGeom, geom[i], geom[i + 1], geom[i + 2]);
    }
  }
}

// eslint-disable-next-line max-params, complexity, max-statements
function clipLine(
  geom,
  newGeom,
  k1: number,
  k2: number,
  axis,
  isPolygon: boolean,
  trackMetrics: boolean
): void {
  let slice = newSlice(geom);
  const intersect = axis === 0 ? intersectX : intersectY;
  let len = geom.start;
  let segLen;
  let t;

  for (let i = 0; i < geom.length - 3; i += 3) {
    const ax = geom[i];
    const ay = geom[i + 1];
    const az = geom[i + 2];
    const bx = geom[i + 3];
    const by = geom[i + 4];
    const a = axis === 0 ? ax : ay;
    const b = axis === 0 ? bx : by;
    let exited = false;

    if (trackMetrics) {
      segLen = Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
    }

    if (a < k1) {
      // ---|-->  | (line enters the clip region from the left)
      if (b > k1) {
        t = intersect(slice, ax, ay, bx, by, k1);
        if (trackMetrics) {
          slice.start = len + segLen * t;
        }
      }
    } else if (a > k2) {
      // |  <--|--- (line enters the clip region from the right)
      if (b < k2) {
        t = intersect(slice, ax, ay, bx, by, k2);
        if (trackMetrics) {
          slice.start = len + segLen * t;
        }
      }
    } else {
      addPoint(slice, ax, ay, az);
    }
    if (b < k1 && a >= k1) {
      // <--|---  | or <--|-----|--- (line exits the clip region on the left)
      t = intersect(slice, ax, ay, bx, by, k1);
      exited = true;
    }
    if (b > k2 && a <= k2) {
      // |  ---|--> or ---|-----|--> (line exits the clip region on the right)
      t = intersect(slice, ax, ay, bx, by, k2);
      exited = true;
    }

    if (!isPolygon && exited) {
      if (trackMetrics) {
        slice.end = len + segLen * t;
      }
      newGeom.push(slice);
      slice = newSlice(geom);
    }

    if (trackMetrics) {
      len += segLen;
    }
  }

  // add the last point
  let last = geom.length - 3;
  const ax = geom[last];
  const ay = geom[last + 1];
  const az = geom[last + 2];
  const a = axis === 0 ? ax : ay;
  if (a >= k1 && a <= k2) addPoint(slice, ax, ay, az);

  // close the polygon if its endpoints are not the same after clipping
  last = slice.length - 3;
  if (isPolygon && last >= 3 && (slice[last] !== slice[0] || slice[last + 1] !== slice[1])) {
    addPoint(slice, slice[0], slice[1], slice[2]);
  }

  // add the final slice
  if (slice.length) {
    newGeom.push(slice);
  }
}

class Slice extends Array<number> {
  size?: number;
  start?: number;
  end?: number;
}

function newSlice(line: {size: number; start: number; end: number}): Slice {
  const slice: Slice = [];
  slice.size = line.size;
  slice.start = line.start;
  slice.end = line.end;
  return slice;
}

// eslint-disable-next-line max-params
function clipLines(geom, newGeom, k1: number, k2: number, axis, isPolygon: boolean): void {
  for (const line of geom) {
    clipLine(line, newGeom, k1, k2, axis, isPolygon, false);
  }
}

function addPoint(out: number[], x: number, y: number, z: number): void {
  out.push(x, y, z);
}

// eslint-disable-next-line max-params
function intersectX(out, ax: number, ay: number, bx: number, by: number, x: number): number {
  const t = (x - ax) / (bx - ax);
  addPoint(out, x, ay + (by - ay) * t, 1);
  return t;
}

// eslint-disable-next-line max-params
function intersectY(out, ax: number, ay: number, bx: number, by: number, y): number {
  const t = (y - ay) / (by - ay);
  addPoint(out, ax + (bx - ax) * t, y, 1);
  return t;
}
