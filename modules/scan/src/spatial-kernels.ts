// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry, Position} from '@loaders.gl/schema';
import type {GeoArrowNativeGeometry} from '@loaders.gl/geoarrow';
import type {SpatialPredicate} from './spatial-query';

type Coordinate = readonly [number, number];
type Segment = readonly [Coordinate, Coordinate];

type GeometryParts = {
  points: Coordinate[];
  segments: Segment[];
  polygons: Coordinate[][][];
};

/** Evaluates a spatial predicate for two decoded geometries. */
export function evaluateSpatialPredicate(
  leftGeometry: Geometry,
  predicate: SpatialPredicate,
  rightGeometry: Geometry
): boolean {
  switch (predicate) {
    case 'contains':
      return containsGeometry(leftGeometry, rightGeometry, false);
    case 'covered-by':
      return containsGeometry(rightGeometry, leftGeometry, true);
    case 'covers':
      return containsGeometry(leftGeometry, rightGeometry, true);
    case 'crosses':
      return crossesGeometry(leftGeometry, rightGeometry);
    case 'disjoint':
      return !intersectsGeometry(leftGeometry, rightGeometry);
    case 'equals':
      return geometriesEqual(leftGeometry, rightGeometry);
    case 'intersects':
      return intersectsGeometry(leftGeometry, rightGeometry);
    case 'overlaps':
      return (
        intersectsGeometry(leftGeometry, rightGeometry) &&
        !containsGeometry(leftGeometry, rightGeometry, true) &&
        !containsGeometry(rightGeometry, leftGeometry, true)
      );
    case 'touches':
      return touchesGeometry(leftGeometry, rightGeometry);
    case 'within':
      return containsGeometry(rightGeometry, leftGeometry, false);
    case 'bbox-intersects':
      return intersectsGeometry(leftGeometry, rightGeometry);
    default:
      throw new Error(`Unsupported spatial predicate ${predicate}`);
  }
}

/** Measures one geometry using planar XY coordinates. */
export function measureSpatialGeometry(geometry: Geometry, measurement: 'area' | 'length'): number {
  if (isNativeGeometry(geometry)) return measureNativeSpatialGeometry(geometry, measurement);
  if (measurement === 'area') return getGeometryArea(geometry);
  return getGeometryLength(geometry);
}

/** Measures a native GeoArrow geometry without converting it to GeoJSON. */
export function measureNativeSpatialGeometry(
  geometry: GeoArrowNativeGeometry,
  measurement: 'area' | 'length'
): number {
  const parts = collectNativeGeometryParts(geometry);
  if (measurement === 'length') {
    return parts.segments.reduce(
      (length, segment) => length + distanceBetweenPoints(segment[0], segment[1]),
      0
    );
  }
  return parts.polygons.reduce((area, polygon) => area + getCoordinatePolygonArea(polygon), 0);
}

/** Returns the minimum planar XY distance between two geometries. */
export function getSpatialGeometryDistance(
  leftGeometry: Geometry | GeoArrowNativeGeometry,
  rightGeometry: Geometry | GeoArrowNativeGeometry
): number {
  const leftParts = collectSpatialGeometryParts(leftGeometry);
  const rightParts = collectSpatialGeometryParts(rightGeometry);
  if (intersectsGeometryParts(leftParts, rightParts)) return 0;
  let minimumDistance = Number.POSITIVE_INFINITY;
  for (const leftPoint of leftParts.points) {
    for (const rightPoint of rightParts.points) {
      minimumDistance = Math.min(minimumDistance, distanceBetweenPoints(leftPoint, rightPoint));
    }
    for (const rightSegment of rightParts.segments) {
      minimumDistance = Math.min(minimumDistance, distanceToSegment(leftPoint, rightSegment));
    }
  }
  for (const rightPoint of rightParts.points) {
    for (const leftSegment of leftParts.segments) {
      minimumDistance = Math.min(minimumDistance, distanceToSegment(rightPoint, leftSegment));
    }
  }
  return minimumDistance;
}

