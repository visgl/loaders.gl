// loaders.gl
// SPDX-License-Identifier: MIT and ISC
// Copyright (c) vis.gl contributors

/*
  Adapted from https://github.com/mapbox/earcut to allow passing in
  of outline and hole areas using the `areas` parameter. As the
  areas are calcuted as part of classifying the polygon rings
  we can pass them in again to avoid recomputation

  ISC License

  Copyright (c) 2016, Mapbox

  Permission to use, copy, modify, and/or distribute this software for any purpose
  with or without fee is hereby granted, provided that the above copyright notice
  and this permission notice appear in all copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
  FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
  OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
  TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
  THIS SOFTWARE.

 */

// @ts-nocheck

/* eslint-disable */

import type {WKBHeader} from './helpers/wkb-types';
import {EWKB_FLAG_M, EWKB_FLAG_SRID, EWKB_FLAG_Z, WKBGeometryType} from './helpers/wkb-types';

type WKBPolygonLayout = {
  ringStart: number;
  ringCount: number;
  vertexCount: number;
  dimensions: 2 | 3 | 4;
  littleEndian: boolean;
};

/**
 * Triangulates WKB Polygon or MultiPolygon input directly from WKB coordinate bytes.
 * @param wkb Binary WKB input.
 * @returns Triangle vertex indices into the source WKB vertex stream.
 */
export function triangulateWKB(wkb: ArrayBufferLike | ArrayBufferView): number[] {
  const dataView = getWKBDataView(wkb);
  const wkbHeader = parseWKBHeaderFast(dataView);
  const triangles: number[] = [];
  resetVertexPool();
  resetRingLayoutPool();

  switch (wkbHeader.geometryType) {
    case WKBGeometryType.Polygon: {
      const parsedPolygon = parseWKBPolygonLayout(dataView, wkbHeader.byteOffset, wkbHeader, 0);
      triangulateWKBPolygon(dataView, parsedPolygon.layout, triangles);
      return triangles;
    }
    case WKBGeometryType.MultiPolygon:
      triangulateWKBMultiPolygon(dataView, wkbHeader.byteOffset, wkbHeader.littleEndian, triangles);
      return triangles;
    default:
      throw new Error(`WKB: Expected Polygon or MultiPolygon, found ${wkbHeader.geometryType}`);
  }
}

/**
 * Creates a DataView over WKB bytes without copying typed array inputs.
 * @param wkb Binary WKB input.
 * @returns DataView over the WKB bytes.
 */
function getWKBDataView(wkb: ArrayBufferLike | ArrayBufferView): DataView {
  if (ArrayBuffer.isView(wkb)) {
    return new DataView(wkb.buffer, wkb.byteOffset, wkb.byteLength);
  }
  return new DataView(wkb);
}

/**
 * Triangulates each polygon in a WKB MultiPolygon.
 * @param dataView Binary WKB input view.
 * @param byteOffset Offset to the multipolygon payload.
 * @param littleEndian Whether the multipolygon count is little endian.
 * @param triangles Output triangle index array.
 */
function triangulateWKBMultiPolygon(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean,
  triangles: number[]
): void {
  const polygonCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  let vertexOffset = 0;
  const polygonHeader = {byteOffset} as WKBHeader;
  for (let polygonIndex = 0; polygonIndex < polygonCount; polygonIndex++) {
    parseWKBHeaderFast(dataView, byteOffset, polygonHeader);
    if (polygonHeader.geometryType !== WKBGeometryType.Polygon) {
      throw new Error('WKB: Inner geometries of MultiPolygon must be Polygon geometries.');
    }

    const parsedPolygon = parseWKBPolygonLayout(
      dataView,
      polygonHeader.byteOffset,
      polygonHeader,
      vertexOffset
    );
    triangulateWKBPolygon(dataView, parsedPolygon.layout, triangles);
    vertexOffset += parsedPolygon.layout.vertexCount;
    byteOffset = parsedPolygon.byteOffset;
  }
}

