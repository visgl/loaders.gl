// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  BinaryGeometry,
  BinaryPointGeometry,
  BinaryLineGeometry,
  BinaryPolygonGeometry,
  BinaryAttribute,
  Geometry,
  Position,
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon
} from '@loaders.gl/schema';

/** Parse input binary data and return a valid GeoJSON geometry object */
export function convertBinaryGeometryToGeoJSON(
  data: BinaryGeometry,
  startIndex?: number,
  endIndex?: number
): Geometry {
  switch (data.type) {
    case 'Point':
      return pointToGeoJson(data, startIndex, endIndex);
    case 'LineString':
      return lineStringToGeoJson(data, startIndex, endIndex);
    case 'Polygon':
      return polygonToGeoJson(data, startIndex, endIndex);
    default:
      const unexpectedInput: never = data;
      throw new Error(`Unsupported geometry type: ${(unexpectedInput as any)?.type}`);
  }
}

/** Parse binary data of type Polygon */
function polygonToGeoJson(
  data: BinaryPolygonGeometry,
  startIndex: number = -Infinity,
  endIndex: number = Infinity
): Polygon | MultiPolygon {
  const {positions} = data;
  const polygonIndices = data.polygonIndices.value.filter((x) => x >= startIndex && x <= endIndex);
  const primitivePolygonIndices = data.primitivePolygonIndices.value.filter(
    (x) => x >= startIndex && x <= endIndex
  );
  const multi = polygonIndices.length > 2;

  // Polygon
  if (!multi) {
    const coordinates: Position[][] = [];
    for (let i = 0; i < primitivePolygonIndices.length - 1; i++) {
      const startRingIndex = primitivePolygonIndices[i];
      const endRingIndex = primitivePolygonIndices[i + 1];
      const ringCoordinates = ringToGeoJson(positions, startRingIndex, endRingIndex);
      coordinates.push(ringCoordinates);
    }

    return {type: 'Polygon', coordinates};
  }

  // MultiPolygon
  const coordinates: Position[][][] = [];
  for (let i = 0; i < polygonIndices.length - 1; i++) {
    const startPolygonIndex = polygonIndices[i];
    const endPolygonIndex = polygonIndices[i + 1];
    const polygonCoordinates = polygonToGeoJson(
      data,
      startPolygonIndex,
      endPolygonIndex
    ).coordinates;
    coordinates.push(polygonCoordinates as Position[][]);
  }

  return {type: 'MultiPolygon', coordinates};
}

/** Parse binary data of type LineString */
function lineStringToGeoJson(
  data: BinaryLineGeometry,
  startIndex: number = -Infinity,
  endIndex: number = Infinity
): LineString | MultiLineString {
  const {positions} = data;
  const pathIndices = data.pathIndices.value.filter((x) => x >= startIndex && x <= endIndex);
  const multi = pathIndices.length > 2;

  if (!multi) {
    const coordinates = ringToGeoJson(positions, pathIndices[0], pathIndices[1]);
    return {type: 'LineString', coordinates};
  }

  const coordinates: Position[][] = [];
  for (let i = 0; i < pathIndices.length - 1; i++) {
    const ringCoordinates = ringToGeoJson(positions, pathIndices[i], pathIndices[i + 1]);
    coordinates.push(ringCoordinates);
  }

  return {type: 'MultiLineString', coordinates};
}

/** Parse binary data of type Point */
function pointToGeoJson(
  data: BinaryPointGeometry,
  startIndex: number,
  endIndex: number
): Point | MultiPoint {
  const {positions} = data;
  const coordinates = ringToGeoJson(positions, startIndex, endIndex);
  const multi = coordinates.length > 1;

  if (multi) {
    return {type: 'MultiPoint', coordinates};
  }

  return {type: 'Point', coordinates: coordinates[0]};
}

/**
 * Parse a linear ring of positions to a GeoJSON linear ring
 *
 * @param positions Positions TypedArray
 * @param startIndex Start index to include in ring
 * @param endIndex End index to include in ring
 * @returns GeoJSON ring
 */
function ringToGeoJson(
  positions: BinaryAttribute,
  startIndex?: number,
  endIndex?: number
): Position[] {
  startIndex = startIndex || 0;
  endIndex = endIndex || positions.value.length / positions.size;

  const ringCoordinates: Position[] = [];
  for (let j = startIndex; j < endIndex; j++) {
    const coord = Array<number>();
    for (let k = j * positions.size; k < (j + 1) * positions.size; k++) {
      coord.push(Number(positions.value[k]));
    }
    ringCoordinates.push(coord);
  }
  return ringCoordinates;
}
