// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry} from '@loaders.gl/schema';
import type {GeoArrowBounds} from '../geoarrow-bounds';

/** Tests planar XY intersection with a coordinate, including polygon ring boundaries. */
export function intersectsCoordinate(geometry: Geometry, coordinate: readonly number[]): boolean {
  switch (geometry.type) {
    case 'Point':
      return equalCoordinates(geometry.coordinates, coordinate);
    case 'MultiPoint':
      return geometry.coordinates.some(position => equalCoordinates(position, coordinate));
    case 'LineString':
      return intersectsLine(geometry.coordinates, coordinate);
    case 'MultiLineString':
      return geometry.coordinates.some(line => intersectsLine(line, coordinate));
    case 'Polygon':
      return intersectsPolygon(geometry.coordinates, coordinate);
    case 'MultiPolygon':
      return geometry.coordinates.some(polygon => intersectsPolygon(polygon, coordinate));
    case 'GeometryCollection':
      return geometry.geometries.some(child => intersectsCoordinate(child, coordinate));
    default:
      return false;
  }
}

/** Tests actual geometry intersection with a closed XY rectangle, including degenerate extents. */
export function intersectsExtent(geometry: Geometry, extent: GeoArrowBounds): boolean {
  const corners = [
    [extent[0], extent[1]],
    [extent[2], extent[1]],
    [extent[2], extent[3]],
    [extent[0], extent[3]]
  ];
  /** Tests a point against the closed rectangle. */
  const containsPosition = (position: readonly number[]): boolean =>
    position[0] >= extent[0] &&
    position[0] <= extent[2] &&
    position[1] >= extent[1] &&
    position[1] <= extent[3];
  /** Tests line segments against the rectangle, closing polygon rings when requested. */
  const intersectsPositions = (positions: number[][], closed = false): boolean => {
    if (positions.some(containsPosition)) return true;
    const segmentCount = closed ? positions.length : positions.length - 1;
    for (let index = 0; index < segmentCount; index++) {
      const start = positions[index];
      const end = positions[(index + 1) % positions.length];
      for (let edge = 0; edge < 4; edge++) {
        if (intersectsSegments(start, end, corners[edge], corners[(edge + 1) % 4])) return true;
      }
    }
    return false;
  };
  /** Detects boundary crossings and rectangles wholly within a filled polygon. */
  const intersectsRings = (rings: number[][][]): boolean =>
    rings.some(ring => intersectsPositions(ring, true)) ||
    corners.some(coordinate => intersectsPolygon(rings, coordinate));
  switch (geometry.type) {
    case 'Point':
      return containsPosition(geometry.coordinates);
    case 'MultiPoint':
      return geometry.coordinates.some(containsPosition);
    case 'LineString':
      return intersectsPositions(geometry.coordinates);
    case 'MultiLineString':
      return geometry.coordinates.some(line => intersectsPositions(line));
    case 'Polygon':
      return intersectsRings(geometry.coordinates);
    case 'MultiPolygon':
      return geometry.coordinates.some(intersectsRings);
    case 'GeometryCollection':
      return geometry.geometries.some(child => intersectsExtent(child, extent));
    default:
      return false;
  }
}

/** Compares XY coordinates, ignoring additional dimensions. Empty positions never match. */
function equalCoordinates(first: readonly number[], second: readonly number[]): boolean {
  return first.length >= 2 && first[0] === second[0] && first[1] === second[1];
}

/** Computes the signed cross product for a segment and a point. */
function getOrientation(
  start: readonly number[],
  end: readonly number[],
  coordinate: readonly number[]
): number {
  return (
    (end[0] - start[0]) * (coordinate[1] - start[1]) -
    (end[1] - start[1]) * (coordinate[0] - start[0])
  );
}

/** Includes endpoints and zero-length segments without introducing a snapping tolerance. */
function isCoordinateOnSegment(
  coordinate: readonly number[],
  start: readonly number[],
  end: readonly number[]
): boolean {
  return (
    getOrientation(start, end, coordinate) === 0 &&
    coordinate[0] >= Math.min(start[0], end[0]) &&
    coordinate[0] <= Math.max(start[0], end[0]) &&
    coordinate[1] >= Math.min(start[1], end[1]) &&
    coordinate[1] <= Math.max(start[1], end[1])
  );
}

/** Tests closed segment intersection, including collinear overlap. */
function intersectsSegments(
  firstStart: readonly number[],
  firstEnd: readonly number[],
  secondStart: readonly number[],
  secondEnd: readonly number[]
): boolean {
  const firstStartSide = getOrientation(secondStart, secondEnd, firstStart);
  const firstEndSide = getOrientation(secondStart, secondEnd, firstEnd);
  const secondStartSide = getOrientation(firstStart, firstEnd, secondStart);
  const secondEndSide = getOrientation(firstStart, firstEnd, secondEnd);
  return (
    (Math.sign(firstStartSide) * Math.sign(firstEndSide) < 0 &&
      Math.sign(secondStartSide) * Math.sign(secondEndSide) < 0) ||
    isCoordinateOnSegment(firstStart, secondStart, secondEnd) ||
    isCoordinateOnSegment(firstEnd, secondStart, secondEnd) ||
    isCoordinateOnSegment(secondStart, firstStart, firstEnd) ||
    isCoordinateOnSegment(secondEnd, firstStart, firstEnd)
  );
}

/** Tests an open line, including a single-position degenerate line. */
function intersectsLine(positions: number[][], coordinate: readonly number[]): boolean {
  if (positions.length === 1) return equalCoordinates(positions[0], coordinate);
  return positions.some(
    (end, index) => index > 0 && isCoordinateOnSegment(coordinate, positions[index - 1], end)
  );
}

/** Returns boundary, inside or outside for a ring using an even/odd crossing test. */
function classifyRing(
  ring: number[][],
  coordinate: readonly number[]
): 'boundary' | 'inside' | 'outside' {
  let inside = false;
  for (let index = 0; index < ring.length; index++) {
    const start = ring[index];
    const end = ring[(index + 1) % ring.length];
    if (isCoordinateOnSegment(coordinate, start, end)) return 'boundary';
    if (
      start[1] > coordinate[1] !== end[1] > coordinate[1] &&
      coordinate[0] <
        start[0] + ((coordinate[1] - start[1]) * (end[0] - start[0])) / (end[1] - start[1])
    )
      inside = !inside;
  }
  return inside ? 'inside' : 'outside';
}

/** Includes outer and hole boundaries, and excludes hole interiors. */
function intersectsPolygon(rings: number[][][], coordinate: readonly number[]): boolean {
  if (!rings.length) return false;
  const exterior = classifyRing(rings[0], coordinate);
  if (exterior === 'boundary') return true;
  if (exterior === 'outside') return false;
  const holes = rings.slice(1).map(ring => classifyRing(ring, coordinate));
  return holes.includes('boundary') || !holes.includes('inside');
}