/**
 * Parses a binary WKB header without generic WKT checks or object merging.
 * @param dataView Binary WKB input view.
 * @param byteOffset Header byte offset.
 * @param target Optional reusable header object.
 * @returns Parsed WKB header.
 */
function parseWKBHeaderFast(
  dataView: DataView,
  byteOffset: number = 0,
  target?: WKBHeader
): WKBHeader {
  const wkbHeader = target || ({} as WKBHeader);
  const littleEndian = dataView.getUint8(byteOffset) === 1;
  byteOffset++;

  const geometryCode = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const geometryType = (geometryCode & 0x7) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
  let dimensions: 2 | 3 | 4 = 2;
  let coordinates: 'xy' | 'xyz' | 'xym' | 'xyzm' = 'xy';
  let variant: 'wkb' | 'ewkb' | 'iso-wkb' = 'wkb';

  const isoType = (geometryCode - geometryType) / 1000;
  if (isoType === 1) {
    variant = 'iso-wkb';
    dimensions = 3;
    coordinates = 'xyz';
  } else if (isoType === 2) {
    variant = 'iso-wkb';
    dimensions = 3;
    coordinates = 'xym';
  } else if (isoType === 3) {
    variant = 'iso-wkb';
    dimensions = 4;
    coordinates = 'xyzm';
  } else if (isoType !== 0) {
    const ewkbZ = geometryCode & EWKB_FLAG_Z;
    const ewkbM = geometryCode & EWKB_FLAG_M;
    const ewkbSRID = geometryCode & EWKB_FLAG_SRID;

    if (ewkbZ && ewkbM) {
      variant = 'ewkb';
      dimensions = 4;
      coordinates = 'xyzm';
    } else if (ewkbZ) {
      variant = 'ewkb';
      dimensions = 3;
      coordinates = 'xyz';
    } else if (ewkbM) {
      variant = 'ewkb';
      dimensions = 3;
      coordinates = 'xym';
    }

    if (ewkbSRID) {
      variant = 'ewkb';
      wkbHeader.srid = dataView.getUint32(byteOffset, littleEndian);
      byteOffset += 4;
    } else {
      wkbHeader.srid = undefined;
    }
  } else {
    wkbHeader.srid = undefined;
  }

  wkbHeader.type = 'wkb';
  wkbHeader.variant = variant;
  wkbHeader.geometryType = geometryType;
  wkbHeader.dimensions = dimensions;
  wkbHeader.coordinates = coordinates;
  wkbHeader.littleEndian = littleEndian;
  wkbHeader.byteOffset = byteOffset;

  return wkbHeader;
}

/**
 * Parses one WKB Polygon payload into ring byte ranges.
 * @param dataView Binary WKB input view.
 * @param byteOffset Offset to the polygon payload.
 * @param wkbHeader Parsed polygon header.
 * @param vertexOffset First vertex index of this polygon in the source WKB geometry.
 * @returns Parsed polygon layout and the next unread byte offset.
 */
function parseWKBPolygonLayout(
  dataView: DataView,
  byteOffset: number,
  wkbHeader: WKBHeader,
  vertexOffset: number
): {layout: WKBPolygonLayout; byteOffset: number} {
  const ringCount = dataView.getUint32(byteOffset, wkbHeader.littleEndian);
  byteOffset += 4;

  const ringStart = ringLayoutPoolLength;
  let vertexCount = 0;

  for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
    const pointCount = dataView.getUint32(byteOffset, wkbHeader.littleEndian);
    byteOffset += 4;
    ringPointCounts[ringLayoutPoolLength] = pointCount;
    ringCoordinateByteOffsets[ringLayoutPoolLength] = byteOffset;
    ringVertexOffsets[ringLayoutPoolLength] = vertexOffset + vertexCount;
    ringLayoutPoolLength++;
    byteOffset += pointCount * wkbHeader.dimensions * 8;
    vertexCount += pointCount;
  }

  return {
    layout: {
      ringStart,
      ringCount,
      vertexCount,
      dimensions: wkbHeader.dimensions,
      littleEndian: wkbHeader.littleEndian
    },
    byteOffset
  };
}

