// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {GeoArrowEncoding} from '@loaders.gl/schema';

/** Ring orientation requested by {@link rewindGeoArrow}. */
export type GeoArrowRingOrientation = 'counterclockwise' | 'clockwise';

/** Options for native polygon ring canonicalization. */
export type RewindGeoArrowOptions = Readonly<{
  /** Desired exterior ring orientation. Defaults to counterclockwise. */
  exterior?: GeoArrowRingOrientation;
}>;

/**
 * Rewinds native polygon rings to a deterministic orientation in place.
 *
 * Exterior rings use the requested orientation and interior rings use the opposite orientation.
 * Arrow nesting and offset buffers are retained; only coordinate tuples are swapped. Dense unions
 * and GeometryCollection lists are traversed recursively, so mixed native columns are supported.
 *
 * @param column Native polygon, multipolygon, union, or collection vector.
 * @param encoding Polygon, multipolygon, union, or collection encoding.
 * @param options Ring orientation options.
 * @returns The same vector after ring rewinding.
 */
export function rewindGeoArrow(
  column: arrow.Vector,
  encoding: GeoArrowEncoding,
  options: RewindGeoArrowOptions = {}
): arrow.Vector {
  if (
    encoding !== 'geoarrow.polygon' &&
    encoding !== 'geoarrow.multipolygon' &&
    encoding !== 'geoarrow.geometry' &&
    encoding !== 'geoarrow.geometrycollection'
  ) {
    throw new Error(
      `GeoArrow rewind requires polygon, multipolygon, geometry, or geometrycollection encoding, got ${encoding}.`
    );
  }
  const exteriorSign = options.exterior === 'clockwise' ? -1 : 1;
  if (encoding === 'geoarrow.geometry' || encoding === 'geoarrow.geometrycollection') {
    for (const data of column.data) rewindUnionData(data, exteriorSign);
    return column;
  }
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const geometry = column.get(rowIndex);
    if (!geometry) continue;
    if (encoding === 'geoarrow.polygon') {
      rewindPolygon(geometry as arrow.Vector, exteriorSign);
    } else {
      const multiPolygon = geometry as arrow.Vector;
      for (let polygonIndex = 0; polygonIndex < multiPolygon.length; polygonIndex++) {
        rewindPolygon(multiPolygon.get(polygonIndex) as arrow.Vector, exteriorSign);
      }
    }
  }
  return column;
}

/** Recursively rewinds area children in a dense union or GeometryCollection list. */
function rewindUnionData(data: arrow.Data, exteriorSign: number): void {
  if (data.type instanceof arrow.DenseUnion) {
    for (let childIndex = 0; childIndex < data.children.length; childIndex++) {
      const childData = data.children[childIndex];
      const childName = data.type.children[childIndex]?.name || '';
      if (childName.startsWith('Polygon')) {
        rewindPolygonVector(new arrow.Vector([childData]), exteriorSign);
      } else if (childName.startsWith('MultiPolygon')) {
        rewindMultiPolygonVector(new arrow.Vector([childData]), exteriorSign);
      } else if (childName.startsWith('GeometryCollection')) {
        rewindUnionData(childData, exteriorSign);
      }
    }
    return;
  }
  if (
    (data.type instanceof arrow.List || data.type instanceof arrow.LargeList) &&
    data.children[0]
  ) {
    rewindUnionData(data.children[0], exteriorSign);
  }
}

/** Rewinds every Polygon row in a union child vector. */
function rewindPolygonVector(vector: arrow.Vector, exteriorSign: number): void {
  for (let rowIndex = 0; rowIndex < vector.length; rowIndex++) {
    const polygon = vector.get(rowIndex);
    if (polygon) rewindPolygon(polygon as arrow.Vector, exteriorSign);
  }
}