/**
 * Evaluates common exact residual predicates directly from native GeoArrow coordinates.
 *
 * `null` means that the predicate is outside this fast kernel and the caller should use its
 * general geometry implementation. A boolean result is produced without creating GeoJSON.
 */
export function evaluateNativeSpatialPredicate(
  leftGeometry: GeoArrowNativeGeometry,
  predicate: SpatialPredicate,
  rightGeometry: GeoArrowNativeGeometry | Geometry
): boolean | null {
  if (predicate !== 'intersects' && predicate !== 'disjoint' && predicate !== 'bbox-intersects') {
    return null;
  }
  const intersects = intersectsGeometryParts(
    collectNativeGeometryParts(leftGeometry),
    isNativeGeometry(rightGeometry)
      ? collectNativeGeometryParts(rightGeometry)
      : collectGeometryParts(rightGeometry)
  );
  return predicate === 'disjoint' ? !intersects : intersects;
}

/** Converts a query extent to a closed polygon for exact predicate evaluation. */
export function makeSpatialBoundingBoxGeometry(
  boundingBox: readonly [number, number, number, number]
): Geometry {
  const [minimumX, minimumY, maximumX, maximumY] = boundingBox;
  return {
    type: 'Polygon',
    coordinates: [
      [
        [minimumX, minimumY],
        [maximumX, minimumY],
        [maximumX, maximumY],
        [minimumX, maximumY],
        [minimumX, minimumY]
      ]
    ]
  };
}

/** Tests geometry intersection using points, segments, polygon interiors, and collections. */
function intersectsGeometry(leftGeometry: Geometry, rightGeometry: Geometry): boolean {
  return intersectsGeometryParts(
    collectGeometryParts(leftGeometry),
    collectGeometryParts(rightGeometry)
  );
}

/** Collects primitive parts from either a native or format-neutral geometry value. */
function collectSpatialGeometryParts(geometry: Geometry | GeoArrowNativeGeometry): GeometryParts {
  return isNativeGeometry(geometry)
    ? collectNativeGeometryParts(geometry)
    : collectGeometryParts(geometry);
}

/** Tests two already-collected geometry part sets. */
function intersectsGeometryParts(leftParts: GeometryParts, rightParts: GeometryParts): boolean {
  if (
    leftParts.points.some(leftPoint =>
      rightParts.points.some(rightPoint => pointsEqual(leftPoint, rightPoint))
    )
  ) {
    return true;
  }
  if (
    leftParts.segments.some(leftSegment =>
      rightParts.segments.some(rightSegment => segmentsIntersect(leftSegment, rightSegment))
    )
  ) {
    return true;
  }
  if (
    leftParts.points.some(leftPoint =>
      rightParts.segments.some(rightSegment => pointOnSegment(leftPoint, rightSegment))
    )
  ) {
    return true;
  }
  if (
    rightParts.points.some(rightPoint =>
      leftParts.segments.some(leftSegment => pointOnSegment(rightPoint, leftSegment))
    )
  ) {
    return true;
  }
  if (leftParts.points.some(point => pointInPolygons(point, rightParts.polygons, true)))
    return true;
  return rightParts.points.some(point => pointInPolygons(point, leftParts.polygons, true));
}