/**
 * Computes a triangulation of one WKB polygon layout.
 * @param dataView Binary WKB input view.
 * @param polygon WKB polygon layout.
 * @param triangles Output triangle index array.
 */
function triangulateWKBPolygon(
  dataView: DataView,
  polygon: WKBPolygonLayout,
  triangles: number[]
): void {
  if (polygon.ringCount === 0) {
    return;
  }

  const useXYLittleEndianPath = polygon.dimensions === 2 && polygon.littleEndian;
  let outerNode = useXYLittleEndianPath
    ? linkedListXYLittleEndian(dataView, polygon.ringStart, true)
    : linkedList(dataView, polygon.ringStart, polygon, true);

  if (!outerNode || outerNode.next === outerNode.prev) return;

  let invSize;
  let maxX;
  let maxY;
  let minX;
  let minY;
  let x;
  let y;

  if (polygon.ringCount > 1) {
    outerNode = useXYLittleEndianPath
      ? eliminateHolesXYLittleEndian(dataView, polygon, outerNode)
      : eliminateHoles(dataView, polygon, outerNode);
  }

  // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
  if (polygon.vertexCount > 80) {
    let node = outerNode;
    minX = maxX = node.x;
    minY = maxY = node.y;

    do {
      x = node.x;
      y = node.y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      node = node.next;
    } while (node !== outerNode);

    // minX, minY and invSize are later used to transform coords into integers for z-order calculation
    invSize = Math.max(maxX - minX, maxY - minY);
    invSize = invSize !== 0 ? 32767 / invSize : 0;
  }

  earcutLinked(outerNode, triangles, minX, minY, invSize, 0);
}

// create a circular doubly linked list from polygon points in the specified winding order
function linkedList(
  dataView: DataView,
  ringIndex: number,
  polygon: WKBPolygonLayout,
  clockwise: boolean
): Vertex {
  let i;
  let last;
  let signedArea = 0;
  const stride = polygon.dimensions * 8;
  const littleEndian = polygon.littleEndian;
  const pointCount = ringPointCounts[ringIndex];
  const vertexOffset = ringVertexOffsets[ringIndex];
  let previousByteOffset = ringCoordinateByteOffsets[ringIndex] + (pointCount - 1) * stride;
  let previousX = dataView.getFloat64(previousByteOffset, littleEndian);
  let previousY = dataView.getFloat64(previousByteOffset + 8, littleEndian);

  let byteOffset = ringCoordinateByteOffsets[ringIndex];
  for (i = 0; i < pointCount; i++) {
    const x = dataView.getFloat64(byteOffset, littleEndian);
    const y = dataView.getFloat64(byteOffset + 8, littleEndian);
    signedArea += (x - previousX) * (y + previousY);
    last = insertNode(vertexOffset + i, x, y, last);
    previousX = x;
    previousY = y;
    byteOffset += stride;
  }
  signedArea /= 2;

  // Note that the signed area calculation in math.gl
  // has the opposite sign to that which was originally
  // present in earcut, thus the `< 0` is reversed
  if (last && clockwise !== signedArea < 0) {
    reverseLinkedList(last);
  }

  if (last && equals(last, last.next)) {
    removeNode(last);
    last = last.next;
  }

  return last;
}

