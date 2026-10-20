// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry} from '@loaders.gl/core/schema';
import {
  concatenateBytes,
  encodeVarints,
  encodeStream,
  encodeIntegerStream
} from './encode-mlt-streams';

/** Quantizes XY geometry and drops collapsed paths while retaining polygon/hole ownership. */
export function quantizeGeometry(geometry: Geometry, scale: number): Geometry | null {
  /** Quantizes a finite XY coordinate into the signed delta-safe range. */
  function projectPoint(point: number[]): number[] {
    if (point.length !== 2 || !point.every(Number.isFinite))
      throw new Error('MLT requires finite XY coordinates');
    const result = point.map(value => Math.round(value * scale));
    if (result.some(value => Math.abs(value) > 1073741823))
      throw new Error('MLT quantized coordinate limit exceeded');
    return result;
  }
  /** Drops consecutive repeated quantized vertices. */
  function projectLine(line: number[][]): number[][] {
    return line
      .map(projectPoint)
      .filter(
        (point, index, points) =>
          !index || point[0] !== points[index - 1][0] || point[1] !== points[index - 1][1]
      );
  }
  /** Removes ring closure and collapsed rings without promoting a hole to an exterior. */
  function projectPolygon(polygon: number[][][]): number[][][] {
    const rings: number[][][] = [];
    for (let index = 0; index < polygon.length; index++) {
      const ring = projectLine(polygon[index]);
      if (
        ring.length &&
        ring[0][0] === ring[ring.length - 1][0] &&
        ring[0][1] === ring[ring.length - 1][1]
      )
        ring.pop();
      let area = 0;
      for (let vertex = 1; vertex + 1 < ring.length; vertex++)
        area +=
          (ring[vertex][0] - ring[0][0]) * (ring[vertex + 1][1] - ring[0][1]) -
          (ring[vertex + 1][0] - ring[0][0]) * (ring[vertex][1] - ring[0][1]);
      if (ring.length < 3 || !area) {
        if (!index) return [];
        continue;
      }
      rings.push(ring);
    }
    return rings;
  }
  switch (geometry.type) {
    case 'Point':
      return geometry.coordinates.length
        ? {type: 'Point', coordinates: projectPoint(geometry.coordinates)}
        : null;
    case 'MultiPoint':
      return geometry.coordinates.length
        ? {type: 'MultiPoint', coordinates: geometry.coordinates.map(projectPoint)}
        : null;
    case 'LineString': {
      const coordinates = projectLine(geometry.coordinates);
      return coordinates.length > 1 ? {type: 'LineString', coordinates} : null;
    }
    case 'MultiLineString': {
      const coordinates = geometry.coordinates.map(projectLine).filter(line => line.length > 1);
      return coordinates.length ? {type: 'MultiLineString', coordinates} : null;
    }
    case 'Polygon': {
      const coordinates = projectPolygon(geometry.coordinates);
      return coordinates.length ? {type: 'Polygon', coordinates} : null;
    }
    case 'MultiPolygon': {
      const coordinates = geometry.coordinates
        .map(projectPolygon)
        .filter(polygon => polygon.length);
      return coordinates.length ? {type: 'MultiPolygon', coordinates} : null;
    }
    default:
      throw new Error(`Unsupported MLT geometry: ${geometry.type}`);
  }
}

/** Writes v1 geometry topology and componentwise delta vertices, preserving all six geometry types. */
export function encodeGeometryColumn(geometries: Geometry[]): Uint8Array {
  const types: number[] = [];
  const geometryLengths: number[] = [];
  const partLengths: number[] = [];
  const ringLengths: number[] = [];
  const vertices: number[] = [];
  const hasPolygons = geometries.some(geometry => geometry.type.includes('Polygon'));
  let previousX = 0;
  let previousY = 0;
  /** Appends interleaved ZigZag componentwise deltas across the whole column. */
  function writePoints(points: number[][]): void {
    for (const [x, y] of points) {
      const deltaX = x - previousX;
      const deltaY = y - previousY;
      vertices.push(
        deltaX < 0 ? -2 * deltaX - 1 : 2 * deltaX,
        deltaY < 0 ? -2 * deltaY - 1 : 2 * deltaY
      );
      previousX = x;
      previousY = y;
    }
  }
  /** Writes line lengths in the deepest topology stream present. */
  function writeLine(line: number[][]): void {
    (hasPolygons ? ringLengths : partLengths).push(line.length);
    writePoints(line);
  }
  /** Writes the ring count and each unclosed ring's vertex count. */
  function writePolygon(polygon: number[][][]): void {
    partLengths.push(polygon.length);
    for (const ring of polygon) {
      ringLengths.push(ring.length);
      writePoints(ring);
    }
  }
  for (const geometry of geometries) {
    switch (geometry.type) {
      case 'Point':
        types.push(0);
        writePoints([geometry.coordinates]);
        break;
      case 'LineString':
        types.push(1);
        writeLine(geometry.coordinates);
        break;
      case 'Polygon':
        types.push(2);
        writePolygon(geometry.coordinates);
        break;
      case 'MultiPoint':
        types.push(3);
        geometryLengths.push(geometry.coordinates.length);
        writePoints(geometry.coordinates);
        break;
      case 'MultiLineString':
        types.push(4);
        geometryLengths.push(geometry.coordinates.length);
        geometry.coordinates.forEach(writeLine);
        break;
      case 'MultiPolygon':
        types.push(5);
        geometryLengths.push(geometry.coordinates.length);
        geometry.coordinates.forEach(writePolygon);
        break;
    }
  }
  const streams = [encodeIntegerStream(0x10, types)];
  if (geometryLengths.length) streams.push(encodeIntegerStream(0x31, geometryLengths));
  if (partLengths.length) streams.push(encodeIntegerStream(0x32, partLengths));
  if (ringLengths.length) streams.push(encodeIntegerStream(0x33, ringLengths));
  streams.push(encodeStream(0x13, 0x42, vertices.length, encodeVarints(vertices)));
  return concatenateBytes([encodeVarints([streams.length]), ...streams]);
}