/** Tests containment, optionally allowing points on the container boundary. */
function containsGeometry(
  containerGeometry: Geometry,
  childGeometry: Geometry,
  allowBoundary: boolean
): boolean {
  if (geometriesEqual(containerGeometry, childGeometry)) return true;
  const containerParts = collectGeometryParts(containerGeometry);
  const childParts = collectGeometryParts(childGeometry);
  if (childParts.points.length === 0) return false;

  if (containerParts.polygons.length > 0) {
    const pointsContained = childParts.points.every(point =>
      pointInPolygons(point, containerParts.polygons, allowBoundary)
    );
    if (!pointsContained) return false;
    return childParts.segments.every(segment => {
      const midpoint: Coordinate = [
        (segment[0][0] + segment[1][0]) / 2,
        (segment[0][1] + segment[1][1]) / 2
      ];
      return pointInPolygons(midpoint, containerParts.polygons, allowBoundary);
    });
  }

  if (containerParts.segments.length > 0) {
    return childParts.points.every(point =>
      containerParts.segments.some(segment => pointOnSegment(point, segment))
    );
  }

  return (
    containerParts.points.length === 1 &&
    childParts.points.every(point => pointsEqual(containerParts.points[0], point))
  );
}

/** Detects a proper crossing between line-like geometries or a line and an area. */
function crossesGeometry(leftGeometry: Geometry, rightGeometry: Geometry): boolean {
  const leftParts = collectGeometryParts(leftGeometry);
  const rightParts = collectGeometryParts(rightGeometry);
  if (leftParts.segments.length === 0 || rightParts.segments.length === 0) return false;
  return leftParts.segments.some(leftSegment =>
    rightParts.segments.some(rightSegment => properSegmentsIntersect(leftSegment, rightSegment))
  );
}

/** Detects boundary-only contact for the common line and polygon cases. */
function touchesGeometry(leftGeometry: Geometry, rightGeometry: Geometry): boolean {
  if (!intersectsGeometry(leftGeometry, rightGeometry)) return false;
  if (containsGeometry(leftGeometry, rightGeometry, false)) return false;
  if (containsGeometry(rightGeometry, leftGeometry, false)) return false;
  const leftParts = collectGeometryParts(leftGeometry);
  const rightParts = collectGeometryParts(rightGeometry);
  return leftParts.segments.some(leftSegment =>
    rightParts.segments.some(
      rightSegment =>
        segmentsIntersect(leftSegment, rightSegment) &&
        !properSegmentsIntersect(leftSegment, rightSegment)
    )
  );
}

/** Compares GeoJSON geometry structure and coordinate values. */
function geometriesEqual(leftGeometry: Geometry, rightGeometry: Geometry): boolean {
  return JSON.stringify(leftGeometry) === JSON.stringify(rightGeometry);
}

/** Collects all primitive parts from a geometry and recursively from collections. */
function collectGeometryParts(geometry: Geometry): GeometryParts {
  const parts: GeometryParts = {points: [], segments: [], polygons: []};
  collectGeometryPartsInto(geometry, parts);
  return parts;
}

/** Collects primitive parts from native GeoArrow coordinates without GeoJSON conversion. */
function collectNativeGeometryParts(geometry: GeoArrowNativeGeometry): GeometryParts {
  const parts: GeometryParts = {points: [], segments: [], polygons: []};
  switch (geometry.type) {
    case 'Point':
      addNativePoint(geometry.coordinates, parts);
      break;
    case 'MultiPoint':
      for (const coordinate of geometry.coordinates) addNativePoint(coordinate, parts);
      break;
    case 'LineString':
      addNativeLine(geometry.coordinates, parts);
      break;
    case 'MultiLineString':
      for (const line of geometry.coordinates) addNativeLine(line, parts);
      break;
    case 'Polygon':
      addNativePolygon(geometry.coordinates, parts);
      break;
    case 'MultiPolygon':
      for (const polygon of geometry.coordinates) addNativePolygon(polygon, parts);
      break;
    case 'GeometryCollection':
      for (const child of geometry.geometries) {
        const childParts = collectNativeGeometryParts(child);
        parts.points.push(...childParts.points);
        parts.segments.push(...childParts.segments);
        parts.polygons.push(...childParts.polygons);
      }
      break;
  }
  return parts;
}

/** Distinguishes a native tagged geometry from a GeoJSON geometry. */
function isNativeGeometry(
  geometry: GeoArrowNativeGeometry | Geometry
): geometry is GeoArrowNativeGeometry {
  return geometry.type === 'GeometryCollection'
    ? 'geometries' in geometry
    : Array.isArray((geometry as {coordinates?: unknown}).coordinates);
}