// create a circular doubly linked list from little-endian XY WKB points
function linkedListXYLittleEndian(
  dataView: DataView,
  ringIndex: number,
  clockwise: boolean
): Vertex {
  let i;
  let last;
  let signedArea = 0;
  const pointCount = ringPointCounts[ringIndex];
  const vertexOffset = ringVertexOffsets[ringIndex];
  let previousByteOffset = ringCoordinateByteOffsets[ringIndex] + (pointCount - 1) * 16;
  let previousX = dataView.getFloat64(previousByteOffset, true);
  let previousY = dataView.getFloat64(previousByteOffset + 8, true);

  let byteOffset = ringCoordinateByteOffsets[ringIndex];
  for (i = 0; i < pointCount; i++) {
    const x = dataView.getFloat64(byteOffset, true);
    const y = dataView.getFloat64(byteOffset + 8, true);
    signedArea += (x - previousX) * (y + previousY);
    last = insertNode(vertexOffset + i, x, y, last);
    previousX = x;
    previousY = y;
    byteOffset += 16;
  }
  signedArea /= 2;

  // Note that the signed area calculation in math.gl
  // has the opposite sign to that which was originally
  // present in earcut, thus the `< 0` is reversed
  if (last && clockwise !== signedArea < 0) {
    reverseLinkedList(last);
  }

  if (last && equals(last, last.next)) {
    removeNode(last);
    last = last.next;
  }

  return last;
}

/**
 * Reverses a circular doubly linked list in place.
 * @param start Any vertex in the list.
 */
function reverseLinkedList(start: Vertex): void {
  let node = start;
  do {
    const next = node.next;
    node.next = node.prev;
    node.prev = next;
    node = next;
  } while (node !== start);
}

// eliminate colinear or duplicate points
function filterPoints(start, end?) {
  if (!start) return start;
  if (!end) end = start;

  let p = start;
  let again;
  do {
    again = false;

    if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
      removeNode(p);
      p = end = p.prev;
      if (p === p.next) break;
      again = true;
    } else {
      p = p.next;
    }
  } while (again || p !== end);

  return end;
}

// main ear slicing loop which triangulates a polygon (given as a linked list)
function earcutLinked(ear, triangles, minX, minY, invSize, pass?) {
  if (!ear) return;

  // interlink polygon nodes in z-order
  if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

  let stop = ear;
  let prev;
  let next;

  // iterate through ears, slicing them one by one
  while (ear.prev !== ear.next) {
    prev = ear.prev;
    next = ear.next;

    if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
      // cut off the triangle
      triangles.push(prev.i);
      triangles.push(ear.i);
      triangles.push(next.i);

      removeNode(ear);

      // skipping the next vertex leads to less sliver triangles
      ear = next.next;
      stop = next.next;

      continue;
    }

    ear = next;

    // if we looped through the whole remaining polygon and can't find any more ears
    if (ear === stop) {
      // try filtering points and slicing again
      if (!pass) {
        earcutLinked(filterPoints(ear), triangles, minX, minY, invSize, 1);

        // if this didn't work, try curing all small self-intersections locally
      } else if (pass === 1) {
        ear = cureLocalIntersections(filterPoints(ear), triangles);
        earcutLinked(ear, triangles, minX, minY, invSize, 2);

        // as a last resort, try splitting the remaining polygon into two
      } else if (pass === 2) {
        splitEarcut(ear, triangles, minX, minY, invSize);
      }

      break;
    }
  }
}

// check whether a polygon node forms a valid ear with adjacent nodes
function isEar(ear) {
  const a = ear.prev;
  const b = ear;
  const c = ear.next;

  if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

  // now make sure we don't have other points inside the potential ear
  const ax = a.x;
  const bx = b.x;
  const cx = c.x;
  const ay = a.y;
  const by = b.y;
  const cy = c.y;

  // triangle bbox; min & max are calculated like this for speed
  const x0 = ax < bx ? (ax < cx ? ax : cx) : bx < cx ? bx : cx;
  const y0 = ay < by ? (ay < cy ? ay : cy) : by < cy ? by : cy;
  const x1 = ax > bx ? (ax > cx ? ax : cx) : bx > cx ? bx : cx;
  const y1 = ay > by ? (ay > cy ? ay : cy) : by > cy ? by : cy;

  let p = c.next;
  while (p !== a) {
    if (
      p.x >= x0 &&
      p.x <= x1 &&
      p.y >= y0 &&
      p.y <= y1 &&
      pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) &&
      area(p.prev, p, p.next) >= 0
    )
      return false;
    p = p.next;
  }

  return true;
}