/** Rewinds every MultiPolygon row in a union child vector. */
function rewindMultiPolygonVector(vector: arrow.Vector, exteriorSign: number): void {
  for (let rowIndex = 0; rowIndex < vector.length; rowIndex++) {
    const multiPolygon = vector.get(rowIndex) as arrow.Vector | null;
    if (!multiPolygon) continue;
    for (let polygonIndex = 0; polygonIndex < multiPolygon.length; polygonIndex++) {
      const polygon = multiPolygon.get(polygonIndex);
      if (polygon) rewindPolygon(polygon as arrow.Vector, exteriorSign);
    }
  }
}

function rewindPolygon(polygon: arrow.Vector, exteriorSign: number): void {
  for (let ringIndex = 0; ringIndex < polygon.length; ringIndex++) {
    const ring = polygon.get(ringIndex) as arrow.Vector;
    const sign = signedArea(ring);
    if (sign === 0) continue;
    const desiredSign = ringIndex === 0 ? exteriorSign : -exteriorSign;
    if (Math.sign(sign) !== Math.sign(desiredSign)) reverseRing(ring);
  }
}

function signedArea(ring: arrow.Vector): number {
  let area = 0;
  for (let index = 0; index < ring.length; index++) {
    const current = getCoordinate(ring.get(index));
    const next = getCoordinate(ring.get((index + 1) % ring.length));
    if (current && next) area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function reverseRing(ring: arrow.Vector): void {
  const data = ring.data[0] as unknown as {
    type: arrow.DataType;
    offset: number;
    length: number;
    children: {offset: number; values?: ArrayLike<number> & {[index: number]: number}}[];
  };
  if (!(data.type instanceof arrow.FixedSizeList || data.type instanceof arrow.Struct)) {
    throw new Error('GeoArrow rewind requires interleaved or separated coordinate buffers.');
  }
  const coordinateSize =
    data.type instanceof arrow.FixedSizeList ? data.type.listSize : data.type.children.length;
  const coordinateBuffers =
    data.type instanceof arrow.FixedSizeList ? [data.children[0]] : data.children;
  if (!coordinateBuffers.every(child => child?.values)) {
    throw new Error('GeoArrow rewind requires writable coordinate buffers.');
  }
  for (let left = 0, right = data.length - 1; left < right; left++, right--) {
    for (let dimensionIndex = 0; dimensionIndex < coordinateSize; dimensionIndex++) {
      const usesInterleavedCoordinates = data.type instanceof arrow.FixedSizeList;
      const coordinateBuffer = coordinateBuffers[usesInterleavedCoordinates ? 0 : dimensionIndex];
      const values = coordinateBuffer.values!;
      const childOffset = coordinateBuffer.offset;
      const leftLogicalIndex = usesInterleavedCoordinates
        ? left * coordinateSize + dimensionIndex
        : left;
      const rightLogicalIndex = usesInterleavedCoordinates
        ? right * coordinateSize + dimensionIndex
        : right;
      const leftOffset = getBufferIndex(
        values.length,
        childOffset + (usesInterleavedCoordinates ? data.offset * coordinateSize : data.offset),
        leftLogicalIndex
      );
      const rightOffset = getBufferIndex(
        values.length,
        childOffset + (usesInterleavedCoordinates ? data.offset * coordinateSize : data.offset),
        rightLogicalIndex
      );
      const leftValue = values[leftOffset];
      values[leftOffset] = values[rightOffset];
      values[rightOffset] = leftValue;
    }
  }
}

/** Resolves a numeric buffer index for full backing buffers and shortened sliced views. */
function getBufferIndex(bufferLength: number, offset: number, logicalIndex: number): number {
  const physicalIndex = offset + logicalIndex;
  return physicalIndex < bufferLength ? physicalIndex : logicalIndex;
}

function getCoordinate(value: unknown): [number, number] | null {
  if (value && typeof (value as {toArray?: unknown}).toArray === 'function') {
    const values = (value as {toArray(): ArrayLike<unknown>}).toArray();
    return typeof values[0] === 'number' && typeof values[1] === 'number'
      ? [values[0], values[1]]
      : null;
  }
  if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
    const coordinate = value as {x?: unknown; y?: unknown};
    return typeof coordinate.x === 'number' && typeof coordinate.y === 'number'
      ? [coordinate.x, coordinate.y]
      : null;
  }
  return null;
}