/** Adds native coordinates as a point when both horizontal ordinates are present. */
function addNativePoint(position: readonly number[], parts: GeometryParts): void {
  if (typeof position[0] === 'number' && typeof position[1] === 'number') {
    parts.points.push([position[0], position[1]]);
  }
}

/** Adds native line vertices and segments. */
function addNativeLine(positions: readonly (readonly number[])[], parts: GeometryParts): void {
  const coordinates = positions
    .filter(isNativeCoordinate)
    .map(position => [position[0], position[1]] as Coordinate);
  parts.points.push(...coordinates);
  for (let index = 1; index < coordinates.length; index++) {
    parts.segments.push([coordinates[index - 1], coordinates[index]]);
  }
}

/** Adds native polygon rings, vertices, and closing segments. */
function addNativePolygon(
  rings: readonly (readonly (readonly number[])[])[],
  parts: GeometryParts
): void {
  const polygon: Coordinate[][] = [];
  for (const ring of rings) {
    const coordinates = ring
      .filter(isNativeCoordinate)
      .map(position => [position[0], position[1]] as Coordinate);
    polygon.push(coordinates);
    parts.points.push(...coordinates);
    for (let index = 1; index < coordinates.length; index++) {
      parts.segments.push([coordinates[index - 1], coordinates[index]]);
    }
    if (
      coordinates.length > 2 &&
      !pointsEqual(coordinates[0], coordinates[coordinates.length - 1])
    ) {
      parts.segments.push([coordinates[coordinates.length - 1], coordinates[0]]);
    }
  }
  parts.polygons.push(polygon);
}

/** Narrows a native coordinate to two horizontal numeric ordinates. */
function isNativeCoordinate(position: readonly number[]): boolean {
  return typeof position[0] === 'number' && typeof position[1] === 'number';
}

function collectGeometryPartsInto(geometry: Geometry, parts: GeometryParts): void {
  switch (geometry.type) {
    case 'Point':
      addPoint(geometry.coordinates, parts);
      break;
    case 'MultiPoint':
      for (const coordinate of geometry.coordinates) addPoint(coordinate, parts);
      break;
    case 'LineString':
      addLine(geometry.coordinates, parts);
      break;
    case 'MultiLineString':
      for (const line of geometry.coordinates) addLine(line, parts);
      break;
    case 'Polygon':
      addPolygon(geometry.coordinates, parts);
      break;
    case 'MultiPolygon':
      for (const polygon of geometry.coordinates) addPolygon(polygon, parts);
      break;
    case 'GeometryCollection':
      for (const childGeometry of geometry.geometries)
        collectGeometryPartsInto(childGeometry, parts);
      break;
  }
}

function addPoint(position: Position, parts: GeometryParts): void {
  const coordinate = toCoordinate(position);
  if (coordinate) parts.points.push(coordinate);
}

function addLine(positions: Position[], parts: GeometryParts): void {
  const coordinates = positions.map(toCoordinate).filter(isCoordinate);
  parts.points.push(...coordinates);
  for (let index = 1; index < coordinates.length; index++) {
    parts.segments.push([coordinates[index - 1], coordinates[index]]);
  }
}

function addPolygon(rings: Position[][], parts: GeometryParts): void {
  const polygon: Coordinate[][] = [];
  for (const ring of rings) {
    const coordinates = ring.map(toCoordinate).filter(isCoordinate);
    polygon.push(coordinates);
    parts.points.push(...coordinates);
    for (let index = 1; index < coordinates.length; index++) {
      parts.segments.push([coordinates[index - 1], coordinates[index]]);
    }
    if (
      coordinates.length > 2 &&
      !pointsEqual(coordinates[0], coordinates[coordinates.length - 1])
    ) {
      parts.segments.push([coordinates[coordinates.length - 1], coordinates[0]]);
    }
  }
  parts.polygons.push(polygon);
}