function isEarHashed(ear, minX, minY, invSize) {
  const a = ear.prev;
  const b = ear;
  const c = ear.next;

  if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

  const ax = a.x;
  const bx = b.x;
  const cx = c.x;
  const ay = a.y;
  const by = b.y;
  const cy = c.y;

  // triangle bbox; min & max are calculated like this for speed
  const x0 = ax < bx ? (ax < cx ? ax : cx) : bx < cx ? bx : cx;
  const y0 = ay < by ? (ay < cy ? ay : cy) : by < cy ? by : cy;
  const x1 = ax > bx ? (ax > cx ? ax : cx) : bx > cx ? bx : cx;
  const y1 = ay > by ? (ay > cy ? ay : cy) : by > cy ? by : cy;

  // z-order range for the current triangle bbox;
  const minZ = zOrder(x0, y0, minX, minY, invSize);
  const maxZ = zOrder(x1, y1, minX, minY, invSize);

  let p = ear.prevZ;
  let n = ear.nextZ;

  // look for points inside the triangle in both directions
  while (p && p.z >= minZ && n && n.z <= maxZ) {
    if (
      p.x >= x0 &&
      p.x <= x1 &&
      p.y >= y0 &&
      p.y <= y1 &&
      p !== a &&
      p !== c &&
      pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) &&
      area(p.prev, p, p.next) >= 0
    )
      return false;
    p = p.prevZ;

    if (
      n.x >= x0 &&
      n.x <= x1 &&
      n.y >= y0 &&
      n.y <= y1 &&
      n !== a &&
      n !== c &&
      pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) &&
      area(n.prev, n, n.next) >= 0
    )
      return false;
    n = n.nextZ;
  }

  // look for remaining points in decreasing z-order
  while (p && p.z >= minZ) {
    if (
      p.x >= x0 &&
      p.x <= x1 &&
      p.y >= y0 &&
      p.y <= y1 &&
      p !== a &&
      p !== c &&
      pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) &&
      area(p.prev, p, p.next) >= 0
    )
      return false;
    p = p.prevZ;
  }

  // look for remaining points in increasing z-order
  while (n && n.z <= maxZ) {
    if (
      n.x >= x0 &&
      n.x <= x1 &&
      n.y >= y0 &&
      n.y <= y1 &&
      n !== a &&
      n !== c &&
      pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) &&
      area(n.prev, n, n.next) >= 0
    )
      return false;
    n = n.nextZ;
  }

  return true;
}

// go through all polygon nodes and cure small local self-intersections
function cureLocalIntersections(start, triangles) {
  let p = start;
  do {
    const a = p.prev;
    const b = p.next.next;

    if (
      !equals(a, b) &&
      intersects(a, p, p.next, b) &&
      locallyInside(a, b) &&
      locallyInside(b, a)
    ) {
      triangles.push(a.i);
      triangles.push(p.i);
      triangles.push(b.i);

      // remove two nodes involved
      removeNode(p);
      removeNode(p.next);

      p = start = b;
    }
    p = p.next;
  } while (p !== start);

  return filterPoints(p);
}

// try splitting polygon into two and triangulate them independently
function splitEarcut(start, triangles, minX, minY, invSize) {
  // look for a valid diagonal that divides the polygon into two
  let a = start;
  do {
    let b = a.next.next;
    while (b !== a.prev) {
      if (a.i !== b.i && isValidDiagonal(a, b)) {
        // split the polygon in two by the diagonal
        let c = splitPolygon(a, b);

        // filter colinear points around the cuts
        a = filterPoints(a, a.next);
        c = filterPoints(c, c.next);

        // run earcut on each half
        earcutLinked(a, triangles, minX, minY, invSize, 0);
        earcutLinked(c, triangles, minX, minY, invSize, 0);
        return;
      }
      b = b.next;
    }
    a = a.next;
  } while (a !== start);
}

