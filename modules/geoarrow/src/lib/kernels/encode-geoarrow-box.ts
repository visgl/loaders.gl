// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {convertWKTToGeometry, getWKBGeometryStatistics} from '@loaders.gl/gis';
import type {GeoArrowDimension, GeoArrowEncoding} from '@loaders.gl/schema';

type BoxDimension = 2 | 3 | 4;
type BoxBounds = number[];

/**
 * Encodes geometry rows as a GeoArrow Box struct without creating geometry objects.
 *
 * @param column Source geometry vector.
 * @param sourceEncoding Source GeoArrow encoding.
 * @param dimension Requested output dimension.
 * @returns Native GeoArrow Box vector.
 */
export function encodeGeoArrowBoxVector(
  column: arrow.Vector,
  sourceEncoding: GeoArrowEncoding,
  dimension?: GeoArrowDimension
): arrow.Vector {
  const coordinateSize = dimension
    ? getDimensionSize(dimension)
    : inferDimension(column, sourceEncoding);
  const effectiveDimension = dimension || getDimensionName(coordinateSize);
  const bounds: (BoxBounds | null)[] = [];
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    const rowBounds = getRowBounds(value, sourceEncoding, effectiveDimension);
    bounds.push(rowBounds && normalizeBounds(rowBounds, coordinateSize));
  }

  const fieldNames = getBoxFieldNames(effectiveDimension);
  const boxType = new arrow.Struct(
    fieldNames.map(name => new arrow.Field(name, new arrow.Float64(), true))
  );
  const children = fieldNames.map((_, fieldIndex) =>
    arrow.makeData({
      type: new arrow.Float64(),
      data: Float64Array.from(bounds, rowBounds => rowBounds?.[fieldIndex] ?? Number.NaN)
    } as any)
  );
  const nullBitmap = new Uint8Array(Math.ceil(column.length / 8));
  let nullCount = 0;
  for (let rowIndex = 0; rowIndex < bounds.length; rowIndex++) {
    if (bounds[rowIndex]) nullBitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
    else nullCount++;
  }
  return arrow.makeVector(
    arrow.makeData({
      type: boxType,
      length: column.length,
      nullCount,
      nullBitmap: nullCount > 0 ? nullBitmap : undefined,
      children
    } as any)
  );
}

function getRowBounds(
  value: unknown,
  sourceEncoding: GeoArrowEncoding,
  dimension?: GeoArrowDimension
): BoxBounds | null {
  if (value == null) return null;
  if (sourceEncoding === 'geoarrow.wkb') {
    const bytes = value as Uint8Array;
    const statistics = getWKBGeometryStatistics(bytes);
    return statistics.bbox ? boundsFromRecord(statistics.bbox, dimension) : null;
  }
  if (sourceEncoding === 'geoarrow.wkt') {
    const geometry = convertWKTToGeometry(value as string);
    const bounds: MutableBounds = {};
    visitValue(geometry, bounds, dimension);
    return bounds.xmin === undefined || bounds.ymin === undefined
      ? null
      : boundsFromRecord(bounds, dimension);
  }
  const bounds: MutableBounds = {};
  visitValue(value, bounds, dimension);
  return bounds.xmin === undefined || bounds.ymin === undefined
    ? null
    : boundsFromRecord(bounds, dimension);
}

type MutableBounds = {
  xmin?: number;
  ymin?: number;
  xmax?: number;
  ymax?: number;
  zmin?: number;
  zmax?: number;
  mmin?: number;
  mmax?: number;
};

function boundsFromRecord(record: MutableBounds, dimension?: GeoArrowDimension): BoxBounds {
  const minimums = [record.xmin!, record.ymin!];
  const maximums = [record.xmax!, record.ymax!];
  if (dimension === 'xyz' || dimension === 'xyzm') {
    minimums.push(record.zmin ?? Number.NaN);
    maximums.push(record.zmax ?? Number.NaN);
  }
  if (dimension === 'xym' || dimension === 'xyzm') {
    minimums.push(dimension === 'xym' ? (record.mmin ?? Number.NaN) : (record.mmin ?? Number.NaN));
    maximums.push(dimension === 'xym' ? (record.mmax ?? Number.NaN) : (record.mmax ?? Number.NaN));
  }
  return [...minimums, ...maximums];
}

function normalizeBounds(bounds: BoxBounds, coordinateSize: BoxDimension): BoxBounds {
  return bounds.slice(0, coordinateSize * 2);
}

function visitValue(value: unknown, bounds: MutableBounds, dimension?: GeoArrowDimension): void {
  if (value == null) return;
  if (isBoxRecord(value)) {
    bounds.xmin = value.xmin;
    bounds.ymin = value.ymin;
    bounds.xmax = value.xmax;
    bounds.ymax = value.ymax;
    bounds.zmin = value.zmin;
    bounds.zmax = value.zmax;
    bounds.mmin = value.mmin;
    bounds.mmax = value.mmax;
    return;
  }
  if (value && typeof value === 'object') {
    const geometry = value as {coordinates?: unknown; geometries?: unknown};
    if ('coordinates' in geometry) {
      visitValue(geometry.coordinates, bounds, dimension);
      return;
    }
    if ('geometries' in geometry) {
      visitValue(geometry.geometries, bounds, dimension);
      return;
    }
  }
  const coordinate = getCoordinate(value);
  if (coordinate) {
    updateBounds(bounds, coordinate, dimension);
    return;
  }
  if (isVectorLike(value)) {
    for (let index = 0; index < value.length; index++)
      visitValue(value.get(index), bounds, dimension);
    return;
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    for (const child of Array.from(value as ArrayLike<unknown>))
      visitValue(child, bounds, dimension);
  }
}