function toCoordinate(position: Position): Coordinate | null {
  return typeof position[0] === 'number' && typeof position[1] === 'number'
    ? [position[0], position[1]]
    : null;
}

function isCoordinate(value: Coordinate | null): value is Coordinate {
  return value !== null;
}

function pointInPolygons(
  point: Coordinate,
  polygons: Coordinate[][][],
  allowBoundary: boolean
): boolean {
  return polygons.some(polygon => {
    const exteriorRelation = pointInRing(point, polygon[0] || []);
    if (exteriorRelation === 0) return allowBoundary;
    if (exteriorRelation < 0) return false;
    for (const hole of polygon.slice(1)) {
      const holeRelation = pointInRing(point, hole);
      if (holeRelation === 0) return allowBoundary;
      if (holeRelation > 0) return false;
    }
    return true;
  });
}

/** Returns 1 for inside, 0 for boundary, and -1 for outside. */
function pointInRing(point: Coordinate, ring: Coordinate[]): -1 | 0 | 1 {
  if (ring.length < 3) return -1;
  let inside = false;
  for (
    let index = 0, previousIndex = ring.length - 1;
    index < ring.length;
    previousIndex = index++
  ) {
    const current = ring[index];
    const previous = ring[previousIndex];
    if (pointOnSegment(point, [previous, current])) return 0;
    const crosses =
      current[1] > point[1] !== previous[1] > point[1] &&
      point[0] <
        ((previous[0] - current[0]) * (point[1] - current[1])) / (previous[1] - current[1]) +
          current[0];
    if (crosses) inside = !inside;
  }
  return inside ? 1 : -1;
}

function segmentsIntersect(firstSegment: Segment, secondSegment: Segment): boolean {
  const firstOrientation = orientation(firstSegment[0], firstSegment[1], secondSegment[0]);
  const secondOrientation = orientation(firstSegment[0], firstSegment[1], secondSegment[1]);
  const thirdOrientation = orientation(secondSegment[0], secondSegment[1], firstSegment[0]);
  const fourthOrientation = orientation(secondSegment[0], secondSegment[1], firstSegment[1]);
  if (firstOrientation === 0 && pointOnSegment(secondSegment[0], firstSegment)) return true;
  if (secondOrientation === 0 && pointOnSegment(secondSegment[1], firstSegment)) return true;
  if (thirdOrientation === 0 && pointOnSegment(firstSegment[0], secondSegment)) return true;
  if (fourthOrientation === 0 && pointOnSegment(firstSegment[1], secondSegment)) return true;
  return firstOrientation !== secondOrientation && thirdOrientation !== fourthOrientation;
}

function properSegmentsIntersect(firstSegment: Segment, secondSegment: Segment): boolean {
  return (
    orientation(firstSegment[0], firstSegment[1], secondSegment[0]) *
      orientation(firstSegment[0], firstSegment[1], secondSegment[1]) <
      0 &&
    orientation(secondSegment[0], secondSegment[1], firstSegment[0]) *
      orientation(secondSegment[0], secondSegment[1], firstSegment[1]) <
      0
  );
}

function orientation(first: Coordinate, second: Coordinate, third: Coordinate): number {
  const value =
    (second[0] - first[0]) * (third[1] - first[1]) - (second[1] - first[1]) * (third[0] - first[0]);
  return Math.abs(value) < Number.EPSILON ? 0 : value;
}

function pointOnSegment(point: Coordinate, segment: Segment): boolean {
  if (orientation(segment[0], segment[1], point) !== 0) return false;
  return (
    point[0] >= Math.min(segment[0][0], segment[1][0]) &&
    point[0] <= Math.max(segment[0][0], segment[1][0]) &&
    point[1] >= Math.min(segment[0][1], segment[1][1]) &&
    point[1] <= Math.max(segment[0][1], segment[1][1])
  );
}