// link every hole into the outer loop, producing a single-ring polygon without holes
function eliminateHoles(dataView: DataView, polygon: WKBPolygonLayout, outerNode: Vertex): Vertex {
  const queue = holeQueue;
  queue.length = 0;
  let i;
  let len;
  let list;

  for (i = 1, len = polygon.ringCount; i < len; i++) {
    list = linkedList(dataView, polygon.ringStart + i, polygon, false);
    if (list === list.next) list.steiner = true;
    queue.push(getLeftmost(list));
  }

  queue.sort(compareX);

  // process holes from left to right
  for (i = 0; i < queue.length; i++) {
    outerNode = eliminateHole(queue[i], outerNode);
  }

  queue.length = 0;
  return outerNode;
}

// link every hole into the outer loop for little-endian XY WKB
function eliminateHolesXYLittleEndian(
  dataView: DataView,
  polygon: WKBPolygonLayout,
  outerNode: Vertex
): Vertex {
  const queue = holeQueue;
  queue.length = 0;
  let i;
  let len;
  let list;

  for (i = 1, len = polygon.ringCount; i < len; i++) {
    list = linkedListXYLittleEndian(dataView, polygon.ringStart + i, false);
    if (list === list.next) list.steiner = true;
    queue.push(getLeftmost(list));
  }

  queue.sort(compareX);

  // process holes from left to right
  for (i = 0; i < queue.length; i++) {
    outerNode = eliminateHole(queue[i], outerNode);
  }

  queue.length = 0;
  return outerNode;
}

function compareX(a, b) {
  return a.x - b.x;
}

// find a bridge between vertices that connects hole with an outer ring and and link it
function eliminateHole(hole, outerNode) {
  const bridge = findHoleBridge(hole, outerNode);
  if (!bridge) {
    return outerNode;
  }

  const bridgeReverse = splitPolygon(bridge, hole);

  // filter collinear points around the cuts
  filterPoints(bridgeReverse, bridgeReverse.next);
  return filterPoints(bridge, bridge.next);
}

// David Eberly's algorithm for finding a bridge between hole and outer polygon
function findHoleBridge(hole, outerNode) {
  let p = outerNode;
  const hx = hole.x;
  const hy = hole.y;
  let qx = -Infinity;
  let m;

  // find a segment intersected by a ray from the hole's leftmost point to the left;
  // segment's endpoint with lesser x will be potential connection point
  do {
    if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
      const x = p.x + ((hy - p.y) * (p.next.x - p.x)) / (p.next.y - p.y);
      if (x <= hx && x > qx) {
        qx = x;
        m = p.x < p.next.x ? p : p.next;
        if (x === hx) return m; // hole touches outer segment; pick leftmost endpoint
      }
    }
    p = p.next;
  } while (p !== outerNode);

  if (!m) return null;

  // look for points inside the triangle of hole point, segment intersection and endpoint;
  // if there are no points found, we have a valid connection;
  // otherwise choose the point of the minimum angle with the ray as connection point

  const stop = m;
  const mx = m.x;
  const my = m.y;
  let tanMin = Infinity;
  let tan;

  p = m;

  do {
    if (
      hx >= p.x &&
      p.x >= mx &&
      hx !== p.x &&
      pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)
    ) {
      tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

      if (
        locallyInside(p, hole) &&
        (tan < tanMin ||
          (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))
      ) {
        m = p;
        tanMin = tan;
      }
    }

    p = p.next;
  } while (p !== stop);

  return m;
}

// whether sector in vertex m contains sector in vertex p in the same coordinates
function sectorContainsSector(m, p) {
  return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
}

// interlink polygon nodes in z-order
function indexCurve(start, minX, minY, invSize) {
  let p = start;
  do {
    if (p.z === 0) p.z = zOrder(p.x, p.y, minX, minY, invSize);
    p.prevZ = p.prev;
    p.nextZ = p.next;
    p = p.next;
  } while (p !== start);

  p.prevZ.nextZ = null;
  p.prevZ = null;

  sortLinked(p);
}