type CoordinateRecord = {x: number; y: number; z?: number; m?: number};

function getCoordinate(value: unknown): CoordinateRecord | null {
  if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
    const record = value as {x: unknown; y: unknown; z?: unknown; m?: unknown};
    return {
      x: record.x as number,
      y: record.y as number,
      z: record.z as number,
      m: record.m as number
    };
  }
  if (value && typeof (value as {toArray?: unknown}).toArray === 'function') {
    return getCoordinate((value as {toArray(): ArrayLike<unknown>}).toArray());
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    const values = value as ArrayLike<unknown>;
    if (typeof values[0] === 'number' && typeof values[1] === 'number') {
      return {x: values[0], y: values[1], z: values[2] as number, m: values[3] as number};
    }
  }
  return null;
}

function updateBounds(
  bounds: MutableBounds,
  coordinate: CoordinateRecord,
  dimension?: GeoArrowDimension
): void {
  updateAxis(bounds, 'x', coordinate.x);
  updateAxis(bounds, 'y', coordinate.y);
  if (dimension === 'xyz' || dimension === 'xyzm') updateAxis(bounds, 'z', coordinate.z);
  if (dimension === 'xym') updateAxis(bounds, 'm', coordinate.z);
  if (dimension === 'xyzm') updateAxis(bounds, 'm', coordinate.m);
}

function updateAxis(bounds: MutableBounds, axis: 'x' | 'y' | 'z' | 'm', value?: number): void {
  if (!Number.isFinite(value)) return;
  const minimumKey = `${axis}min` as keyof MutableBounds;
  const maximumKey = `${axis}max` as keyof MutableBounds;
  bounds[minimumKey] =
    bounds[minimumKey] === undefined ? value : Math.min(bounds[minimumKey]!, value!);
  bounds[maximumKey] =
    bounds[maximumKey] === undefined ? value : Math.max(bounds[maximumKey]!, value!);
}

function isBoxRecord(
  value: unknown
): value is MutableBounds & {xmin: number; ymin: number; xmax: number; ymax: number} {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as {xmin?: unknown}).xmin === 'number' &&
      typeof (value as {ymin?: unknown}).ymin === 'number' &&
      typeof (value as {xmax?: unknown}).xmax === 'number' &&
      typeof (value as {ymax?: unknown}).ymax === 'number'
  );
}

function isVectorLike(value: unknown): value is {length: number; get(index: number): unknown} {
  return Boolean(
    value &&
      typeof (value as {length?: unknown}).length === 'number' &&
      typeof (value as {get?: unknown}).get === 'function'
  );
}

function inferDimension(column: arrow.Vector, sourceEncoding: GeoArrowEncoding): BoxDimension {
  if (sourceEncoding === 'geoarrow.wkb') {
    let coordinateSize: BoxDimension = 2;
    for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
      const value = column.get(rowIndex);
      if (value == null) continue;
      const bytes = value as Uint8Array;
      const statistics = getWKBGeometryStatistics(bytes);
      const hasZ = statistics.bbox?.zmin !== undefined;
      const hasM = statistics.bbox?.mmin !== undefined;
      coordinateSize = Math.max(
        coordinateSize,
        hasZ && hasM ? 4 : hasZ || hasM ? 3 : 2
      ) as BoxDimension;
    }
    return coordinateSize;
  }
  if (column.type instanceof arrow.Struct) {
    const names = column.type.children.map(child => child.name);
    if (names.includes('mmin') && names.includes('zmin')) return 4;
    if (names.includes('mmin') || names.includes('zmin')) return 3;
  }
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const coordinate = findCoordinate(column.get(rowIndex));
    if (coordinate) {
      if (coordinate.z !== undefined && coordinate.m !== undefined) return 4;
      if (coordinate.z !== undefined || coordinate.m !== undefined) return 3;
      return 2;
    }
  }
  return 2;
}

function findCoordinate(value: unknown): CoordinateRecord | null {
  const coordinate = getCoordinate(value);
  if (coordinate) return coordinate;
  if (isVectorLike(value)) {
    for (let index = 0; index < value.length; index++) {
      const result = findCoordinate(value.get(index));
      if (result) return result;
    }
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    for (const child of Array.from(value as ArrayLike<unknown>)) {
      const result = findCoordinate(child);
      if (result) return result;
    }
  }
  return null;
}

function getDimensionSize(dimension: GeoArrowDimension): BoxDimension {
  return dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
}

function getDimensionName(coordinateSize: BoxDimension): GeoArrowDimension {
  return coordinateSize === 2 ? 'xy' : coordinateSize === 4 ? 'xyzm' : 'xyz';
}

function getBoxFieldNames(dimension: GeoArrowDimension): string[] {
  const minimumNames =
    dimension === 'xy'
      ? ['xmin', 'ymin']
      : dimension === 'xyz'
        ? ['xmin', 'ymin', 'zmin']
        : dimension === 'xym'
          ? ['xmin', 'ymin', 'mmin']
          : ['xmin', 'ymin', 'zmin', 'mmin'];
  const maximumNames =
    dimension === 'xy'
      ? ['xmax', 'ymax']
      : dimension === 'xyz'
        ? ['xmax', 'ymax', 'zmax']
        : dimension === 'xym'
          ? ['xmax', 'ymax', 'mmax']
          : ['xmax', 'ymax', 'zmax', 'mmax'];
  return [...minimumNames, ...maximumNames];
}