function pointsEqual(first: Coordinate | undefined, second: Coordinate | undefined): boolean {
  return Boolean(first && second && first[0] === second[0] && first[1] === second[1]);
}

function getGeometryArea(geometry: Geometry): number {
  if (geometry.type === 'Polygon') return getPolygonArea(geometry.coordinates);
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.reduce((area, polygon) => area + getPolygonArea(polygon), 0);
  }
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.reduce((area, child) => area + getGeometryArea(child), 0);
  }
  return 0;
}

function getPolygonArea(rings: Position[][]): number {
  if (rings.length === 0) return 0;
  const exteriorArea = Math.abs(getRingSignedArea(rings[0]));
  const holeArea = rings
    .slice(1)
    .reduce((area, ring) => area + Math.abs(getRingSignedArea(ring)), 0);
  return Math.max(0, exteriorArea - holeArea);
}

/** Computes area from native XY rings while retaining the native geometry path. */
function getCoordinatePolygonArea(rings: Coordinate[][]): number {
  if (rings.length === 0) return 0;
  const exteriorArea = Math.abs(getCoordinateRingSignedArea(rings[0]));
  const holeArea = rings
    .slice(1)
    .reduce((area, ring) => area + Math.abs(getCoordinateRingSignedArea(ring)), 0);
  return Math.max(0, exteriorArea - holeArea);
}

/** Computes signed area for one native XY ring. */
function getCoordinateRingSignedArea(ring: Coordinate[]): number {
  let area = 0;
  for (let index = 1; index < ring.length; index++) {
    area += ring[index - 1][0] * ring[index][1] - ring[index][0] * ring[index - 1][1];
  }
  return area / 2;
}

function getRingSignedArea(ring: Position[]): number {
  let area = 0;
  for (let index = 1; index < ring.length; index++) {
    area += ring[index - 1][0] * ring[index][1] - ring[index][0] * ring[index - 1][1];
  }
  return area / 2;
}

function getGeometryLength(geometry: Geometry): number {
  switch (geometry.type) {
    case 'LineString':
      return getLineLength(geometry.coordinates);
    case 'MultiLineString':
      return geometry.coordinates.reduce((length, line) => length + getLineLength(line), 0);
    case 'Polygon':
      return geometry.coordinates.reduce((length, ring) => length + getLineLength(ring), 0);
    case 'MultiPolygon':
      return geometry.coordinates.reduce(
        (length, polygon) =>
          length + polygon.reduce((polygonLength, ring) => polygonLength + getLineLength(ring), 0),
        0
      );
    case 'GeometryCollection':
      return geometry.geometries.reduce((length, child) => length + getGeometryLength(child), 0);
    default:
      return 0;
  }
}

function getLineLength(positions: Position[]): number {
  let length = 0;
  for (let index = 1; index < positions.length; index++) {
    const first = toCoordinate(positions[index - 1]);
    const second = toCoordinate(positions[index]);
    if (first && second) length += distanceBetweenPoints(first, second);
  }
  return length;
}

function distanceBetweenPoints(first: Coordinate, second: Coordinate): number {
  return Math.hypot(first[0] - second[0], first[1] - second[1]);
}

function distanceToSegment(point: Coordinate, segment: Segment): number {
  const deltaX = segment[1][0] - segment[0][0];
  const deltaY = segment[1][1] - segment[0][1];
  const squaredLength = deltaX * deltaX + deltaY * deltaY;
  if (squaredLength === 0) return distanceBetweenPoints(point, segment[0]);
  const projection =
    ((point[0] - segment[0][0]) * deltaX + (point[1] - segment[0][1]) * deltaY) / squaredLength;
  const clampedProjection = Math.max(0, Math.min(1, projection));
  return distanceBetweenPoints(point, [
    segment[0][0] + clampedProjection * deltaX,
    segment[0][1] + clampedProjection * deltaY
  ]);
}