// Simon Tatham's linked list merge sort algorithm
// http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
function sortLinked(list) {
  let e;
  let i;
  let inSize = 1;
  let numMerges;
  let p;
  let pSize;
  let q;
  let qSize;
  let tail;

  do {
    p = list;
    list = null;
    tail = null;
    numMerges = 0;

    while (p) {
      numMerges++;
      q = p;
      pSize = 0;
      for (i = 0; i < inSize; i++) {
        pSize++;
        q = q.nextZ;
        if (!q) break;
      }
      qSize = inSize;

      while (pSize > 0 || (qSize > 0 && q)) {
        if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
          e = p;
          p = p.nextZ;
          pSize--;
        } else {
          e = q;
          q = q.nextZ;
          qSize--;
        }

        if (tail) tail.nextZ = e;
        else list = e;

        e.prevZ = tail;
        tail = e;
      }

      p = q;
    }

    tail.nextZ = null;
    inSize *= 2;
  } while (numMerges > 1);

  return list;
}

// z-order of a point given coords and inverse of the longer side of data bbox
function zOrder(x, y, minX, minY, invSize) {
  // coords are transformed into non-negative 15-bit integer range
  x = ((x - minX) * invSize) | 0;
  y = ((y - minY) * invSize) | 0;

  x = (x | (x << 8)) & 0x00ff00ff;
  x = (x | (x << 4)) & 0x0f0f0f0f;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y = (y | (y << 8)) & 0x00ff00ff;
  y = (y | (y << 4)) & 0x0f0f0f0f;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
}

// find the leftmost node of a polygon ring
function getLeftmost(start) {
  let p = start;
  let leftmost = start;
  do {
    if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p;
    p = p.next;
  } while (p !== start);

  return leftmost;
}

// check if a point lies within a convex triangle
function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
  return (
    (cx - px) * (ay - py) >= (ax - px) * (cy - py) &&
    (ax - px) * (by - py) >= (bx - px) * (ay - py) &&
    (bx - px) * (cy - py) >= (cx - px) * (by - py)
  );
}

// check if a diagonal between two polygon nodes is valid (lies in polygon interior)
function isValidDiagonal(a, b) {
  return (
    a.next.i !== b.i &&
    a.prev.i !== b.i &&
    !intersectsPolygon(a, b) && // dones't intersect other edges
    ((locallyInside(a, b) &&
      locallyInside(b, a) &&
      middleInside(a, b) && // locally visible
      (area(a.prev, a, b.prev) || area(a, b.prev, b))) || // does not create opposite-facing sectors
      (equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0))
  ); // special zero-length case
}

