// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BinaryPolygonGeometry} from '@loaders.gl/schema';
import type {GeoArrowColumn, GeoArrowDimension} from '@math.gl/geoarrow';
import {getGeoArrowDimensionSize} from '@math.gl/geoarrow';

/** Semantic information absent from the legacy binary polygon representation. */
export type BinaryPolygonToGeoArrowOptions = {
  /** Explicit coordinate dimension; three components can mean XYZ or XYM. */
  dimension: GeoArrowDimension;
};

/**
 * Adapts binary polygons to an Arrow-independent math.gl GeoArrow column.
 *
 * Each polygon becomes one row. Positions are borrowed, as are Int32 ring offsets;
 * polygon-to-ring offsets and any required ring-offset conversion are allocated.
 * Borrowed buffers must not be mutated while the column is in use.
 *
 * Offsets must start at zero, cover the supplied positions, and include a terminal
 * offset. Repeated polygon offsets represent empty rows. Empty rings are rejected
 * because their polygon ownership cannot be recovered from vertex offsets.
 * This validates the buffer structure, not polygon topology or ring closure.
 * MultiPolygon grouping, feature attributes, and triangle indices are not inferred.
 */
export function makeGeoArrowColumnFromBinaryPolygon(
  geometry: BinaryPolygonGeometry,
  options: BinaryPolygonToGeoArrowOptions
): GeoArrowColumn {
  const {dimension} = options;
  if (!['xy', 'xyz', 'xym', 'xyzm'].includes(dimension)) {
    throw new Error('Binary polygon dimension must be xy, xyz, xym, or xyzm.');
  }
  const coordinateSize = getGeoArrowDimensionSize(dimension);
  const positions = geometry.positions.value;
  if (
    !(positions instanceof Float32Array || positions instanceof Float64Array) ||
    geometry.positions.size !== coordinateSize ||
    positions.length % coordinateSize !== 0
  ) {
    throw new Error('Binary polygon positions must be floating-point tuples matching dimension.');
  }
  const vertexCount = positions.length / coordinateSize;
  if (vertexCount > 0x7fffffff) {
    throw new Error('Binary polygon vertex count exceeds Int32 offsets.');
  }
  validateOffsets(geometry.primitivePolygonIndices, vertexCount, 'Ring', false);
  validateOffsets(geometry.polygonIndices, vertexCount, 'Polygon', true);

  const ringIndices = geometry.primitivePolygonIndices.value;
  const polygonIndices = geometry.polygonIndices.value;
  const polygonOffsets = new Int32Array(polygonIndices.length);
  let ringIndex = 0;
  for (let polygonIndex = 0; polygonIndex < polygonIndices.length; polygonIndex++) {
    const vertexOffset = polygonIndices[polygonIndex];
    while (ringIndices[ringIndex] < vertexOffset) ringIndex++;
    if (ringIndices[ringIndex] !== vertexOffset) {
      throw new Error('Binary polygon boundaries must coincide with ring boundaries.');
    }
    polygonOffsets[polygonIndex] = ringIndex;
  }
  const ringOffsets =
    ringIndices instanceof Int32Array ? ringIndices : Int32Array.from(ringIndices);

  return {
    encoding: 'geoarrow.polygon',
    dimension,
    coordinateLayout: 'interleaved',
    chunks: [
      {
        kind: 'list',
        length: polygonOffsets.length - 1,
        offsets: polygonOffsets,
        child: {
          kind: 'list',
          length: ringOffsets.length - 1,
          offsets: ringOffsets,
          child: {
            kind: 'fixed-size-list',
            length: vertexCount,
            size: coordinateSize,
            child: {kind: 'primitive', length: positions.length, values: positions}
          }
        }
      }
    ]
  };
}

/** Validates complete vertex offsets before narrowing them to signed Int32 storage. */
function validateOffsets(
  attribute: BinaryPolygonGeometry['polygonIndices'],
  vertexCount: number,
  label: string,
  allowEmpty: boolean
): void {
  const offsets = attribute.value;
  if (
    attribute.size !== 1 ||
    offsets.length === 0 ||
    offsets[0] !== 0 ||
    offsets[offsets.length - 1] !== vertexCount
  ) {
    throw new Error(`${label} offsets must have size 1 and span all vertices from zero.`);
  }
  for (let index = 1; index < offsets.length; index++) {
    const offset = offsets[index];
    const previousOffset = offsets[index - 1];
    if (
      !Number.isInteger(offset) ||
      offset > vertexCount ||
      offset < previousOffset ||
      (!allowEmpty && offset === previousOffset)
    ) {
      throw new Error(`${label} offsets must be ordered integers; empty rings are unsupported.`);
    }
  }
}
