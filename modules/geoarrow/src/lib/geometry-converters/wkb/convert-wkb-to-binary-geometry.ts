// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BinaryGeometry} from '@loaders.gl/schema';
import {getWellKnownDimensionSize, scanWKB, visitWKB} from '@math.gl/wkb';

/**
 * Materializes legacy vertex-indexed binary geometry using math.gl's WKB traversal.
 * This allocating compatibility path intentionally retains the legacy single/multi
 * representation and does not support GeometryCollections.
 */
export function convertWKBToBinaryGeometry(input: ArrayBufferLike): BinaryGeometry {
  const statistics = scanWKB(input);
  const {geometryType, dimension} = statistics.header;
  if (geometryType === 'GeometryCollection') {
    throw new Error('WKB: Unsupported geometry type: 7');
  }
  const coordinateSize = getWellKnownDimensionSize(dimension);
  const values = new Float64Array(statistics.coordinateCount * coordinateSize);
  const pathIndices = [0];
  const polygonStarts: number[] = [];
  const ringIndices = [0];
  let valueIndex = 0;
  let polygonStart = 0;

  visitWKB(input, {
    geometry(header, count) {
      if (header.dimension !== dimension) {
        throw new Error('WKB: Mixed dimensions cannot be represented by legacy BinaryGeometry');
      }
      const vertexIndex = valueIndex / coordinateSize;
      const pointCount = count ?? 0;
      if (
        header.geometryType === 'LineString' &&
        (geometryType === 'MultiLineString' || pointCount > 0)
      ) {
        pathIndices.push(vertexIndex + pointCount);
      }
      if (header.geometryType === 'Polygon') {
        polygonStart = vertexIndex;
        polygonStarts.push(vertexIndex);
      }
    },
    ring(pointCount) {
      const endIndex = valueIndex / coordinateSize + pointCount;
      // Legacy multi-polygons omitted leading empty rings within each polygon.
      if (geometryType === 'Polygon' || endIndex > polygonStart) ringIndices.push(endIndex);
    },
    coordinate(coordinateX, coordinateY, elevation, measure) {
      values[valueIndex++] = coordinateX;
      values[valueIndex++] = coordinateY;
      if (dimension === 'xyz' || dimension === 'xyzm') values[valueIndex++] = elevation!;
      if (dimension === 'xym' || dimension === 'xyzm') values[valueIndex++] = measure!;
    }
  });

  const positions = {value: values, size: coordinateSize};
  switch (geometryType) {
    case 'Point':
    case 'MultiPoint':
      return {type: 'Point', positions};
    case 'LineString':
    case 'MultiLineString':
      return {
        type: 'LineString',
        positions,
        pathIndices: {value: new Uint32Array(pathIndices), size: 1}
      };
    case 'Polygon':
    case 'MultiPolygon': {
      const polygonIndices =
        geometryType === 'Polygon'
          ? statistics.coordinateCount > 0
            ? [0, statistics.coordinateCount]
            : [0]
          : [...polygonStarts, statistics.coordinateCount];
      return {
        type: 'Polygon',
        positions,
        polygonIndices: {value: new Uint32Array(polygonIndices), size: 1},
        primitivePolygonIndices: {value: new Uint32Array(ringIndices), size: 1}
      };
    }
  }
}
