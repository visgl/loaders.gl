// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {getPolygonSignedArea} from '@math.gl/polygon';
import {FlatIndexedGeometry, FlatPolygon} from '@loaders.gl/schema';

/**
 *
 * @param ring
 * @returns sum
 */
export function signedArea(ring: number[][]) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1, p1: number[], p2: number[]; i < ring.length; j = i++) {
    p1 = ring[i];
    p2 = ring[j];
    sum += (p2[0] - p1[0]) * (p1[1] + p2[1]);
  }
  return sum;
}

/**
 * This function projects local coordinates in a
 * [0 - bufferSize, this.extent + bufferSize] range to a
 * [0 - (bufferSize / this.extent), 1 + (bufferSize / this.extent)] range.
 * The resulting extent would be 1.
 * @param line
 * @param feature
 */
export function convertToLocalCoordinates(
  coordinates: number[] | number[][] | number[][][] | number[][][][],
  extent: number
): void {
  if (Array.isArray(coordinates[0])) {
    for (const subcoords of coordinates) {
      convertToLocalCoordinates(subcoords as number[] | number[][] | number[][][], extent);
    }
    return;
  }

  // Just a point
  const p = coordinates as number[];
  p[0] /= extent;
  p[1] /= extent;
}

/**
 * For the binary code path, the feature data is just
 * one big flat array, so we just divide each value
 * @param data
 * @param feature
 */
export function convertToLocalCoordinatesFlat(data: number[], extent: number): void {
  for (let i = 0; i < data.length; ++i) {
    data[i] /= extent;
  }
}

/**
 * Projects local tile coordinates to lngLat in place.
 * @param points
 * @param tileIndex
 */
export function projectToLngLat(
  line: number[] | number[][] | number[][][],
  tileIndex: {x: number; y: number; z: number},
  extent: number
): void {
  if (typeof line[0][0] !== 'number') {
    for (const point of line) {
      // @ts-expect-error
      projectToLngLat(point, tileIndex, extent);
    }
    return;
  }
  const size = extent * Math.pow(2, tileIndex.z);
  const x0 = extent * tileIndex.x;
  const y0 = extent * tileIndex.y;
  for (let j = 0; j < line.length; j++) {
    const p = line[j];
    p[0] = ((p[0] + x0) * 360) / size - 180;
    const y2 = 180 - ((p[1] + y0) * 360) / size;
    p[1] = (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
  }
}

/**
 * Projects local tile coordinates to lngLat in place.
 * @param points
 * @param tileIndex
export function projectTileCoordinatesToLngLat(
  points: number[][],
  tileIndex: {x: number; y: number; z: number},
  extent: number
): void {
  const {x, y, z} = tileIndex;
  const size = extent * Math.pow(2, z);
  const x0 = extent * x;
  const y0 = extent * y;

  for (const p of points) {
    p[0] = ((p[0] + x0) * 360) / size - 180;
    const y2 = 180 - ((p[1] + y0) * 360) / size;
    p[1] = (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
  }
}
 */

/**
 *
 * @param data
 * @param x0
 * @param y0
 * @param size
 */
export function projectToLngLatFlat(
  data: number[],
  tileIndex: {x: number; y: number; z: number},
  extent: number
): void {
  const {x, y, z} = tileIndex;
  const size = extent * Math.pow(2, z);
  const x0 = extent * x;
  const y0 = extent * y;

  for (let j = 0, jl = data.length; j < jl; j += 2) {
    data[j] = ((data[j] + x0) * 360) / size - 180;
    const y2 = 180 - ((data[j + 1] + y0) * 360) / size;
    data[j + 1] = (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
  }
}

/**
 * Classifies an array of rings into polygons with outer rings and holes
 * @param rings
 * @returns polygons
 */
export function classifyRings(rings: number[][][]): number[][][][] {
  const len = rings.length;

  if (len <= 1) return [rings];

  const polygons: number[][][][] = [];
  let polygon: number[][][] | undefined;
  let ccw: boolean | undefined;

  for (let i = 0; i < len; i++) {
    const area = signedArea(rings[i]);
    if (area === 0) continue; // eslint-disable-line no-continue

    if (ccw === undefined) ccw = area < 0;

    if (ccw === area < 0) {
      if (polygon) polygons.push(polygon);
      polygon = [rings[i]];
    } else if (polygon) polygon.push(rings[i]);
  }
  if (polygon) polygons.push(polygon);

  return polygons;
}

/**
 * Classifies an array of rings into polygons with outer rings and holes
 * The function also detects holes which have zero area and
 * removes them. In doing so it modifies the input
 * `geom.data` array to remove the unneeded data
 *
 * @param geometry
 * @returns object
 */
// eslint-disable-next-line max-statements
export function classifyRingsFlat(geom: FlatIndexedGeometry): FlatPolygon {
  const len = geom.indices.length;
  const type = 'Polygon';

  if (len <= 1) {
    return {
      type,
      data: geom.data,
      areas: [[getPolygonSignedArea(geom.data)]],
      indices: [geom.indices]
    };
  }

  const areas: any[] = [];
  const polygons: any[] = [];
  let ringAreas: number[] = [];
  let polygon: number[] = [];
  let ccw: boolean | undefined;
  let offset = 0;

  for (let endIndex: number, i = 0, startIndex: number; i < len; i++) {
    startIndex = geom.indices[i] - offset;

    endIndex = geom.indices[i + 1] - offset || geom.data.length;
    const shape = geom.data.slice(startIndex, endIndex);
    const area = getPolygonSignedArea(shape);

    if (area === 0) {
      // This polygon has no area, so remove it from the shape
      // Remove the section from the data array
      const before = geom.data.slice(0, startIndex);
      const after = geom.data.slice(endIndex);
      geom.data = before.concat(after);

      // Need to offset any remaining indices as we have
      // modified the data buffer
      offset += endIndex - startIndex;

      // Do not add this index to the output and process next shape
      continue; // eslint-disable-line no-continue
    }

    if (ccw === undefined) ccw = area < 0;

    if (ccw === area < 0) {
      if (polygon.length) {
        areas.push(ringAreas);
        polygons.push(polygon);
      }
      polygon = [startIndex];
      ringAreas = [area];
    } else {
      ringAreas.push(area);
      polygon.push(startIndex);
    }
  }
  if (ringAreas) areas.push(ringAreas);
  if (polygon.length) polygons.push(polygon);

  return {type, areas, indices: polygons, data: geom.data};
}
