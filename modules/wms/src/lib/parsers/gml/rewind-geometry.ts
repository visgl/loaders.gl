// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry, Position} from '@loaders.gl/core/schema';

/** Normalizes GML winding in place, preserving the historical Turf polygon and line ordering. */
export function rewindGeometry(geometry: Geometry): Geometry {
  switch (geometry.type) {
    case 'Polygon':
      rewindPolygon(geometry.coordinates);
      break;
    case 'MultiPolygon':
      for (const polygon of geometry.coordinates) rewindPolygon(polygon);
      break;
    case 'LineString':
      rewindCoordinates(geometry.coordinates, true);
      break;
    case 'MultiLineString':
      for (const line of geometry.coordinates) rewindCoordinates(line, true);
      break;
    case 'GeometryCollection':
      for (const child of geometry.geometries) rewindGeometry(child);
      break;
  }
  return geometry;
}

/** Makes polygon exteriors counterclockwise and holes clockwise. */
function rewindPolygon(rings: Position[][]): void {
  for (let ringIndex = 0; ringIndex < rings.length; ringIndex++) {
    rewindCoordinates(rings[ringIndex], ringIndex > 0);
  }
}

/** Reverses coordinates when their planar winding differs from the requested direction. */
function rewindCoordinates(coordinates: Position[], clockwise: boolean): void {
  let windingSum = 0;
  for (let pointIndex = 1; pointIndex < coordinates.length; pointIndex++) {
    const previousPoint = coordinates[pointIndex - 1];
    const currentPoint = coordinates[pointIndex];
    windingSum += (currentPoint[0] - previousPoint[0]) * (currentPoint[1] + previousPoint[1]);
  }
  if (windingSum > 0 !== clockwise) coordinates.reverse();
}