// signed area of a triangle
function area(p, q, r) {
  return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

// check if two points are equal
function equals(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y;
}

// check if two segments intersect
function intersects(p1, q1, p2, q2) {
  const o1 = sign(area(p1, q1, p2));
  const o2 = sign(area(p1, q1, q2));
  const o3 = sign(area(p2, q2, p1));
  const o4 = sign(area(p2, q2, q1));

  if (o1 !== o2 && o3 !== o4) return true; // general case

  if (o1 === 0 && onSegment(p1, p2, q1)) return true; // p1, q1 and p2 are collinear and p2 lies on p1q1
  if (o2 === 0 && onSegment(p1, q2, q1)) return true; // p1, q1 and q2 are collinear and q2 lies on p1q1
  if (o3 === 0 && onSegment(p2, p1, q2)) return true; // p2, q2 and p1 are collinear and p1 lies on p2q2
  if (o4 === 0 && onSegment(p2, q1, q2)) return true; // p2, q2 and q1 are collinear and q1 lies on p2q2

  return false;
}

// for collinear points p, q, r, check if point q lies on segment pr
function onSegment(p, q, r) {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
}

function sign(num) {
  return num > 0 ? 1 : num < 0 ? -1 : 0;
}

// check if a polygon diagonal intersects any polygon segments
function intersectsPolygon(a, b) {
  let p = a;
  do {
    if (
      p.i !== a.i &&
      p.next.i !== a.i &&
      p.i !== b.i &&
      p.next.i !== b.i &&
      intersects(p, p.next, a, b)
    )
      return true;
    p = p.next;
  } while (p !== a);

  return false;
}

// check if a polygon diagonal is locally inside the polygon
function locallyInside(a, b) {
  return area(a.prev, a, a.next) < 0
    ? area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0
    : area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
}

// check if the middle point of a polygon diagonal is inside the polygon
function middleInside(a, b) {
  let p = a;
  let inside = false;
  const px = (a.x + b.x) / 2;
  const py = (a.y + b.y) / 2;
  do {
    if (
      p.y > py !== p.next.y > py &&
      p.next.y !== p.y &&
      px < ((p.next.x - p.x) * (py - p.y)) / (p.next.y - p.y) + p.x
    )
      inside = !inside;
    p = p.next;
  } while (p !== a);

  return inside;
}

// link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
// if one belongs to the outer ring and another to a hole, it merges it into a single ring
function splitPolygon(a, b) {
  const a2 = allocateVertex(a.i, a.x, a.y);
  const b2 = allocateVertex(b.i, b.x, b.y);
  const an = a.next;
  const bp = b.prev;

  a.next = b;
  b.prev = a;

  a2.next = an;
  an.prev = a2;

  b2.next = a2;
  a2.prev = b2;

  bp.next = b2;
  b2.prev = bp;

  return b2;
}

// create a node and optionally link it with previous one (in a circular doubly linked list)
function insertNode(i, x, y, last) {
  const p = allocateVertex(i, x, y);

  if (!last) {
    p.prev = p;
    p.next = p;
  } else {
    p.next = last.next;
    p.prev = last;
    last.next.prev = p;
    last.next = p;
  }
  return p;
}

function removeNode(p) {
  p.next.prev = p.prev;
  p.prev.next = p.next;

  if (p.prevZ) p.prevZ.nextZ = p.nextZ;
  if (p.nextZ) p.nextZ.prevZ = p.prevZ;
}

const ringPointCounts: number[] = [];
const ringCoordinateByteOffsets: number[] = [];
const ringVertexOffsets: number[] = [];
let ringLayoutPoolLength = 0;
const holeQueue: Vertex[] = [];

/**
 * Resets pooled WKB ring layout storage for one triangulation call.
 */
function resetRingLayoutPool(): void {
  ringLayoutPoolLength = 0;
}

const vertexPool: Vertex[] = [];
let vertexPoolIndex = 0;

/**
 * Resets the reusable earcut vertex pool for one WKB triangulation.
 */
function resetVertexPool(): void {
  vertexPoolIndex = 0;
}

/**
 * Allocates or reuses one earcut vertex node.
 * @param i Vertex index in the source WKB vertex stream.
 * @param x X coordinate.
 * @param y Y coordinate.
 * @returns A reset vertex node.
 */
function allocateVertex(i: number, x: number, y: number): Vertex {
  let vertex = vertexPool[vertexPoolIndex];
  if (!vertex) {
    vertex = new Vertex();
    vertexPool[vertexPoolIndex] = vertex;
  }
  vertexPoolIndex++;

  vertex.i = i;
  vertex.x = x;
  vertex.y = y;
  vertex.prev = null;
  vertex.next = null;
  vertex.z = 0;
  vertex.prevZ = null;
  vertex.nextZ = null;
  vertex.steiner = false;

  return vertex;
}

class Vertex {
  // vertex index in coordinates array
  i: number = 0;

  // vertex coordinates
  x: number = 0;
  y: number = 0;

  // previous and next vertex nodes in a polygon ring
  prev: Vertex = null;
  next: Vertex = null;

  // z-order curve value
  z: number = 0;

  // previous and next nodes in z-order
  prevZ: Vertex = null;
  nextZ: Vertex = null;

  // indicates whether this is a steiner point
  steiner: boolean = false;

  constructor() {}
}
