// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {scanWKB} from '@math.gl/wkb';
import {makeGeoArrowColumnFromArrowVector} from '@loaders.gl/arrow-geometry';
import type {BinaryPolygonGeometry, GeoArrowEncoding} from '@loaders.gl/schema';
import {getGeoArrowRowBounds as getMathGeoArrowRowBounds} from '@math.gl/geoarrow';
import {makeGeoArrowColumnFromBinaryPolygon} from './binary-polygon-to-geoarrow';
import type {BinaryPolygonToGeoArrowOptions} from './binary-polygon-to-geoarrow';

/** Axis-aligned XY bounds in minX, minY, maxX, maxY order. */
export type GeoArrowBounds = readonly [number, number, number, number];

/**
 * Computes exact per-row XY bounds without creating GeoJSON geometry objects.
 *
 * @param column GeoArrow geometry vector.
 * @param encoding GeoArrow encoding declared for the vector.
 * @returns One bound or `null` per geometry row.
 */
export function getGeoArrowRowBounds(
  column: arrow.Vector,
  encoding: GeoArrowEncoding
): readonly (GeoArrowBounds | null)[];
/** Computes one XY bound per binary polygon through math.gl, preserving empty rows as null. */
export function getGeoArrowRowBounds(
  column: BinaryPolygonGeometry,
  options: BinaryPolygonToGeoArrowOptions
): readonly (GeoArrowBounds | null)[];
/** Dispatches Arrow vectors and legacy binary polygons to their buffer-based bounds paths. */
export function getGeoArrowRowBounds(
  column: arrow.Vector | BinaryPolygonGeometry,
  encodingOrOptions: GeoArrowEncoding | BinaryPolygonToGeoArrowOptions
): readonly (GeoArrowBounds | null)[] {
  if ('polygonIndices' in column) {
    if (typeof encodingOrOptions === 'string') {
      throw new Error('Binary polygon bounds require an explicit dimension option.');
    }
    return getMathGeoArrowRowBounds(makeGeoArrowColumnFromBinaryPolygon(column, encodingOrOptions));
  }
  if (typeof encodingOrOptions !== 'string') {
    throw new Error('Arrow vector bounds require a GeoArrow encoding.');
  }
  const encoding = encodingOrOptions;
  if (encoding !== 'geoarrow.wkb' && encoding !== 'geoarrow.wkt') {
    // Box structs have xmin/ymin fields rather than coordinate x/y fields, so their
    // dimensionality must be supplied explicitly to the shared adapter.
    const names = encoding === 'geoarrow.box' ? column.type.children.map(field => field.name) : [];
    const dimension =
      encoding === 'geoarrow.box'
        ? names.includes('zmin')
          ? names.includes('mmin')
            ? 'xyzm'
            : 'xyz'
          : names.includes('mmin')
            ? 'xym'
            : 'xy'
        : undefined;
    return getMathGeoArrowRowBounds(
      makeGeoArrowColumnFromArrowVector(column, {encoding, dimension})
    );
  }
  const bounds: (GeoArrowBounds | null)[] = [];
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    bounds.push(getGeoArrowBounds(column.get(rowIndex), encoding));
  }
  return bounds;
}

/**
 * Computes exact XY bounds for one GeoArrow geometry cell.
 *
 * WKB uses the existing binary parser; native encodings walk Arrow vectors and coordinate
 * buffers directly. The function is deliberately tolerant of null and empty geometries.
 *
 * @param value GeoArrow cell value.
 * @param encoding GeoArrow encoding declared for the cell.
 * @returns Bounds or `null` when the cell has no finite XY coordinate.
 */
export function getGeoArrowBounds(
  value: unknown,
  encoding: GeoArrowEncoding
): GeoArrowBounds | null {
  if (value == null) return null;
  if (encoding === 'geoarrow.wkb') {
    const bytes = value as Uint8Array;
    const statistics = scanWKB(bytes);
    return statistics.bounds
      ? [
          statistics.bounds.xmin,
          statistics.bounds.ymin,
          statistics.bounds.xmax,
          statistics.bounds.ymax
        ]
      : null;
  }
  if (encoding === 'geoarrow.box' && isBoxValue(value)) {
    return [value.xmin, value.ymin, value.xmax, value.ymax];
  }
  const accumulator: [number, number, number, number] = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY
  ];
  visitCoordinates(value, accumulator);
  return Number.isFinite(accumulator[0]) ? accumulator : null;
}

function visitCoordinates(value: unknown, bounds: [number, number, number, number]): void {
  if (value == null) return;
  const coordinate = getCoordinate(value);
  if (coordinate) {
    updateBounds(bounds, coordinate[0], coordinate[1]);
    return;
  }
  if (isVectorLike(value)) {
    for (let index = 0; index < value.length; index++) visitCoordinates(value.get(index), bounds);
    return;
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    for (const child of Array.from(value as ArrayLike<unknown>)) visitCoordinates(child, bounds);
  }
}

function getCoordinate(value: unknown): [number, number] | null {
  if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
    const record = value as {x: unknown; y: unknown};
    return typeof record.x === 'number' && typeof record.y === 'number'
      ? [record.x, record.y]
      : null;
  }
  if (value && typeof (value as {toArray?: unknown}).toArray === 'function') {
    const coordinate = (value as {toArray(): ArrayLike<unknown>}).toArray();
    return getNumericCoordinate(coordinate);
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return getNumericCoordinate(value as ArrayLike<unknown>);
  }
  return null;
}

function isBoxValue(
  value: unknown
): value is {xmin: number; ymin: number; xmax: number; ymax: number} {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as {xmin?: unknown}).xmin === 'number' &&
      typeof (value as {ymin?: unknown}).ymin === 'number' &&
      typeof (value as {xmax?: unknown}).xmax === 'number' &&
      typeof (value as {ymax?: unknown}).ymax === 'number'
  );
}

function getNumericCoordinate(value: ArrayLike<unknown>): [number, number] | null {
  return typeof value[0] === 'number' && typeof value[1] === 'number' ? [value[0], value[1]] : null;
}

function isVectorLike(value: unknown): value is {length: number; get(index: number): unknown} {
  return Boolean(
    value &&
      typeof (value as {length?: unknown}).length === 'number' &&
      typeof (value as {get?: unknown}).get === 'function'
  );
}

function updateBounds(bounds: [number, number, number, number], x: number, y: number): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  bounds[0] = Math.min(bounds[0], x);
  bounds[1] = Math.min(bounds[1], y);
  bounds[2] = Math.max(bounds[2], x);
  bounds[3] = Math.max(bounds[3], y);
}
