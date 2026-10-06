// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry} from '@loaders.gl/schema';

/** Explicit policy for representing an entire geometry by one point. */
export type RepresentativePointStrategy = 'point' | 'centroid' | 'bounds-center' | 'line-midpoint';

/**
 * Returns one planar XY representative, or null for empty/invalid/inapplicable geometry.
 *
 * Centroids use polygon area (subtracting holes regardless of winding), line length, or
 * equal point weights. Collections average their nonempty child representatives. Degenerate
 * polygons fall back to their boundary centroid. Centroids and bounds centers can lie outside
 * polygons. Geographic callers must unwrap dateline-crossing geometries before using planar
 * policies, or supply a projection-aware position callback to ClusterSource.
 */
export function getRepresentativePoint(
  geometry: Geometry | null,
  strategy: RepresentativePointStrategy = 'point'
): [number, number] | null {
  if (!geometry) return null;
  if (!['point', 'centroid', 'bounds-center', 'line-midpoint'].includes(strategy)) {
    throw new Error(`Unknown representative point strategy: ${strategy}`);
  }
  const positions = collectPositions(geometry);
  if (
    !positions.length ||
    positions.some(position => !Number.isFinite(position[0]) || !Number.isFinite(position[1]))
  )
    return null;
  if (geometry.type === 'Point') return [geometry.coordinates[0], geometry.coordinates[1]];
  if (strategy === 'point') return null;
  if (strategy === 'bounds-center') {
    let minimumX = Infinity;
    let minimumY = Infinity;
    let maximumX = -Infinity;
    let maximumY = -Infinity;
    for (const position of positions) {
      minimumX = Math.min(minimumX, position[0]);
      minimumY = Math.min(minimumY, position[1]);
      maximumX = Math.max(maximumX, position[0]);
      maximumY = Math.max(maximumY, position[1]);
    }
    return [minimumX / 2 + maximumX / 2, minimumY / 2 + maximumY / 2];
  }
  if (strategy === 'line-midpoint') {
    if (geometry.type !== 'LineString' && geometry.type !== 'MultiLineString') return null;
    const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates;
    const totalLength = lines.reduce((total, line) => total + getLineCentroid(line).weight, 0);
    let remainingLength = totalLength / 2;
    for (const line of lines) {
      for (let index = 1; index < line.length; index++) {
        const start = line[index - 1];
        const end = line[index];
        const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
        if (length > 0 && remainingLength <= length) {
          const fraction = remainingLength / length;
          return [
            start[0] + fraction * (end[0] - start[0]),
            start[1] + fraction * (end[1] - start[1])
          ];
        }
        remainingLength -= length;
      }
    }
    return [positions[0][0], positions[0][1]];
  }
  switch (geometry.type) {
    case 'Polygon':
      return getPolygonCentroid(geometry.coordinates).position;
    case 'MultiPolygon':
      return combineCentroids(geometry.coordinates.map(getPolygonCentroid));
    case 'LineString':
      return getLineCentroid(geometry.coordinates).position;
    case 'MultiLineString':
      return combineCentroids(geometry.coordinates.map(getLineCentroid));
    case 'GeometryCollection':
      return combineCentroids(
        geometry.geometries.map(member => ({
          position: getRepresentativePoint(member, 'centroid'),
          weight: 1
        }))
      );
    default:
      return combineCentroids(
        positions.map(position => ({position: [position[0], position[1]], weight: 1}))
      );
  }
}

/** A representative and its geometric measure for combining multipart inputs. */
type WeightedPoint = {
  /** Representative coordinate, or null for empty input. */
  position: [number, number] | null;
  /** Area, length, or count used as weight. */
  weight: number;
};

/** Enumerates positions without inserting artificial segments between parts. */
function collectPositions(geometry: Geometry): number[][] {
  switch (geometry.type) {
    case 'Point':
      return geometry.coordinates.length ? [geometry.coordinates] : [];
    case 'MultiPoint':
    case 'LineString':
      return geometry.coordinates;
    case 'MultiLineString':
    case 'Polygon':
      return geometry.coordinates.flat();
    case 'MultiPolygon':
      return geometry.coordinates.flat(2);
    case 'GeometryCollection':
      return geometry.geometries.flatMap(collectPositions);
  }
}

/** Combines measures, falling back to equal weights when every measure is zero. */
function combineCentroids(points: WeightedPoint[]): [number, number] | null {
  const validPoints = points.filter(point => point.position !== null);
  if (!validPoints.length) return null;
  const totalWeight = validPoints.reduce((total, point) => total + point.weight, 0);
  let positionX = 0;
  let positionY = 0;
  for (const point of validPoints) {
    const weight = totalWeight > 0 ? point.weight / totalWeight : 1 / validPoints.length;
    positionX += point.position![0] * weight;
    positionY += point.position![1] * weight;
  }
  return [positionX, positionY];
}

/** Computes the length-weighted centroid of segment midpoints. */
function getLineCentroid(line: number[][]): WeightedPoint {
  const segments: WeightedPoint[] = [];
  let totalLength = 0;
  for (let index = 1; index < line.length; index++) {
    const start = line[index - 1];
    const end = line[index];
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    totalLength += length;
    segments.push({
      position: [start[0] / 2 + end[0] / 2, start[1] / 2 + end[1] / 2],
      weight: length
    });
  }
  return {
    position: segments.length
      ? combineCentroids(segments)
      : line.length
        ? [line[0][0], line[0][1]]
        : null,
    weight: totalLength
  };
}

/** Computes a polygon centroid with winding-independent hole subtraction. */
function getPolygonCentroid(rings: number[][][]): WeightedPoint {
  let totalArea = 0;
  let weightedX = 0;
  let weightedY = 0;
  for (let ringIndex = 0; ringIndex < rings.length; ringIndex++) {
    const ring = rings[ringIndex];
    if (!ring.length) continue;
    const origin = ring[0];
    let twiceArea = 0;
    let momentX = 0;
    let momentY = 0;
    for (let index = 0; index < ring.length; index++) {
      const start = ring[index];
      const end = ring[(index + 1) % ring.length];
      const startX = start[0] - origin[0];
      const startY = start[1] - origin[1];
      const endX = end[0] - origin[0];
      const endY = end[1] - origin[1];
      const cross = startX * endY - endX * startY;
      twiceArea += cross;
      momentX += (startX + endX) * cross;
      momentY += (startY + endY) * cross;
    }
    if (twiceArea) {
      const area = (Math.abs(twiceArea) / 2) * (ringIndex === 0 ? 1 : -1);
      totalArea += area;
      weightedX += (origin[0] + momentX / (3 * twiceArea)) * area;
      weightedY += (origin[1] + momentY / (3 * twiceArea)) * area;
    }
  }
  return totalArea > 0
    ? {position: [weightedX / totalArea, weightedY / totalArea], weight: totalArea}
    : {position: combineCentroids(rings.map(getLineCentroid)), weight: 0};
}
