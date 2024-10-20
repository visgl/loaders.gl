// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  TypedArray,
  BinaryPointGeometry,
  BinaryLineGeometry,
  BinaryPolygonGeometry
} from '@loaders.gl/schema';
import {concatTypedArrays} from '../utils/concat-typed-arrays';

export function concatenateBinaryPointGeometries(
  binaryPointGeometries: BinaryPointGeometry[],
  dimension: number
): BinaryPointGeometry {
  const positions: TypedArray[] = binaryPointGeometries.map((geometry) => geometry.positions.value);
  const concatenatedPositions = new Float64Array(concatTypedArrays(positions).buffer);

  return {
    type: 'Point',
    positions: {value: concatenatedPositions, size: dimension}
  };
}

export function concatenateBinaryLineGeometries(
  binaryLineGeometries: BinaryLineGeometry[],
  dimension: number
): BinaryLineGeometry {
  const lines: TypedArray[] = binaryLineGeometries.map((geometry) => geometry.positions.value);
  const concatenatedPositions = new Float64Array(concatTypedArrays(lines).buffer);
  const pathIndices = lines.map((line) => line.length / dimension).map(cumulativeSum(0));
  pathIndices.unshift(0);

  return {
    type: 'LineString',
    positions: {value: concatenatedPositions, size: dimension},
    pathIndices: {value: new Uint32Array(pathIndices), size: 1}
  };
}

export function concatenateBinaryPolygonGeometries(
  binaryPolygonGeometries: BinaryPolygonGeometry[],
  dimension: number
): BinaryPolygonGeometry {
  const polygons: TypedArray[] = [];
  const primitivePolygons: TypedArray[] = [];

  for (const binaryPolygon of binaryPolygonGeometries) {
    const {positions, primitivePolygonIndices} = binaryPolygon;
    polygons.push(positions.value);
    primitivePolygons.push(primitivePolygonIndices.value);
  }

  const concatenatedPositions = new Float64Array(concatTypedArrays(polygons).buffer);
  const polygonIndices = polygons.map((p) => p.length / dimension).map(cumulativeSum(0));
  polygonIndices.unshift(0);

  // Combine primitivePolygonIndices from each individual polygon
  const primitivePolygonIndices = [0];
  for (const primitivePolygon of primitivePolygons) {
    primitivePolygonIndices.push(
      ...primitivePolygon
        .filter((x: number) => x > 0)
        .map((x: number) => x + primitivePolygonIndices[primitivePolygonIndices.length - 1])
    );
  }

  return {
    type: 'Polygon',
    positions: {value: concatenatedPositions, size: dimension},
    polygonIndices: {value: new Uint32Array(polygonIndices), size: 1},
    primitivePolygonIndices: {value: new Uint32Array(primitivePolygonIndices), size: 1}
  };
}

// https://stackoverflow.com/a/55261098
const cumulativeSum = (sum: number) => (value: number) => (sum += value);
